import { getAdminClient, requireStaffAdmin, generatePassword, sendCredentialsEmail } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();
  const auth = await requireStaffAdmin(req, admin);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

  try {
    const { applicationIds } = req.body;
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ error: 'applicationIds array is required' });
    }

    const results = [];

    for (const appId of applicationIds) {
      try {
        // 1. Fetch Application
        const { data: app } = await admin.from('premium_applications').select('*').eq('id', appId).single();
        if (!app) {
          results.push({ id: appId, success: false, error: 'Application not found' });
          continue;
        }

        if (app.status !== 'approved') {
          results.push({ id: appId, success: false, error: 'Application not approved yet' });
          continue;
        }

        let cleanEmail = app.email.trim().toLowerCase();

        // 2. Check if student exists
        const { data: existingStudent } = await admin.from('students').select('id, email, student_id').eq('email', cleanEmail).maybeSingle();
        
        let studentId = '';
        let password = generatePassword();
        let authUserId = null;
        let isAlias = false;

        if (existingStudent) {
          // If student already exists, we will just update their password and send it
          studentId = existingStudent.student_id;
          authUserId = existingStudent.id;
          
          const { error: updateError } = await admin.auth.admin.updateUserById(authUserId, { password });
          if (updateError) throw updateError;
        } else {
          // CREATE NEW STUDENT
          const year = String(new Date().getFullYear()).slice(-2);
          const domain = app.domain;
          const batchName = app.batch_name || 'General Cohort';

          const domainMap = {
            'Web Development': 'WD', 'Python Programming': 'PP', 'Data Science': 'DS',
            'Machine Learning': 'ML', 'Java Programming': 'JP', 'Graphic Design': 'GD',
            'Cyber Security': 'CS', 'Android Development': 'AD', 'App Development': 'AD'
          };
          const domainCode = domainMap[domain] || domain.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'XX';
          
          let batchCode = '00';
          const batchMatch = batchName.match(/\d+/);
          if (batchMatch) batchCode = String(batchMatch[0]).padStart(2, '0');
          
          const prefix = `INST${year}${domainCode}${batchCode}`;

          const { data: lastStudent } = await admin.from('students')
            .select('student_id')
            .like('student_id', `${prefix}%`)
            .order('student_id', { ascending: false })
            .limit(1)
            .single();

          let nextNum = 1;
          if (lastStudent && lastStudent.student_id) {
            const parsed = parseInt(lastStudent.student_id.replace(prefix, ''), 10);
            if (!isNaN(parsed)) nextNum = parsed + 1;
          }
          studentId = `${prefix}${String(nextNum).padStart(4, '0')}`;

          const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email: cleanEmail,
            password,
            email_confirm: true,
            user_metadata: { name: app.full_name, domain },
          });
          if (authError) throw authError;
          authUserId = authData.user.id;

          const batchStartDate = app.start_date || new Date().toISOString().split('T')[0];
          const endDate = new Date(batchStartDate);
          endDate.setDate(endDate.getDate() + 30); // Approximate 1 month

          const { error: dbError } = await admin.from('students').insert({
            id: authUserId,
            student_id: studentId,
            email: cleanEmail,
            name: app.full_name,
            phone: app.phone || null,
            domain: domain.trim(),
            batch_name: batchName,
            batch_start_date: batchStartDate,
            batch_end_date: endDate.toISOString().split('T')[0],
            status: 'Active',
            tasks_total: 0,
            tasks_completed: 0,
            is_admin: false,
            must_change_password: true,
            mentor_name: app.mentor_name || null,
            mentor_whatsapp: app.mentor_whatsapp || null,
          });

          if (dbError) {
            await admin.auth.admin.deleteUser(authUserId);
            throw dbError;
          }

          // Insert Premium Enrollment to mark them as premium
          await admin.from('enrollments').insert({
            student_id: studentId,
            name: app.full_name,
            email: cleanEmail,
            phone: app.phone,
            course_name: domain,
            amount: 499,
            payment_status: 'paid'
          });

          // Retroactive tasks logic
          try {
            let { data: allBatchTasks } = await admin.from('tasks')
              .select('task_title, task_description, week_number, domain, batch_name, due_date, marks, uploaded_by')
              .ilike('domain', domain.trim())
              .ilike('batch_name', batchName)
              .order('week_number', { ascending: true });

            if (!allBatchTasks || allBatchTasks.length === 0) {
              const { data: fallbackTasks } = await admin.from('tasks')
                .select('task_title, task_description, week_number, domain, batch_name, due_date, marks, uploaded_by')
                .ilike('domain', domain.trim())
                .order('week_number', { ascending: true });
              if (fallbackTasks && fallbackTasks.length > 0) allBatchTasks = fallbackTasks;
            }

            if (allBatchTasks && allBatchTasks.length > 0) {
              const seen = new Set();
              const uniqueTasks = allBatchTasks.filter(t => {
                const key = `${t.task_title}||${t.week_number}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });

              const newTaskRows = uniqueTasks.map(t => ({
                student_email: cleanEmail,
                domain: t.domain,
                batch_name: t.batch_name,
                week_number: t.week_number,
                task_title: t.task_title,
                task_description: t.task_description,
                due_date: t.due_date,
                marks: t.marks || 100,
                uploaded_by: t.uploaded_by || 'Admin',
                is_completed: false,
              }));

              for (let i = 0; i < newTaskRows.length; i += 200) {
                await admin.from('tasks').insert(newTaskRows.slice(i, i + 200));
              }
              await admin.from('students').update({ tasks_total: uniqueTasks.length, tasks_completed: 0 }).eq('id', authUserId);
            }
          } catch (taskErr) { console.error('Retroactive task error:', taskErr); }
        }

        // 3. Send Credentials Email
        const loginUrl = `${req.headers.origin || 'https://internnova.co.in'}/login`;
        const emailResult = await sendCredentialsEmail({
          to: cleanEmail,
          name: app.full_name,
          roleLabel: 'Premium Student',
          loginUrl,
          id: studentId,
          password,
          isAlias
        });

        if (!emailResult.sent) {
          await admin.from('students').update({ credentials_sent: false }).eq('id', authUserId);
          results.push({ id: appId, email: cleanEmail, success: false, error: emailResult.reason });
        } else {
          await admin.from('students').update({ credentials_sent: true }).eq('id', authUserId);
          results.push({ id: appId, email: cleanEmail, success: true });
        }

      } catch (err) {
        results.push({ id: appId, success: false, error: err.message });
      }
    }

    return res.status(200).json({ success: true, results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
}
