import { getAdminClient, requireStaffAdmin } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();
  const auth = await requireStaffAdmin(req, admin);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

  const { taskId, marksObtained, feedback } = req.body;
  if (!taskId) return res.status(400).json({ error: 'Missing taskId' });
  if (marksObtained === undefined) return res.status(400).json({ error: 'Missing marksObtained' });

  try {
    // 1. Fetch the task to verify ownership and get student email & full marks
    const { data: task, error: fetchErr } = await admin.from('tasks').select('*').eq('id', taskId).single();
    if (fetchErr || !task) return res.status(404).json({ error: 'Task not found' });

    // Mentors can only evaluate tasks belonging to their assigned students
    if (auth.role === 'mentor') {
       const { data: staffData } = await admin.from('staff_users').select('full_name').eq('email', auth.email).single();
       const mentorName = staffData?.full_name || 'UNASSIGNED_MENTOR';
       const { data: assignedStudents } = await admin.from('students').select('email').eq('mentor_name', mentorName);
       const allowedEmails = (assignedStudents || []).map(s => s.email);
       if (!allowedEmails.includes(task.student_email)) {
           return res.status(403).json({ error: 'Mentors can only evaluate tasks belonging to their assigned students' });
       }
    }

    // 2. Update the task with marks and feedback
    const { error: updateErr } = await admin.from('tasks').update({
      marks_obtained: Number(marksObtained),
      feedback: feedback || null
    }).eq('id', taskId);
    if (updateErr) throw updateErr;

    // 3. Recalculate student's total marks
    if (task.student_email) {
       // Fetch all evaluated tasks for this student
       const { data: evaluatedTasks } = await admin.from('tasks')
         .select('marks_obtained, marks')
         .eq('student_email', task.student_email)
         .not('marks_obtained', 'is', null);

       let totalObtained = 0;
       let totalFull = 0;
       
       (evaluatedTasks || []).forEach(t => {
         totalObtained += (t.marks_obtained || 0);
         totalFull += (t.marks || 100);
       });

       // Update student table with totals (if the columns exist). If columns don't exist, this might fail,
       // but we'll try catching the error and ignoring it, since leaderboard can also compute it on the fly.
       const { error: studentUpdateErr } = await admin.from('students').update({
         total_marks_obtained: totalObtained,
         total_full_marks: totalFull
       }).eq('email', task.student_email);
       
       if (studentUpdateErr) {
           console.warn('Could not update total_marks on students table, it might not exist:', studentUpdateErr.message);
       }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('evaluate-task error:', err);
    return res.status(500).json({ error: err.message });
  }
}
