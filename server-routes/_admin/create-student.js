import { getAdminClient, requireStaffAdmin, generatePassword, sendCredentialsEmail } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();
  const auth = await requireStaffAdmin(req, admin);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

  try {
    const { name, email, phone, domain, batchName, batchStartDate, batchEndDate, offerLetterLink, mentorName, mentorWhatsapp } = req.body;
    if (!name || !email || !domain) return res.status(400).json({ error: 'name, email, and domain are required' });

    let cleanEmail = email.trim().toLowerCase();

    // Check if this email already exists to handle auto-aliasing for multiple domains
    const { data: existingStudent } = await admin.from('students').select('id, email').eq('email', cleanEmail).maybeSingle();
    
    let isAlias = false;
    if (existingStudent) {
      const cleanDomainName = domain.toLowerCase().replace(/[^a-z0-9]/g, '');
      const [userPart, hostPart] = cleanEmail.split('@');
      cleanEmail = `${userPart}+${cleanDomainName}@${hostPart}`;
      isAlias = true;
    }

    // Generate Student ID: INST + Year(26) + Domain(WD) + Batch(01) + Seq(0001)
    const year = String(new Date().getFullYear()).slice(-2);
    
    const domainMap = {
      'Python Programming & Automation': 'PP',
      '☕ Java Software Development': 'JP',
      '🔐 Cybersecurity & Ethical Hacking': 'CS',
      '🤖 Artificial Intelligence & Machine Learning': 'AI',
      '🌐 Full Stack Web Development': 'WD',
      '📊 Data Analytics & Business Intelligence': 'DA'
    };
    const domainCode = domainMap[domain] || domain.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'XX';
    
    let batchCode = '00';
    const batchMatch = (batchName || '').match(/\d+/);
    if (batchMatch) {
      batchCode = String(batchMatch[0]).padStart(2, '0');
    }
    
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
    const studentId = `${prefix}${String(nextNum).padStart(4, '0')}`;
    const password = generatePassword();

    // Create the actual login account.
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { name, domain },
    });
    if (authError) return res.status(500).json({ error: authError.message });

    const start = batchStartDate || new Date().toISOString().split('T')[0];
    const { error: dbError } = await admin.from('students').insert({
      id: authData.user.id,
      student_id: studentId,
      email: cleanEmail,
      name,
      phone: phone || null,
      domain: domain ? domain.trim() : null,
      batch_name: batchName ? batchName.trim() : 'General Cohort',
      batch_start_date: batchStartDate || new Date().toISOString().split('T')[0],
      batch_end_date: batchEndDate || (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })(),
      offer_letter_link: offerLetterLink || null,
      mentor_name: mentorName || null,
      mentor_whatsapp: mentorWhatsapp || null,
      status: 'Active',
      tasks_total: 0,
      tasks_completed: 0,
      is_admin: false,
      must_change_password: !isAlias,
    });
    if (dbError) {
      // Roll back the auth user so we don't leave an orphaned login with no profile.
      await admin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: dbError.message });
    }

    // Retroactively assign existing tasks for this domain + batch to the new student.
    // This ensures students added after tasks were created can still see them.
    try {
      // Get unique task titles+weeks to avoid duplicates
      let { data: allBatchTasks } = await admin.from('tasks')
        .select('task_title, task_description, week_number, domain, batch_name, due_date, marks, uploaded_by')
        .ilike('domain', domain.trim())
        .ilike('batch_name', batchName ? batchName.trim() : 'General Cohort')
        .order('week_number', { ascending: true });

      // Fallback: If this batch has no tasks (e.g. brand new batch), copy template tasks from ANY batch in this domain
      if (!allBatchTasks || allBatchTasks.length === 0) {
        const { data: fallbackTasks } = await admin.from('tasks')
          .select('task_title, task_description, week_number, domain, batch_name, due_date, marks, uploaded_by')
          .ilike('domain', domain.trim())
          .order('week_number', { ascending: true });
          
        if (fallbackTasks && fallbackTasks.length > 0) {
          allBatchTasks = fallbackTasks;
        }
      }

      if (allBatchTasks && allBatchTasks.length > 0) {
          // Deduplicate by task_title + week_number to get unique task templates
          const seen = new Set();
          const uniqueTasks = allBatchTasks.filter(t => {
            const key = `${t.task_title}||${t.week_number}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          const newDomain = domain.trim();
          const newBatch = batchName ? batchName.trim() : 'General Cohort';
          
          const newTaskRows = uniqueTasks.map(t => ({
            student_email: cleanEmail,
            domain: newDomain,
            batch_name: newBatch,
            week_number: t.week_number,
            task_title: t.task_title,
            task_description: t.task_description,
            due_date: t.due_date,
            marks: t.marks || 100,
            uploaded_by: t.uploaded_by || 'Admin',
            is_completed: false,
          }));

          // Insert in chunks of 200
          for (let i = 0; i < newTaskRows.length; i += 200) {
            await admin.from('tasks').insert(newTaskRows.slice(i, i + 200));
          }

          // Update student task counts
          await admin.from('students').update({ tasks_total: uniqueTasks.length, tasks_completed: 0 }).eq('id', authData.user.id);
        }
    } catch (taskErr) {
      // Don't fail student creation if retroactive task assignment fails
      console.error('Retroactive task assignment error (non-fatal):', taskErr);
    }

    const loginUrl = `${req.headers.origin || 'https://internnova.co.in'}/login`;
    const emailResult = await sendCredentialsEmail({
      to: email.trim().toLowerCase(), // Use the original email for delivery and display!
      name, roleLabel: 'Student', loginUrl, id: studentId, password, isAlias
    });

    if (!emailResult.sent) {
      // Track that the email failed so we can easily find it later
      try {
        await admin.from('students').update({ credentials_sent: false }).eq('id', authData.user.id);
      } catch (e) { console.error('Failed to update credentials_sent tracking', e); }
    }

    return res.status(200).json({ studentId, email: cleanEmail, password, emailSent: emailResult.sent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
}
