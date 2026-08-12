import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { resumeId, jobDescription } = req.body;
  const accessToken = req.headers['x-resume-access-token'];

  if (!resumeId) {
    return res.status(400).json({ error: 'Missing Resume ID' });
  }
  if (!accessToken) {
    return res.status(401).json({ error: 'Missing resume access token' });
  }

  try {
    // 1. Verify Entitlement
    const { data: entitlement, error: entError } = await supabase
      .from('entitlements')
      .select('*')
      .eq('resume_id', resumeId)
      .single();

    if (entError || !entitlement || !entitlement.active) {
      return res.status(403).json({ error: 'No active entitlement found for this Resume ID' });
    }

    // 2. Fetch Resume Profile Data
    const { data: resume, error: resError } = await supabase
      .from('resumes')
      .select('*')
      .eq('resume_id', resumeId)
      .eq('access_token', accessToken)
      .single();

    if (resError || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const isPremium = entitlement.plan === 'Premium' || entitlement.plan === 'Lifetime';
    
    // 3. Call Gemini 3.5 Flash
    let prompt = `
      You are an expert ATS-optimized Resume Writer. Analyze the following user data and structure it into a perfect resume JSON format.
      Target Role: ${resume.profile_data.targetRole || 'Not specified'}
      Skills: ${resume.profile_data.skills || ''}
      Experience: ${resume.profile_data.experience || ''}
      Projects: ${resume.profile_data.projects || ''}
      Education: ${resume.profile_data.education || ''}
      
      Generate a compelling professional summary, organize the skills logically, rewrite the experience and projects using strong action verbs and metrics. 
    `;

    if (isPremium) {
      prompt += `
      Since this is a Premium resume, you MUST AUTO-FILL any missing or sparse information intelligently based on the provided details. 
      For example, if the user didn't write a career objective/summary, generate a highly professional one. If they listed a project name but no description, infer a reasonable professional description based on their skills.
      IMPORTANT: Do not fabricate false degrees, companies, or entirely fake job roles. Only auto-fill descriptions and summaries that logically flow from their existing data.
      Provide an honest ATS score (0-100), strengths, and missing keywords based on standard requirements for the target role.
      `;
      
      if (jobDescription) {
        prompt += `
        CRITICAL INSTRUCTION - JOB DESCRIPTION MATCHING:
        The user wants this resume tailored for the following Job Description:
        """${jobDescription}"""
        
        You must analyze this Job Description and naturally weave its keywords, required skills, and terminology into the user's Summary, Experience, and Projects sections, without inventing fake qualifications.
        Optimize the ATS score specifically against this Job Description.
        `;
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resume: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                skills: { type: Type.STRING },
                experience: { type: Type.STRING },
                projects: { type: Type.STRING },
                education: { type: Type.STRING }
              }
            },
            analysis: {
              type: Type.OBJECT,
              properties: {
                atsScore: { type: Type.INTEGER, description: "ATS Score 0-100" },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
        },
      }
    });

    const aiResponse = JSON.parse(response.text);

    // Filter ATS Score if not entitled
    if (entitlement.plan === 'Basic') {
      aiResponse.analysis.atsScore = null;
    }

    // 4. Save Generated Resume
    await supabase
      .from('resumes')
      .update({ generated_resume: aiResponse })
      .eq('resume_id', resumeId);

    res.status(200).json({ success: true, data: aiResponse });
  } catch (error) {
    console.error('Error generating AI resume:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
