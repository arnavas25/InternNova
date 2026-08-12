import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowRight, Save, Edit3, Briefcase } from 'lucide-react';
import './resume-builder.css';

export default function ResumeBuilder() {
  const { id } = useParams(); // resumeId
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState(null);
  const [resumeRecord, setResumeRecord] = useState(null);
  const [step, setStep] = useState('form'); // 'form', 'editor'
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    targetRole: '',
    skills: '',
    experience: '',
    projects: '',
    education: '',
    certifications: '',
    achievements: '',
    jobDescription: '' // For Premium Job-Oriented Feature
  });

  const [generatedResume, setGeneratedResume] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) {
        navigate('/resume');
        return;
      }
      
      try {
        const accessToken = localStorage.getItem(`INTERNNOVA_RESUME_TOKEN_${id}`);
        if (!accessToken) {
          alert('Your secure resume access token is missing. Please reopen the resume from the original purchase device.');
          navigate('/resume');
          return;
        }

        const res = await fetch(`/api/resume/get-data?id=${id}`, {
          headers: { 'X-Resume-Access-Token': accessToken }
        });
        const data = await res.json();
          
        if (!res.ok || data.error) {
          alert('No active plan found for this Resume ID. Please purchase a plan.');
          navigate('/resume');
          return;
        }
        
        const { entitlement: ent, resume: resData } = data;
          
        if (!resData) {
          alert('Resume record not found.');
          navigate('/resume');
          return;
        }

        setEntitlement(ent);
        setResumeRecord(resData);
        setFormData(prev => ({ ...prev, email: resData.email, ...resData.profile_data }));

        if (resData.generated_resume) {
          setGeneratedResume(resData.generated_resume);
          setStep('editor');
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGeneratedChange = (e, field) => {
    setGeneratedResume({
      ...generatedResume,
      resume: {
        ...generatedResume.resume,
        [field]: e.target.value
      }
    });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      const accessToken = localStorage.getItem(`INTERNNOVA_RESUME_TOKEN_${id}`);
      if (!accessToken) {
        alert('Secure resume access token is missing.');
        return;
      }

      // 1. Save Profile Data
      await fetch('/api/resume/save-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Resume-Access-Token': accessToken
        },
        body: JSON.stringify({ id, resumeData: formData })
      });

      // 2. Call Generation API
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Resume-Access-Token': accessToken
        },
        body: JSON.stringify({ resumeId: id, jobDescription: formData.jobDescription })
      });
      
      const data = await res.json();
      if (data.success) {
        setGeneratedResume(data.data);
        setStep('editor');
      } else {
        alert(data.error || 'Failed to generate AI resume.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveEdits = async () => {
    const accessToken = localStorage.getItem(`INTERNNOVA_RESUME_TOKEN_${id}`);
    if (!accessToken) {
      alert('Secure resume access token is missing.');
      return;
    }

    await fetch('/api/resume/save-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Resume-Access-Token': accessToken
      },
      body: JSON.stringify({ id, generatedResume })
    });
    setIsEditing(false);
    alert('Edits saved successfully!');
  };

  if (loading) return <div style={{padding: 100, textAlign: 'center'}}>Loading Secure Environment...</div>;
  if (!entitlement) return null;

  const isBasic = entitlement.plan === 'Basic';
  const isPremium = entitlement.plan === 'Premium' || entitlement.plan === 'Lifetime';

  return (
    <div className="resume-builder-layout">
      {step === 'form' && (
        <div className="rb-container">
          <div className="rb-header">
            <h1>{isBasic ? 'Basic' : 'Premium'} AI Resume Builder</h1>
            <p>
              {isBasic 
                ? 'Fill in your core details and our AI will generate a professional resume.' 
                : 'Fill in as much detail as you can. Our AI will auto-fill missing gaps and optimize your resume!'}
            </p>
          </div>
          
          <form className="rb-form card" onSubmit={handleGenerate}>
            <div className="grid-col-2">
              <div className="field">
                <label>Full Name</label>
                <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" />
              </div>
              <div className="field">
                <label>Target Role</label>
                <input required name="targetRole" value={formData.targetRole} onChange={handleInputChange} placeholder="Software Engineer" />
              </div>
            </div>
            
            <div className="grid-col-2">
              <div className="field">
                <label>Phone Number</label>
                <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 9876543210" />
              </div>
              <div className="field">
                <label>Email</label>
                <input disabled name="email" value={formData.email} />
              </div>
            </div>

            <div className="field">
              <label>Skills (comma separated)</label>
              <textarea required name="skills" value={formData.skills} onChange={handleInputChange} rows="2" placeholder="React, Node.js, Python..."></textarea>
            </div>

            <div className="field">
              <label>Experience</label>
              <textarea name="experience" value={formData.experience} onChange={handleInputChange} rows="3" placeholder="Briefly describe your past jobs..."></textarea>
            </div>

            {isPremium && (
              <>
                <div className="field">
                  <label>Projects</label>
                  <textarea name="projects" value={formData.projects} onChange={handleInputChange} rows="3" placeholder="List any projects you've worked on..."></textarea>
                </div>
                
                <div className="grid-col-2">
                  <div className="field">
                    <label>Education</label>
                    <input name="education" value={formData.education} onChange={handleInputChange} placeholder="B.Tech Computer Science..." />
                  </div>
                  <div className="field">
                    <label>LinkedIn / GitHub Links</label>
                    <input name="linkedin" value={formData.linkedin} onChange={handleInputChange} placeholder="linkedin.com/in/..." />
                  </div>
                </div>

                <div className="card" style={{background: 'rgba(var(--accent-rgb), 0.05)', borderColor: 'var(--accent)', marginTop: 20}}>
                  <h3 style={{display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', marginBottom: 12}}>
                    <Briefcase size={20} /> Job-Oriented Resume Matcher
                  </h3>
                  <p className="text-muted" style={{fontSize: '0.9rem', marginBottom: 16}}>Paste a Job Description here and our AI will naturally tailor your resume's keywords to match this exact job.</p>
                  <div className="field" style={{marginBottom: 0}}>
                    <textarea name="jobDescription" value={formData.jobDescription} onChange={handleInputChange} rows="4" placeholder="Paste full job description here..."></textarea>
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary btn-block rb-submit-btn" disabled={isGenerating}>
              {isGenerating ? 'AI is Writing your Resume...' : 'Generate AI Resume'}
              {!isGenerating && <ArrowRight size={16} style={{ marginLeft: 8 }} />}
            </button>
          </form>
        </div>
      )}

      {step === 'editor' && generatedResume && (
        <div className="rb-dashboard-container">
          <div className="rb-dash-header card">
            <div className="dash-header-left">
              <h2>Review & Edit</h2>
              <p className="text-muted">You can edit the AI generated content directly before downloading.</p>
            </div>
            <div className="dash-header-actions">
              {isEditing ? (
                <button className="btn btn-primary" onClick={saveEdits}><Save size={16} /> Save Edits</button>
              ) : (
                <button className="btn btn-outline" onClick={() => setIsEditing(true)}><Edit3 size={16} /> Edit Document</button>
              )}
              <button className="btn btn-primary" onClick={() => window.print()}><Download size={16} /> Export PDF</button>
            </div>
          </div>

          <div className="rb-dash-content">
            <div className="rb-document-view">
              <div className="document-paper">
                <h1 style={{textAlign: 'center'}}>{formData.name}</h1>
                <p className="contact-info" style={{textAlign: 'center'}}>{formData.email} | {formData.phone} {formData.linkedin ? `| ${formData.linkedin}` : ''}</p>
                
                <h4>Professional Summary</h4>
                {isEditing ? (
                  <textarea className="form-control" rows="4" value={generatedResume.resume.summary} onChange={(e) => handleGeneratedChange(e, 'summary')} style={{width: '100%', padding: 12}} />
                ) : (
                  <p>{generatedResume.resume.summary}</p>
                )}
                
                <h4>Skills</h4>
                {isEditing ? (
                  <textarea className="form-control" rows="2" value={generatedResume.resume.skills} onChange={(e) => handleGeneratedChange(e, 'skills')} style={{width: '100%', padding: 12}} />
                ) : (
                  <p>{generatedResume.resume.skills}</p>
                )}
                
                {(generatedResume.resume.experience || isEditing) && (
                  <>
                    <h4>Experience</h4>
                    {isEditing ? (
                      <textarea className="form-control" rows="6" value={generatedResume.resume.experience || ''} onChange={(e) => handleGeneratedChange(e, 'experience')} style={{width: '100%', padding: 12}} />
                    ) : (
                      <p style={{whiteSpace: 'pre-wrap'}}>{generatedResume.resume.experience}</p>
                    )}
                  </>
                )}
                
                {(generatedResume.resume.projects || isEditing) && (
                  <>
                    <h4>Projects</h4>
                    {isEditing ? (
                      <textarea className="form-control" rows="6" value={generatedResume.resume.projects || ''} onChange={(e) => handleGeneratedChange(e, 'projects')} style={{width: '100%', padding: 12}} />
                    ) : (
                      <p style={{whiteSpace: 'pre-wrap'}}>{generatedResume.resume.projects}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="rb-dash-sidebar">
              {generatedResume.analysis?.atsScore ? (
                <div className="score-card">
                  <h3>ATS Match Score</h3>
                  <div className="score-circle">{generatedResume.analysis.atsScore}%</div>
                  <p className="text-muted" style={{fontSize: '0.9rem', textAlign: 'center', marginTop: 16}}>
                    Optimized for: {formData.targetRole}
                  </p>
                </div>
              ) : (
                <div className="score-card locked">
                  <h3>ATS Score Locked</h3>
                  <p className="text-muted" style={{fontSize: '0.9rem', marginTop: 12}}>Premium features are not available on the Basic plan.</p>
                </div>
              )}

              <div className="tools-card">
                <h3>Quick Actions</h3>
                <ul className="tools-list">
                  <li><button className="btn btn-outline btn-block" onClick={() => setStep('form')}>Re-run AI Generation</button></li>
                  <li><button className="btn btn-outline btn-block">Download DOCX</button></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
