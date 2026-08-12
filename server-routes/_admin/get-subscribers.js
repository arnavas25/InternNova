import { getAdminClient, requireStaffAdmin } from '../_lib.js';

export default async function handler(req, res) {
  // Accept both GET and POST
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = getAdminClient();
    const auth = await requireStaffAdmin(req, admin);
    if (!auth.ok) {
      return res.status(auth.status).json({ error: auth.message, debug: 'Auth failed' });
    }
    if (auth.role === 'mentor') {
      return res.status(403).json({ error: 'Mentors cannot access the newsletter system.' });
    }

    const { data, error } = await admin
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message, debug: 'Supabase query failed', code: error.code });
    }

    return res.status(200).json({ subscribers: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected server error', debug: 'Catch block' });
  }
}
