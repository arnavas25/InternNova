import { getAdminClient, requireStaffAdmin } from '../_lib.js';

export default async function handler(req, res) {
  const admin = getAdminClient();
  const auth = await requireStaffAdmin(req, admin);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

  const { method } = req;
  const isMentor = auth.role === 'mentor';
  
  // Get mentor specifics if needed
  let mentorName = null;
  let allowedStudentEmails = [];
  let allowedDomains = [];
  
  if (isMentor) {
    const { data: staffData } = await admin.from('staff_users').select('full_name').eq('email', auth.email).single();
    mentorName = staffData?.full_name || 'UNASSIGNED_MENTOR';

    // Fetch students assigned to this mentor
    const { data: assignedStudents } = await admin.from('students').select('email, domain').eq('mentor_name', mentorName);
    allowedStudentEmails = (assignedStudents || []).map(s => s.email);
    allowedDomains = [...new Set((assignedStudents || []).map(s => s.domain))];
  }

  try {
    if (method === 'GET') {
      const getTaskQuery = () => {
        let q = admin.from('tasks').select('*');
        if (isMentor) {
          q = q.in('student_email', allowedStudentEmails);
        } else {
          const { filterDomain, filterBatch } = req.query;
          if (filterDomain) q = q.eq('domain', filterDomain);
          if (filterBatch) q = q.eq('batch_name', filterBatch);
        }
        // Deterministic sorting is REQUIRED for pagination, otherwise Postgres drops/duplicates rows
        return q.order('week_number', { ascending: true }).order('id', { ascending: true });
      };

      const fetchAll = async (queryFn) => {
        let allData = [];
        let from = 0;
        const step = 1000;
        while (true) {
          const { data, error } = await queryFn().range(from, from + step - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < step) break;
          from += step;
        }
        return allData;
      };

      if (isMentor && allowedStudentEmails.length === 0) return res.status(200).json([]);

      const data = await fetchAll(getTaskQuery);
      
      if (!data || data.length === 0) return res.status(200).json([]);
      
      // Manually fetch student names to avoid foreign key dependency errors
      // Fetch all students to build a case-insensitive map, preventing search failures caused by Postgres case-sensitivity
      // Use Promise.all to bypass Supabase's 1000 row limit efficiently
      const fetchPromises = [];
      for (let i = 0; i < 10; i++) {
        fetchPromises.push(admin.from('students').select('email, name, student_id').range(i * 1000, (i + 1) * 1000 - 1));
      }
      const studentPages = await Promise.all(fetchPromises);
      const allStudentsData = studentPages.flatMap(p => p.data || []);
      
      let studentMap = {};
      (allStudentsData || []).forEach(s => {
        if (s.email) {
          studentMap[s.email.trim().toLowerCase()] = s;
        }
      });
      
      const mergedData = data.map(t => ({
        ...t,
        students: studentMap[(t.student_email || '').trim().toLowerCase()] || null
      }));
      
      return res.status(200).json(mergedData);
    }
    
    if (method === 'POST') {
      // Assign tasks to batch
      const { assignForm } = req.body;
      if (!assignForm || !assignForm.domain || !assignForm.batch) return res.status(400).json({ error: 'Invalid form data' });
      
      if (isMentor) {
        if (!allowedDomains.includes(assignForm.domain)) {
          return res.status(403).json({ error: 'Mentors can only assign tasks to domains where their assigned students belong' });
        }
      }

      let q = admin.from('students').select('email').ilike('domain', assignForm.domain).ilike('batch_name', assignForm.batch).limit(5000);
      
      // If mentor, only assign to THEIR students within that batch
      if (isMentor) {
        if (allowedStudentEmails.length === 0) return res.status(403).json({ error: 'You have no assigned students' });
        q = q.in('email', allowedStudentEmails);
      }
      
      const { data: students, error: fetchErr } = await q;
        
      if (fetchErr) throw fetchErr;
      if (!students || students.length === 0) return res.status(404).json({ error: 'No matching students found (or none assigned to you in this batch)' });

      // Fetch existing tasks to prevent duplicate assignments if Admin clicks "Assign" multiple times
      const { data: existingTasks } = await admin.from('tasks')
        .select('student_email')
        .ilike('domain', assignForm.domain)
        .ilike('batch_name', assignForm.batch)
        .eq('week_number', Number(assignForm.week))
        .eq('task_title', assignForm.title);
        
      const assignedEmails = new Set((existingTasks || []).map(t => (t.student_email || '').toLowerCase()));

      let fullDesc = assignForm.description;
      if (assignForm.fileUrl) fullDesc += `\n\nFile Attachment: ${assignForm.fileUrl}`;
      if (assignForm.linkUrl) fullDesc += `\n\nReference Link: ${assignForm.linkUrl}`;

      const tasksToInsert = [];
      students.forEach(s => {
        if (!assignedEmails.has((s.email || '').toLowerCase())) {
          tasksToInsert.push({
            student_email: s.email, domain: assignForm.domain, batch_name: assignForm.batch, week_number: Number(assignForm.week),
            task_title: assignForm.title, task_description: fullDesc, due_date: assignForm.dueDate, marks: Number(assignForm.marks) || 100,
            uploaded_by: mentorName || 'Admin', is_completed: false
          });
        }
      });
      
      if (tasksToInsert.length === 0) {
        return res.status(200).json({ success: true, count: 0, message: 'All matching students already have this task.' });
      }

      const CHUNK = 200;
      for (let i = 0; i < tasksToInsert.length; i += CHUNK) {
        const chunk = tasksToInsert.slice(i, i + CHUNK);
        const { error } = await admin.from('tasks').insert(chunk);
        if (error) throw error;
        
        // Update the tasks_total count for each student who received the task
        const emails = chunk.map(t => t.student_email);
        
        // Supabase doesn't easily support dynamic increment for multiple rows via REST in a single call natively without RPC.
        // We have to update them individually or using Promise.all. 
        // Since we are inserting, we can just fetch their current total and update.
        const { data: currentStudents } = await admin.from('students').select('email, tasks_total').in('email', emails);
        if (currentStudents) {
          const updatePromises = currentStudents.map(s => {
            return admin.from('students').update({ tasks_total: (s.tasks_total || 0) + 1 }).eq('email', s.email);
          });
          await Promise.all(updatePromises);
        }
      }
      
      return res.status(200).json({ success: true, count: students.length });
    }
    
    if (method === 'PUT') {
      // Edit task group (multiple task IDs)
      const { taskIds, title, dueDate } = req.body;
      if (!taskIds || !taskIds.length) return res.status(400).json({ error: 'Missing task IDs' });

      // Security check for mentors: ensure all taskIds belong to their students
      if (isMentor) {
         if (allowedStudentEmails.length === 0) return res.status(403).json({ error: 'Cannot edit tasks' });
         const { data: checkTasks, error: checkErr } = await admin.from('tasks').select('student_email').in('id', taskIds);
         if (checkErr) throw checkErr;
         const invalid = checkTasks.some(t => !allowedStudentEmails.includes(t.student_email));
         if (invalid) return res.status(403).json({ error: 'Cannot edit tasks belonging to other students' });
      }
      
      const CHUNK = 200;
      for (let i = 0; i < taskIds.length; i += CHUNK) {
        const chunk = taskIds.slice(i, i + CHUNK);
        const { error } = await admin.from('tasks').update({ task_title: title, due_date: dueDate }).in('id', chunk);
        if (error) throw error;
      }
      return res.status(200).json({ success: true });
    }
    
    if (method === 'DELETE') {
      // Delete task group
      const { taskIds } = req.body;
      if (!taskIds || !taskIds.length) return res.status(400).json({ error: 'Missing task IDs' });

      // Security check for mentors
      if (isMentor) {
         if (allowedStudentEmails.length === 0) return res.status(403).json({ error: 'Cannot delete tasks' });
         const { data: checkTasks, error: checkErr } = await admin.from('tasks').select('student_email').in('id', taskIds);
         if (checkErr) throw checkErr;
         const invalid = checkTasks.some(t => !allowedStudentEmails.includes(t.student_email));
         if (invalid) return res.status(403).json({ error: 'Cannot delete tasks belonging to other students' });
      }
      
      const CHUNK = 200;
      for (let i = 0; i < taskIds.length; i += CHUNK) {
        const chunk = taskIds.slice(i, i + CHUNK);
        const { error } = await admin.from('tasks').delete().in('id', chunk);
        if (error) throw error;
      }
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin-tasks error:', err);
    return res.status(500).json({ error: err.message });
  }
}
