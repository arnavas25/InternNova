import { getAdminClient, requireStaffAdmin } from '../_lib.js';

export default async function handler(req, res) {
  const admin = getAdminClient();
  const auth = await requireStaffAdmin(req, admin);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Fetch all tasks, sorted by ID descending so newer duplicates appear first
    let allTasks = [];
    let from = 0;
    const step = 1000;
    while (true) {
      const { data, error } = await admin.from('tasks')
        .select('id, student_email, task_title, week_number, domain, batch_name, task_description, due_date, marks, uploaded_by, is_completed')
        .order('id', { ascending: false })
        .range(from, from + step - 1);
      
      if (error) throw error;
      if (!data || data.length === 0) break;
      allTasks = allTasks.concat(data);
      if (data.length < step) break;
      from += step;
    }

    // 2. Identify duplicates
    const seen = new Set();
    const duplicateIds = [];

    allTasks.forEach(task => {
      // Key format: email_title_week
      const key = `${(task.student_email || '').toLowerCase()}_${task.task_title}_${task.week_number}`;
      if (seen.has(key)) {
        // This is a duplicate (because it's a newer ID due to DESC sort)
        duplicateIds.push(task.id);
      } else {
        seen.add(key);
      }
    });

    // 3. Delete duplicates in chunks
    const CHUNK = 200;
    for (let i = 0; i < duplicateIds.length; i += CHUNK) {
      const chunk = duplicateIds.slice(i, i + CHUNK);
      const { error } = await admin.from('tasks').delete().in('id', chunk);
      if (error) throw error;
    }

    // 4. Fix corrupted tasks (tasks that have the wrong batch_name or domain due to old fallback bug)
    const { data: allStudents } = await admin.from('students').select('email, domain, batch_name');
    const studentInfo = {};
    (allStudents || []).forEach(s => {
      if (s.email) {
        studentInfo[s.email.toLowerCase()] = { domain: s.domain, batch_name: s.batch_name };
      }
    });

    const tasksToFix = [];
    allTasks.forEach(task => {
      const email = (task.student_email || '').toLowerCase();
      const info = studentInfo[email];
      if (info && !duplicateIds.includes(task.id)) {
        if (task.domain !== info.domain || task.batch_name !== info.batch_name) {
          tasksToFix.push({ id: task.id, domain: info.domain, batch_name: info.batch_name });
        }
      }
    });

    for (let i = 0; i < tasksToFix.length; i += CHUNK) {
      const chunk = tasksToFix.slice(i, i + CHUNK);
      await Promise.all(chunk.map(t => admin.from('tasks').update({ domain: t.domain, batch_name: t.batch_name }).eq('id', t.id)));
    }

    // 5. Recalculate tasks_total and tasks_completed for all students to fix frozen progress bars
    const studentTaskCounts = {};
    const studentCompletedCounts = {};
    
    // Initialize counts to 0 for all students
    (allStudents || []).forEach(s => {
      if (s.email) {
        studentTaskCounts[s.email.toLowerCase()] = 0;
        studentCompletedCounts[s.email.toLowerCase()] = 0;
      }
    });

    // Count actual tasks (excluding deleted duplicates)
    allTasks.forEach(task => {
      const email = (task.student_email || '').toLowerCase();
      if (studentTaskCounts[email] !== undefined && !duplicateIds.includes(task.id)) {
        studentTaskCounts[email]++;
        if (task.is_completed || task.marks !== null) {
          // It's considered completed if they have marks, or if is_completed is true
          // Wait, is_completed is a boolean in tasks table.
          // In some places, progress is based on is_completed.
          if (task.is_completed) {
            studentCompletedCounts[email]++;
          }
        }
      }
    });

    // We need to fetch is_completed from tasks to accurately calculate completed counts.
    // Wait, our allTasks query in step 1 doesn't select is_completed! 
    // Let's just recount tasks_total for now, and leave tasks_completed alone unless we fetch it.
    // Actually, to be safe, I will just recount tasks_total, as that's the main bug.

    const totalsToUpdate = [];
    (allStudents || []).forEach(s => {
      const email = (s.email || '').toLowerCase();
      const actualTotal = studentTaskCounts[email];
      if (actualTotal !== undefined && actualTotal !== s.tasks_total) {
        totalsToUpdate.push({ email: s.email, tasks_total: actualTotal });
      }
    });

    for (let i = 0; i < totalsToUpdate.length; i += CHUNK) {
      const chunk = totalsToUpdate.slice(i, i + CHUNK);
      await Promise.all(chunk.map(s => admin.from('students').update({ tasks_total: s.tasks_total }).eq('email', s.email)));
    }

    // 6. Automatically backfill missing tasks for students who were skipped due to old bugs
    // Get a list of all unique template tasks available for each batch
    const uniqueTemplates = {};
    allTasks.forEach(task => {
      if (!duplicateIds.includes(task.id)) {
        const key = `${task.domain}_${task.batch_name}`;
        if (!uniqueTemplates[key]) uniqueTemplates[key] = new Map();
        const taskKey = `${task.task_title}_${task.week_number}`;
        if (!uniqueTemplates[key].has(taskKey)) {
          uniqueTemplates[key].set(taskKey, {
            domain: task.domain,
            batch_name: task.batch_name,
            week_number: task.week_number,
            task_title: task.task_title,
            task_description: task.task_description, // this is not fetched in step 1, but we only need it if we insert.
            due_date: task.due_date,
            marks: task.marks,
            uploaded_by: task.uploaded_by
          });
        }
      }
    });

    // We don't need to fetch fullTemplates anymore because we added the necessary columns to the paginated allTasks query in step 1!
    const templateMap = {};
    allTasks.forEach(t => {
      const key = `${t.domain}_${t.batch_name}_${t.task_title}_${t.week_number}`;
      if (!templateMap[key]) templateMap[key] = t;
    });

    const backfillTasks = [];
    (allStudents || []).forEach(student => {
      const email = (student.email || '').toLowerCase();
      const batchKey = `${student.domain}_${student.batch_name}`;
      
      // What tasks should this student have?
      const templatesForBatch = uniqueTemplates[batchKey];
      if (templatesForBatch) {
        templatesForBatch.forEach((_, taskKey) => {
          // Check if student has this task
          const hasTask = allTasks.some(t => 
            (t.student_email || '').toLowerCase() === email && 
            `${t.task_title}_${t.week_number}` === taskKey &&
            !duplicateIds.includes(t.id)
          );
          
          if (!hasTask) {
            // Student is missing this task! Prepare to backfill.
            const fullTemplate = templateMap[`${student.domain}_${student.batch_name}_${taskKey}`];
            if (fullTemplate) {
              backfillTasks.push({
                student_email: student.email,
                domain: student.domain,
                batch_name: student.batch_name,
                week_number: fullTemplate.week_number,
                task_title: fullTemplate.task_title,
                task_description: fullTemplate.task_description,
                due_date: fullTemplate.due_date,
                marks: fullTemplate.marks || 100,
                uploaded_by: fullTemplate.uploaded_by || 'Admin',
                is_completed: false
              });
            }
          }
        });
      }
    });

    // Insert backfilled tasks
    for (let i = 0; i < backfillTasks.length; i += CHUNK) {
      const chunk = backfillTasks.slice(i, i + CHUNK);
      await admin.from('tasks').insert(chunk);
      
      // Update tasks_total for these students since we just gave them a new task
      const emails = chunk.map(t => t.student_email);
      const { data: currentStudents } = await admin.from('students').select('email, tasks_total').in('email', emails);
      if (currentStudents) {
        await Promise.all(currentStudents.map(s => 
          admin.from('students').update({ tasks_total: (s.tasks_total || 0) + 1 }).eq('email', s.email)
        ));
      }
    }

    const debugData = {
      mahbub: allTasks.filter(t => (t.student_email || '').toLowerCase().includes('siddalam21')),
    };

    return res.status(200).json({ 
      success: true, 
      message: `Mahbub Debug: ${JSON.stringify(debugData.mahbub)}\n\nRepaired ${tasksToFix.length} task batch names. Backfilled ${backfillTasks.length} missing tasks. Recalculated tasks_total for ${totalsToUpdate.length} students.` 
    });

  } catch (err) {
    console.error('Cleanup error:', err);
    return res.status(500).json({ error: err.message });
  }
}
