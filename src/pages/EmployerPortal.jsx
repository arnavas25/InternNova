import React, { useState, useEffect } from 'react';
import { CheckCircle2, FileText, Award, Clock, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function EmployerPortal() {
  const [formData, setFormData] = useState({
    companyName: '',
    hrEmail: '',
    hrPhone: '',
    selectedDomain: 'Web Development'
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic Theme State (Defaulting to Dark Theme)
  const [isDark, setIsDark] = useState(() => !document.body.classList.contains('light-theme'));

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(!document.body.classList.contains('light-theme'));
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const DOMAIN_OPTIONS = [
    'Web Development',
    'Data Analytics',
    'Cyber Security',
    'Artificial Intelligence',
    'Python Programming',
    'Java Development'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('hire_requests').insert([
        {
          company_name: formData.companyName,
          hr_email: formData.hrEmail,
          hr_phone: formData.hrPhone,
          domain: formData.selectedDomain,
          intern_id: 'GENERAL_REQ',
          intern_name: 'Bulk Talent Request',
          status: 'pending'
        }
      ]);

      if (error) {
        console.error('Supabase Insert Error:', error);
        alert(`Error submitting request: ${error.message}`);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Catch Error:', err);
      alert('Network error. Please try again.');
    }
    setLoading(false);
  };

  // Color palette matching Verification Portal screenshot
  const colors = {
    bgPage: isDark ? '#05070e' : '#f8fafc',
    bgCard: isDark ? '#0c101d' : '#ffffff',
    bgInput: isDark ? '#121826' : '#f8fafc',
    bgIcon: isDark ? '#141a29' : '#f1f5f9',
    textMain: isDark ? '#f8fafc' : '#0f172a',
    textSub: isDark ? '#94a3b8' : '#64748b',
    textLabel: isDark ? '#cbd5e1' : '#334155',
    border: isDark ? '#1e293b' : '#e2e8f0',
    btnBg: isDark ? '#f8fafc' : '#0f172a',
    btnText: isDark ? '#0f172a' : '#ffffff',
    iconColor: isDark ? '#38bdf8' : '#0f172a'
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '700',
    color: colors.textLabel,
    display: 'block',
    marginBottom: '6px'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bgInput,
    color: colors.textMain,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bgPage,
      backgroundImage: isDark ? 'radial-gradient(#1e293b 1px, transparent 1px)' : 'radial-gradient(#cbd5e1 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      paddingTop: '60px',
      paddingBottom: '100px',
      fontFamily: 'Inter, system-ui, sans-serif',
      transition: 'background-color 0.2s ease, color 0.2s ease'
    }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#b45309', 
            fontSize: '12px', 
            fontWeight: '800', 
            letterSpacing: '0.1em', 
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            <span style={{ width: '16px', height: '2px', backgroundColor: '#b45309' }}></span>
            TALENT RECRUITMENT PARTNER
          </div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '38px', fontWeight: '800', color: colors.textMain, margin: '0 0 12px 0' }}>
            Hire Industry-Ready Top Performers
          </h1>
          <p style={{ color: colors.textSub, fontSize: '16px', margin: '0 auto', maxWidth: '640px', lineHeight: '1.6' }}>
            InternNova connects hiring teams with pre-evaluated candidates who have completed hands-on capstone tasks with verified project proof.
          </p>
        </div>

        {/* Form & Benefits Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}>
          
          {/* Left Box - Benefits */}
          <div style={{ backgroundColor: colors.bgCard, padding: '36px 32px', borderRadius: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: colors.textMain, marginTop: 0, marginBottom: '28px' }}>
              Why Recruit From InternNova?
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <FeatureItem 
                icon={<Award size={18} style={{ color: colors.iconColor }} />}
                title="Task & Project Verified Interns" 
                desc="Interns are evaluated only after successfully completing real-world assigned tasks and project benchmarks." 
                colors={colors}
              />
              <FeatureItem 
                icon={<FileText size={18} style={{ color: colors.iconColor }} />}
                title="Complete Student Profiles & Resumes" 
                desc="Get direct access to candidates' complete details, structured resumes, and verified work proof links." 
                colors={colors}
              />
              <FeatureItem 
                icon={<DollarSign size={18} style={{ color: colors.iconColor }} />}
                title="Minimal Platform Charges" 
                desc="Highly affordable hiring models with transparent, minimal setup charges for recruitment partners." 
                colors={colors}
              />
              <FeatureItem 
                icon={<Clock size={18} style={{ color: colors.iconColor }} />}
                title="Fast Candidate Turnaround" 
                desc="Receive curated profiles matching your specific tech stack within 24–48 hours." 
                colors={colors}
              />
            </div>
          </div>

          {/* Right Box - Form */}
          <div style={{ backgroundColor: colors.bgCard, padding: '36px 32px', borderRadius: '24px', border: `1px solid ${colors.border}` }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                <CheckCircle2 size={52} style={{ color: '#10b981', marginBottom: '16px' }} />
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: colors.textMain, margin: '0 0 8px 0' }}>
                  Request Received Successfully!
                </h3>
                <p style={{ color: colors.textSub, fontSize: '14px', lineHeight: '1.5' }}>
                  Our team is reviewing your requirements. We will share candidate profiles and resumes directly to your email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: colors.textMain, margin: 0 }}>
                  Request Talent Profiles
                </h2>

                <div>
                  <label style={labelStyle}>Company Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Enter company name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Work Email (HR / Hiring Manager)</label>
                  <input
                    required
                    type="email"
                    placeholder="hr@company.com"
                    value={formData.hrEmail}
                    onChange={(e) => setFormData({ ...formData, hrEmail: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Contact Phone Number</label>
                  <input
                    required
                    type="tel"
                    placeholder="+91 98654XXXXX"
                    value={formData.hrPhone}
                    onChange={(e) => setFormData({ ...formData, hrPhone: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Required Domain</label>
                  <select
                    value={formData.selectedDomain}
                    onChange={(e) => setFormData({ ...formData, selectedDomain: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {DOMAIN_OPTIONS.map((domain) => (
                      <option key={domain} value={domain} style={{ backgroundColor: colors.bgCard, color: colors.textMain }}>
                        {domain}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: colors.btnBg,
                    color: colors.btnText,
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '15px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: '8px',
                    transition: 'all 0.2s ease',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Submitting Request...' : 'Request Candidate Profiles & Resumes'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc, colors }) {
  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <div style={{ backgroundColor: colors.bgIcon, padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: colors.textMain }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '13px', color: colors.textSub, lineHeight: '1.5' }}>{desc}</p>
      </div>
    </div>
  );
}
