import { getAdminClient } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { staffId } = req.body;
    if (!staffId) return res.status(400).json({ error: 'staffId is required' });

    const admin = getAdminClient();
    
    // We use the admin client (Service Role) to bypass RLS and fetch the email safely.
    const { data, error } = await admin
      .from('staff_users')
      .select('email, status')
      .eq('staff_id', staffId.trim())
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Invalid Staff ID.' });
    }

    if (data.status !== 'active') {
      return res.status(403).json({ error: 'Your account is inactive. Contact a Super Admin.' });
    }

    return res.status(200).json({ email: data.email });
  } catch (err) {
    console.error('get-staff-email error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
