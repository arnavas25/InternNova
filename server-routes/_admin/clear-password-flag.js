import { getAdminClient } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const admin = getAdminClient();
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid session' });

  const { table, rowId } = req.body;
  if (!table || !rowId) return res.status(400).json({ error: 'Missing table or rowId' });

  if (table !== 'students' && table !== 'staff_users') {
    return res.status(400).json({ error: 'Invalid table' });
  }

  // Ensure the user can only update their own flag
  if (table === 'students') {
    const { data: student } = await admin.from('students').select('email').eq('id', rowId).single();
    if (!student || student.email !== userData.user.email) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else {
    const { data: staff } = await admin.from('staff_users').select('email').eq('id', rowId).single();
    if (!staff || staff.email !== userData.user.email) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  const { error: dbError } = await admin.from(table).update({ must_change_password: false }).eq('id', rowId);
  if (dbError) return res.status(500).json({ error: dbError.message });

  return res.status(200).json({ success: true });
}
