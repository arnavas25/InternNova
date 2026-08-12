import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Lock } from 'lucide-react';

export default function AddProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    student_name: '',
    college_name: '',
    email: '',
    phone_number: '',
    title: '',
    description: '',
    tech_stack: '',
    repo_link: '',
    live_link: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.student_name || !formData.email) {
      setErrorMsg('Please fill in all required fields (Name, Email, Title, Description).');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      let imageUrl = '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `projects/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('project-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const techArray = formData.tech_stack
        ? formData.tech_stack.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

      const { error: dbError } = await supabase
        .from('projects')
        .insert([
          {
            student_name: formData.student_name,
            college_name: formData.college_name,
            email: formData.email,
            phone_number: formData.phone_number,
            title: formData.title,
            description: formData.description,
            tech_stack: techArray,
            repo_link: formData.repo_link,
            live_link: formData.live_link,
            image_url: imageUrl,
            payment_status: 'paid'
          }
        ]);

      if (dbError) throw dbError;

      alert('Project added successfully!');
      navigate('/projects');
    } catch (err) {
      console.error('Submission Error:', err);
      setErrorMsg(err.message || 'An error occurred while adding the project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '120px 20px 60px',
      backgroundColor: '#fafafa',
      backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        <button 
          onClick={() => navigate('/projects')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}
        >
          <ArrowLeft size={16} /> Back to Projects
        </button>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '36px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)'
        }}>
          <span style={{ 
            fontSize: '0.75rem', 
            letterSpacing: '2px', 
            color: '#d97706', 
            fontWeight: '700', 
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '6px'
          }}>
            — SUBMIT YOUR WORK
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: '0 0 24px 0', fontFamily: 'serif' }}>
            Add New Project
          </h1>

          {errorMsg && (
            <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '20px', border: '1px solid #fecaca' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Student Name */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                Student Name *
              </label>
              <input 
                type="text" 
                name="student_name"
                placeholder="e.g. John Doe"
                value={formData.student_name}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>

            {/* College Name */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                College / University
              </label>
              <input 
                type="text" 
                name="college_name"
                placeholder="e.g. LNCTS"
                value={formData.college_name}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>

            {/* Email Contact (Private) */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                Contact Email * <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>(Private - Admin Only)</span>
              </label>
              <input 
                type="email" 
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>

            {/* Phone Number (Private) */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                Phone Number <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>(Private - Admin Only)</span>
              </label>
              <input 
                type="tel" 
                name="phone_number"
                placeholder="+91 9876543210"
                value={formData.phone_number}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#d97706', backgroundColor: '#fffbeb', padding: '10px 14px', borderRadius: '10px', border: '1px solid #fef3c7' }}>
              <Lock size={14} /> Your email and phone number are kept private with the Admin.
            </div>

            {/* Project Title */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                Project Title *
              </label>
              <input 
                type="text" 
                name="title"
                placeholder="e.g. AI Resume Analyzer"
                value={formData.title}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                Description *
              </label>
              <textarea 
                name="description"
                rows="4"
                placeholder="Brief description of your project..."
                value={formData.description}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }}
              />
            </div>

            {/* Tech Stack */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                Tech Stack (comma-separated)
              </label>
              <input 
                type="text" 
                name="tech_stack"
                placeholder="React, Node.js, Tailwind CSS"
                value={formData.tech_stack}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>

            {/* Repository Link */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                Repository URL
              </label>
              <input 
                type="url" 
                name="repo_link"
                placeholder="https://github.com/username/project"
                value={formData.repo_link}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>

            {/* Live Demo Link */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                Live Demo URL
              </label>
              <input 
                type="url" 
                name="live_link"
                placeholder="https://myproject.vercel.app"
                value={formData.live_link}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                Project Preview Image
              </label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={{ width: '100%', padding: '8px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                marginTop: '12px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '14px',
                borderRadius: '999px',
                fontWeight: '600',
                fontSize: '0.95rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Plus size={18} /> {loading ? 'Submitting...' : 'Submit Project'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
