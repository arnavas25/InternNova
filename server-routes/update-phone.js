import { getAdminClient } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();

  // Verify the request comes from an authenticated user
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid session' });

  const { email, phone } = req.body;
  if (!email || !phone) return res.status(400).json({ error: 'Missing email or phone' });

  const cleanEmail = email.toLowerCase().trim();
  const authEmail = userData.user.email.toLowerCase();

  // Security: only allow updating data for profiles that belong to this user
  const [authName] = authEmail.split('@');
  if (!cleanEmail.startsWith(authName)) {
    return res.status(403).json({ error: 'Forbidden: profile does not belong to this user' });
  }

  try {
    const { error: updateError } = await admin
      .from('students')
      .update({ phone: phone })
      .eq('email', cleanEmail);

    if (updateError) {
      console.error('Phone update error:', updateError);
      return res.status(500).json({ error: 'Failed to update phone number' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in update-phone:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
