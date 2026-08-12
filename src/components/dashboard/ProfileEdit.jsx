import { useState } from 'react';
import { User, Phone, Mail, IdCard, BookOpen, GraduationCap, Save, Pencil, Calendar, Camera, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Custom SVG Icons
const LinkedinIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GithubIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function ProfileEdit({ student, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(student.name || '');
  const [phone, setPhone] = useState(student.phone || '');
  
  // States for Social Links & Photo
  const [linkedin, setLinkedin] = useState(student.linkedin_url || student.linkedin || '');
  const [github, setGithub] = useState(student.github_url || student.github || '');
  const [profileUrl, setProfileUrl] = useState(student.profile_url || student.image || '');
  const [uploading, setUploading] = useState(false);

  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(null);

  // Helper function: Bucket URL se storage path extract karne ke liye
  const extractStoragePath = (url) => {
    if (!url) return null;
    const parts = url.split('/profiles/');
    return parts.length > 1 ? parts[1] : null;
  };

  // 1. Photo Upload / Edit Handler
  const handlePhotoUpload = async (e) => {
    try {
      setUploading(true);
      setBanner(null);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${student.id || student.student_id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Purani file agar exists karti hai toh usko storage se remove kar denge
      if (profileUrl) {
        const oldFilePath = extractStoragePath(profileUrl);
        if (oldFilePath) {
          await supabase.storage.from('profiles').remove([oldFilePath]);
        }
      }

      // Nayi file upload karo
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const newPhotoUrl = publicUrlData.publicUrl;

      // Database me path update karo
      const query = supabase.from('students').update({ profile_url: newPhotoUrl });
      if (student.id) {
        query.eq('id', student.id);
      } else {
        query.eq('student_id', student.student_id);
      }

      const { data, error: updateError } = await query.select();
      if (updateError) throw updateError;

      const updatedRecord = data && data.length > 0 ? data[0] : { ...student, profile_url: newPhotoUrl };

      setProfileUrl(newPhotoUrl);
      setBanner({ type: 'success', text: 'Profile photo updated successfully!' });
      if (onUpdate) onUpdate(updatedRecord);

    } catch (err) {
      console.error(err);
      setBanner({ type: 'error', text: err.message || 'Failed to upload profile photo.' });
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input selection
    }
  };

  // 2. Photo Delete Handler (Deletes from Storage AND Database)
  const handlePhotoDelete = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    try {
      setUploading(true);
      setBanner(null);

      // 1. Storage bucket se delete karein
      if (profileUrl) {
        const filePath = extractStoragePath(profileUrl);
        if (filePath) {
          await supabase.storage.from('profiles').remove([filePath]);
        }
      }

      // 2. Database table update (set profile_url to null)
      const query = supabase.from('students').update({ profile_url: null });
      if (student.id) {
        query.eq('id', student.id);
      } else {
        query.eq('student_id', student.student_id);
      }

      const { data, error: updateError } = await query.select();
      if (updateError) throw updateError;

      const updatedRecord = data && data.length > 0 ? data[0] : { ...student, profile_url: null };

      setProfileUrl('');
      setBanner({ type: 'success', text: 'Profile photo removed successfully!' });
      if (onUpdate) onUpdate(updatedRecord);

    } catch (err) {
      console.error(err);
      setBanner({ type: 'error', text: err.message || 'Failed to remove profile photo.' });
    } finally {
      setUploading(false);
    }
  };

  // 3. Submit Form Data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setBanner(null);
    try {
      const query = supabase
        .from('students')
        .update({ 
          name: name.trim(), 
          phone: phone.trim(),
          linkedin_url: linkedin.trim(),
          github_url: github.trim()
        });

      if (student.id) {
        query.eq('id', student.id);
      } else {
        query.eq('student_id', student.student_id);
      }

      const { data, error } = await query.select();

      if (error) throw error;

      const updatedRecord = data && data.length > 0 ? data[0] : { ...student, name, phone, linkedin_url: linkedin, github_url: github };

      setBanner({ type: 'success', text: 'Profile updated successfully!' });
      if (onUpdate) onUpdate(updatedRecord);
      setEditing(false);
    } catch (err) {
      console.error(err);
      setBanner({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setBusy(false);
    }
  };

  const initials = student.name
    ? student.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'IN';

  const rawDate = student.batch_start_date || student.start_date || student.created_at;
  const startDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';

  return (
    <section className="profile-page-full fade-in-up">
      {/* Hero Banner */}
      <div className="profile-hero">
        <div className="profile-hero-inner">
          
          {/* Avatar Container with Edit & Delete Actions */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {profileUrl ? (
              <img 
                src={profileUrl} 
                alt={student.name} 
                className="profile-avatar-lg"
                style={{ objectFit: 'cover', border: '2px solid var(--accent, #2563eb)' }}
              />
            ) : (
              <div className="profile-avatar-lg">{initials}</div>
            )}

            {/* Action Buttons Overlay */}
            <div style={{
              position: 'absolute',
              bottom: -4,
              right: profileUrl ? -10 : 0,
              display: 'flex',
              gap: '4px'
            }}>
              {/* Upload / Change Photo Button */}
              <label 
                htmlFor="avatar-upload" 
                style={{
                  background: 'var(--accent, #2563eb)',
                  color: '#fff',
                  padding: '6px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  border: '2px solid var(--card-bg, #18181b)'
                }}
                title={profileUrl ? "Change Photo" : "Upload Photo"}
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </label>

              {/* Delete Photo Button (Shown only if photo exists) */}
              {profileUrl && (
                <button
                  type="button"
                  onClick={handlePhotoDelete}
                  disabled={uploading}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    padding: '6px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    border: '2px solid var(--card-bg, #18181b)',
                    outline: 'none'
                  }}
                  title="Remove Photo"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <input 
              type="file" 
              id="avatar-upload" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </div>

          <div className="profile-hero-text">
            <h1>{student.name}</h1>
            <p className="text-muted">{student.domain || 'Intern'} &middot; {student.batch_name || 'N/A'}</p>
            <span
              className={`status-pill status-${(student.status || 'active').toLowerCase()}`}
              style={{ marginTop: 8, display: 'inline-block' }}
            >
              {student.status || 'Active'}
            </span>
          </div>
          {!editing && (
            <button className="btn btn-outline profile-edit-trigger" onClick={() => setEditing(true)}>
              <Pencil size={14} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {banner && (
        <div className={`profile-banner profile-banner-${banner.type}`} style={{ margin: '0 0 20px' }}>
          {banner.text}
        </div>
      )}

      {editing ? (
        <div className="profile-edit-form card">
          <h3 style={{ marginBottom: 20 }}>Edit Your Information</h3>
          <form onSubmit={handleSubmit}>
            <div className="profile-edit-grid">
              <div className="field">
                <label><User size={13} style={{ verticalAlign: -1, marginRight: 4 }} /> Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
              </div>
              <div className="field">
                <label><Phone size={13} style={{ verticalAlign: -1, marginRight: 4 }} /> Phone Number</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXXXXXXX" />
              </div>
              
              {/* LinkedIn Input */}
              <div className="field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LinkedinIcon size={13} color="#0a66c2" /> LinkedIn Profile URL
                </label>
                <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" />
              </div>

              {/* GitHub Input */}
              <div className="field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <GithubIcon size={13} /> GitHub Profile URL
                </label>
                <input type="url" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/username" />
              </div>
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label><Mail size={13} style={{ verticalAlign: -1, marginRight: 4 }} /> Email Address (Read-Only)</label>
              <input type="email" disabled value={student.email} style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>

            <div className="profile-actions" style={{ marginTop: 24 }}>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                <Save size={14} /> {busy ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setName(student.name || '');
                  setPhone(student.phone || '');
                  setLinkedin(student.linkedin_url || student.linkedin || '');
                  setGithub(student.github_url || student.github || '');
                  setEditing(false);
                  setBanner(null);
                }}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="profile-cards-grid">
          <div className="profile-detail-card card">
            <div className="profile-detail-icon"><IdCard size={20} /></div>
            <div className="profile-detail-content">
              <span className="profile-detail-label">Student ID</span>
              <strong>{student.student_id || 'N/A'}</strong>
            </div>
          </div>
          <div className="profile-detail-card card">
            <div className="profile-detail-icon"><Mail size={20} /></div>
            <div className="profile-detail-content">
              <span className="profile-detail-label">Email Address</span>
              <strong>{student.email}</strong>
            </div>
          </div>
          <div className="profile-detail-card card">
            <div className="profile-detail-icon"><Phone size={20} /></div>
            <div className="profile-detail-content">
              <span className="profile-detail-label">Phone Number</span>
              <strong>{student.phone || 'Not added'}</strong>
            </div>
          </div>
          <div className="profile-detail-card card">
            <div className="profile-detail-icon"><BookOpen size={20} /></div>
            <div className="profile-detail-content">
              <span className="profile-detail-label">Internship Domain</span>
              <strong>{student.domain}</strong>
            </div>
          </div>
          <div className="profile-detail-card card">
            <div className="profile-detail-icon"><GraduationCap size={20} /></div>
            <div className="profile-detail-content">
              <span className="profile-detail-label">Batch Cohort</span>
              <strong>{student.batch_name || 'N/A'}</strong>
            </div>
          </div>
          <div className="profile-detail-card card">
            <div className="profile-detail-icon"><Calendar size={20} /></div>
            <div className="profile-detail-content">
              <span className="profile-detail-label">Start Date</span>
              <strong>{startDate}</strong>
            </div>
          </div>

          {/* LinkedIn Display Card */}
          <div className="profile-detail-card card">
            <div className="profile-detail-icon"><LinkedinIcon size={20} color="#0a66c2" /></div>
            <div className="profile-detail-content">
              <span className="profile-detail-label">LinkedIn</span>
              <strong>
                {student.linkedin_url || student.linkedin ? (
                  <a href={student.linkedin_url || student.linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--accent, #2563eb)' }}>
                    View Profile
                  </a>
                ) : 'Not added'}
              </strong>
            </div>
          </div>

          {/* GitHub Display Card */}
          <div className="profile-detail-card card">
            <div className="profile-detail-icon"><GithubIcon size={20} /></div>
            <div className="profile-detail-content">
              <span className="profile-detail-label">GitHub</span>
              <strong>
                {student.github_url || student.github ? (
                  <a href={student.github_url || student.github} target="_blank" rel="noreferrer" style={{ color: 'var(--accent, #2563eb)' }}>
                    View Profile
                  </a>
                ) : 'Not added'}
              </strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
