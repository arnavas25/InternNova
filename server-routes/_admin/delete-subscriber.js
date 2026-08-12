import { getAdminClient, requireStaffAdmin } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();
  const auth = await requireStaffAdmin(req, admin);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });
  if (auth.role === 'mentor') return res.status(403).json({ error: 'Mentors cannot access the newsletter system.' });

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Subscriber ID is required' });

    const { error } = await admin.from('newsletter_subscribers').delete().eq('id', id);
    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
}
