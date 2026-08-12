import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { id } = req.query;
  const accessToken = req.headers['x-resume-access-token'];
  if (!id) return res.status(400).json({ error: 'Missing Resume ID' });
  if (!accessToken) return res.status(401).json({ error: 'Missing resume access token' });

  try {
    const { data: resData, error: resError } = await supabase
      .from('resumes')
      .select('resume_id, email, plan, mode, resume_type, profile_data, generated_resume, preview_html, created_at, updated_at')
      .eq('resume_id', id)
      .eq('access_token', accessToken)
      .single();

    if (resError || !resData) {
      return res.status(404).json({ error: 'Resume not found or access denied' });
    }

    const { data: ent, error: entError } = await supabase
      .from('entitlements')
      .select('*')
      .eq('resume_id', id)
      .single();

    if (entError || !ent || !ent.active) {
      return res.status(404).json({ error: 'No active plan found' });
    }

    return res.status(200).json({ entitlement: ent, resume: resData });
  } catch (error) {
    console.error('Error fetching resume data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
