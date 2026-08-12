import { getAdminClient } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();

  // Verify auth
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid session' });

  const { taskId, isCompleted, submissionLink, studentEmail, clearSubmission } = req.body;
  if (!taskId) return res.status(400).json({ error: 'Missing taskId' });

  const authEmail = userData.user.email.toLowerCase();
  const cleanStudentEmail = (studentEmail || '').toLowerCase().trim();

  // Security: verify the student email belongs to this user
  const [authName] = authEmail.split('@');
  if (cleanStudentEmail && !cleanStudentEmail.startsWith(authName)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Verify the task belongs to this student
    const { data: task } = await admin.from('tasks').select('student_email').eq('id', taskId).maybeSingle();
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!task.student_email.toLowerCase().startsWith(authName)) {
      return res.status(403).json({ error: 'Forbidden: task does not belong to this user' });
    }

    // Block if student is Inactive
    const { data: student } = await admin.from('students').select('status').eq('email', task.student_email).maybeSingle();
    if (student && student.status === 'Inactive') {
      return res.status(403).json({ error: 'Your account is marked as Inactive. You cannot submit or modify tasks.' });
    }

    // Update task
    const updateData = {};
    if (clearSubmission) {
      // Delete submission and reset completion
      updateData.submission_link = null;
      updateData.is_completed = false;
      updateData.submission_date = null;
    } else {
      if (typeof isCompleted === 'boolean') updateData.is_completed = isCompleted;
      if (submissionLink !== undefined) {
        updateData.submission_link = submissionLink;
        updateData.is_completed = true;
        updateData.submission_date = new Date().toISOString();
      }
    }

    const { error: updateError } = await admin.from('tasks').update(updateData).eq('id', taskId);
    if (updateError) throw updateError;

    // Update student task counts if studentEmail is provided
    if (cleanStudentEmail) {
      const { data: allTasks } = await admin.from('tasks').select('is_completed').eq('student_email', cleanStudentEmail);
      if (allTasks) {
        const total = allTasks.length;
        const completed = allTasks.filter(t => t.is_completed).length;
        await admin.from('students').update({ tasks_total: total, tasks_completed: completed }).eq('email', cleanStudentEmail);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('update-task error:', err);
    return res.status(500).json({ error: err.message });
  }
}
