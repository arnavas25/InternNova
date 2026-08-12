import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { id, resumeData, atsScore, generatedResume } = req.body;
  const accessToken = req.headers['x-resume-access-token'];

  if (!id) return res.status(400).json({ error: 'Missing Resume ID' });
  if (!accessToken) return res.status(401).json({ error: 'Missing resume access token' });

  try {
    const updatePayload = {};
    if (resumeData !== undefined) updatePayload.profile_data = resumeData;
    if (atsScore !== undefined) updatePayload.ats_score = atsScore;
    if (generatedResume !== undefined) updatePayload.generated_resume = generatedResume;

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const { data, error: updateError } = await supabase
      .from('resumes')
      .update(updatePayload)
      .eq('resume_id', id)
      .eq('access_token', accessToken)
      .select('resume_id')
      .single();

    if (updateError || !data) {
      return res.status(403).json({ error: 'Resume not found or access denied' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving resume data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
