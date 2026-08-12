import { getAdminClient } from './_lib.js';

export default async function handler(req, res) {
  const admin = getAdminClient();
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const cleanEmail = email.toLowerCase().trim();
  const [namePart, domainPart] = cleanEmail.split('@');

  const { data, error } = await admin
    .from('students')
    .select('*')
    .ilike('email', `${namePart}%@${domainPart}`);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ profiles: data });
}
