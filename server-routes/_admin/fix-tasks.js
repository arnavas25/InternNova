import { getAdminClient, requireStaffAdmin } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();
  const auth = await requireStaffAdmin(req, admin);
  
  // requireStaffAdmin allows admin, super_admin, and mentor.
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

  try {
    // Limit to 200 tasks to prevent Vercel 10-second timeout for large batches
    const { data, error } = await admin.from('tasks')
      .select('id, student_email, is_completed')
      .not('submission_link', 'is', null)
      .eq('is_completed', false)
      .limit(200);
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(200).json({ message: 'All tasks are already ticked! Nothing to fix.' });
    }

    const { error: upErr } = await admin.from('tasks').update({ is_completed: true }).in('id', data.map(t => t.id));
    if (upErr) throw upErr;

    // Update students count in parallel to save time
    const emails = [...new Set(data.map(t => t.student_email))];
    await Promise.all(emails.map(async (email) => {
      const { data: allTasks } = await admin.from('tasks').select('is_completed').eq('student_email', email);
      if (allTasks) {
        const total = allTasks.length;
        const completed = allTasks.filter(t => t.is_completed).length;
        await admin.from('students').update({ tasks_total: total, tasks_completed: completed }).eq('email', email);
      }
    }));
    
    let msg = `Successfully ticked ${data.length} tasks and updated ${emails.length} students!`;
    if (data.length === 200) msg += " (There may be more, click the button again to process the next batch!)";
    
    return res.status(200).json({ message: msg });
  } catch (err) {
    console.error('fix-tasks error:', err);
    return res.status(500).json({ error: err.message });
  }
}
