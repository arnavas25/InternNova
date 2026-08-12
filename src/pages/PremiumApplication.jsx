import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Upload, ArrowRight, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import './apply.css';

export default function PremiumApplication() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState(null);

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    college: '', degree: '', branch: '', currentYear: '', graduationYear: '',
    domain: '', duration: '', startDate: '',
    linkedinUrl: '', githubUrl: '',
    referralCode: '', aicteId: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setError('Resume file must be less than 5MB');
      return;
    }
    setResumeFile(file);
    setError('');
  };

  const validateStep1 = () => {
    if (!form.fullName || !form.email || !form.phone) return 'Please fill all personal details.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email format.';
    return '';
  };

  const validateStep2 = () => {
    if (!form.college || !form.degree || !form.branch || !form.currentYear || !form.graduationYear) return 'Please fill all academic details.';
    return '';
  };

  const validateStep3 = () => {
    if (!form.domain || !form.duration || !form.startDate) return 'Please select domain, duration, and start date.';
    if (!resumeFile) return 'Please upload your resume.';
    return '';
  };

  const proceed = () => {
    let err = '';
    if (step === 1) err = validateStep1();
    if (step === 2) err = validateStep2();
    if (step === 3) err = validateStep3();

    if (err) {
      setError(err);
      return;
    }
    setError('');
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      submitApplication();
    }
  };

  const submitApplication = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 1. Upload Resume
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${Date.now()}_${form.fullName.replace(/\s+/g, '_')}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(`applications/${fileName}`, resumeFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error('Failed to upload resume: ' + uploadError.message);
      
      const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(`applications/${fileName}`);
      const resumeUrl = publicUrlData.publicUrl;

      // 2. Initialize Payment
      const res = await fetch('/api/premium-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      });
      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Failed to initialize payment');

      // 3. Open Razorpay
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'InternNova',
        description: 'Premium Internship Application',
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            setLoading(true);
            const verifyRes = await fetch('/api/premium-application', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'verify',
                ...response,
                form: { ...form, resumeUrl }
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed.');
            setStep(4); // Success step
          } catch (err) {
            console.error(err);
            setError(err.message || 'Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: '#CE9C4C'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setError('Payment cancelled. Please try again.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setLoading(false);
        setError(response.error.description || 'Payment failed.');
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      setError(err.message || 'Application submission failed.');
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Header />
      <div style={{ paddingTop: '100px', flex: 1, paddingBottom: '60px' }}>
        <div className="container" style={{ maxWidth: '700px' }}>
          
          {step < 4 && (
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 style={{ fontSize: '2.5rem', color: 'var(--text)', marginBottom: '10px' }}>Premium Application</h1>
              <p style={{ color: 'var(--text-muted)' }}>Fill in your details accurately. Your resume will be strictly reviewed.</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ 
                    height: '6px', 
                    width: '60px', 
                    borderRadius: '4px',
                    backgroundColor: step >= i ? 'var(--accent)' : 'var(--border)',
                    transition: '0.3s'
                  }} />
                ))}
              </div>
            </div>
          )}

          {step === 4 ? (
            <div className="card" style={{ padding: '60px 40px', textAlign: 'center', border: '2px solid var(--ok-500)', background: 'var(--ok-tint)' }}>
              <CheckCircle size={64} color="var(--ok-500)" style={{ margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: '2rem', color: 'var(--text)', marginBottom: '16px' }}>Application Received!</h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text)', lineHeight: 1.6, marginBottom: '24px' }}>
                Thank you for applying to the Premium Internship track. Your payment of ₹499 was successful. 
                Our team is currently reviewing your application and resume. 
              </p>
              <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: '8px', marginBottom: '30px', textAlign: 'left' }}>
                <p style={{ margin: '0 0 8px', color: 'var(--text-h)' }}><strong>Next Steps:</strong></p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-muted)' }}>
                  <li>We have sent a confirmation email to <strong>{form.email}</strong>.</li>
                  <li>Application reviews typically take 24-48 hours.</li>
                  <li>Upon approval, you will receive another email containing your Student ID and Dashboard Login credentials.</li>
                </ul>
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/')}>Return Home</button>
            </div>
          ) : (
            <div className="card" style={{ padding: '40px', position: 'relative' }}>
              
              {loading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(14, 21, 38, 0.8)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                  <Loader2 className="spinner" size={40} color="var(--accent)" style={{ marginBottom: '16px' }} />
                  <p style={{ color: '#FFF', fontWeight: 600 }}>Processing Application...</p>
                </div>
              )}

              {error && (
                <div className="auth-banner auth-banner-error" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              {step === 1 && (
                <div className="form-step">
                  <h3 style={{ marginBottom: '24px', color: 'var(--text)', fontSize: '1.4rem' }}>Personal Details</h3>
                  <div className="form-group">
                    <label>Full Name <span style={{ color: 'red' }}>*</span></label>
                    <input type="text" name="fullName" value={form.fullName} onChange={handleChange} className="form-control" placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label>Email Address <span style={{ color: 'red' }}>*</span></label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} className="form-control" placeholder="john@example.com" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number <span style={{ color: 'red' }}>*</span></label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="form-control" placeholder="+91 XXXXXXXXXX" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="form-step">
                  <h3 style={{ marginBottom: '24px', color: 'var(--text)', fontSize: '1.4rem' }}>Academic Details</h3>
                  <div className="form-group">
                    <label>College/University Name <span style={{ color: 'red' }}>*</span></label>
                    <input type="text" name="college" value={form.college} onChange={handleChange} className="form-control" placeholder="ABC Institute of Technology" />
                  </div>
                  <div className="form-group">
                    <label>AICTE Student ID <span style={{ color: 'var(--text-muted)', fontSize: '0.85em', fontWeight: 'normal' }}>(Optional)</span></label>
                    <input type="text" name="aicteId" value={form.aicteId} onChange={handleChange} className="form-control" placeholder="e.g. STU679124..." />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Degree <span style={{ color: 'red' }}>*</span></label>
                      <input type="text" name="degree" value={form.degree} onChange={handleChange} className="form-control" placeholder="B.Tech, B.Sc, BCA, etc." />
                    </div>
                    <div className="form-group">
                      <label>Branch / Major <span style={{ color: 'red' }}>*</span></label>
                      <input type="text" name="branch" value={form.branch} onChange={handleChange} className="form-control" placeholder="Computer Science" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Current Year <span style={{ color: 'red' }}>*</span></label>
                      <select name="currentYear" value={form.currentYear} onChange={handleChange} className="form-control">
                        <option value="">Select Year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Graduated">Graduated</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Expected Graduation Year <span style={{ color: 'red' }}>*</span></label>
                      <input type="text" name="graduationYear" value={form.graduationYear} onChange={handleChange} className="form-control" placeholder="e.g. 2026" />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="form-step">
                  <h3 style={{ marginBottom: '24px', color: 'var(--text)', fontSize: '1.4rem' }}>Internship & Documents</h3>
                  
                  <div className="form-group">
                    <label>Internship Domain <span style={{ color: 'red' }}>*</span></label>
                    <select name="domain" value={form.domain} onChange={handleChange} className="form-control">
                      <option value="">Select Domain</option>
                      <option value="Python Programming & Automation">Python Programming & Automation</option>
                      <option value="☕ Java Software Development">☕ Java Software Development</option>
                      <option value="🔐 Cybersecurity & Ethical Hacking">🔐 Cybersecurity & Ethical Hacking</option>
                      <option value="🤖 Artificial Intelligence & Machine Learning">🤖 Artificial Intelligence & Machine Learning</option>
                      <option value="🌐 Full Stack Web Development">🌐 Full Stack Web Development</option>
                      <option value="📊 Data Analytics & Business Intelligence">📊 Data Analytics & Business Intelligence</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Preferred Duration <span style={{ color: 'red' }}>*</span></label>
                      <select name="duration" value={form.duration} onChange={handleChange} className="form-control">
                        <option value="">Select Duration</option>
                        <option value="4 Weeks">4 Weeks</option>
                        <option value="6 Weeks">6 Weeks</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Preferred Start Date <span style={{ color: 'red' }}>*</span></label>
                      <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="form-control" />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label>Upload Resume (PDF only) <span style={{ color: 'red' }}>*</span></label>
                    <div style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '20px', textAlign: 'center', background: 'var(--surface)', position: 'relative' }}>
                      <input type="file" accept=".pdf" onChange={handleFileChange} style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', cursor: 'pointer' }} />
                      <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                      {resumeFile ? (
                        <p style={{ margin: 0, color: 'var(--accent)', fontWeight: 500 }}>{resumeFile.name}</p>
                      ) : (
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Click or drag file to upload (Max 5MB)</p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>LinkedIn Profile (Optional)</label>
                      <input type="url" name="linkedinUrl" value={form.linkedinUrl} onChange={handleChange} className="form-control" placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div className="form-group">
                      <label>GitHub / Portfolio (Optional)</label>
                      <input type="url" name="githubUrl" value={form.githubUrl} onChange={handleChange} className="form-control" placeholder="https://github.com/..." />
                    </div>
                  </div>

                  
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>Referral Code (Optional)</label>
                    <input type="text" name="referralCode" value={form.referralCode} onChange={handleChange} className="form-control" placeholder="e.g. INNOVA50" />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                {step > 1 ? (
                  <button className="btn btn-outline" onClick={() => setStep(step - 1)} disabled={loading}>Back</button>
                ) : (
                  <div></div>
                )}
                
                <button className="btn btn-primary" onClick={proceed} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {step === 3 ? (loading ? 'Processing...' : `Pay ₹499 & Submit`) : 'Next Step'} 
                  {!loading && step < 3 && <ArrowRight size={18} />}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
}
