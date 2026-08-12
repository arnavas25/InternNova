import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Loader2, Mail, Users, Download, AlertCircle, Edit2, Eye } from 'lucide-react';
import Modal from '../Modal';
import { callAdminApi } from '../../lib/adminApi';

export default function PremiumStudentsTable({ currentUser, onChange }) {
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);
  
  // Bulk Action loading
  const [bulkBusy, setBulkBusy] = useState(false);

  // Edit Student Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [editForm, setEditForm] = useState({ 
    name: '', phone: '', domain: '', batchName: '', 
    college: '', degree: '', branch: '', currentYear: '', graduationYear: '',
    duration: '', startDate: '', aicteId: '', referralCode: '',
    resumeUrl: '', linkedinUrl: '', githubUrl: ''
  });
  const [editSaving, setEditSaving] = useState(false);

  // Assign Mentor Modal
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [mentorForm, setMentorForm] = useState({ domain: 'Artificial Intelligence & Machine Learning', mentorId: '', target: 'all', studentEmail: '' });

  // View Details Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingApp, setViewingApp] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch approved premium applications
      const { data: apps, error: appsError } = await supabase
        .from('premium_applications')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;
      setApplications(apps || []);

      // 2. Fetch corresponding students to check if credentials were sent
      if (apps && apps.length > 0) {
        const emails = apps.map(a => (a.email || '').trim().toLowerCase());
        const { data: stds, error: stdsError } = await supabase
          .from('students')
          .select('student_id, email, credentials_sent, mentor_name, status')
          .in('email', emails);
          
        if (stdsError) throw stdsError;
        setStudents(stds || []);
      }

      // 3. Fetch Mentors
      const { data: staffRows } = await supabase.from('staff_users').select('*').eq('role', 'mentor');
      if (staffRows) setMentors(staffRows);

      // 4. Extract unique batches for the modal dropdowns
      if (apps) {
        const uniqueBatches = [...new Set(apps.map(a => a.batch_name).filter(Boolean))];
        setBatches(uniqueBatches);
      }

    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const getStudentByEmail = (email) => {
    if (!email) return null;
    return students.find(s => (s.email || '').trim().toLowerCase() === email.trim().toLowerCase());
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(filteredApps.map(a => a.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const sendCredentials = async (appIds) => {
    if (!appIds.length) return;
    if (!confirm(`Send credentials to ${appIds.length} student(s)? This will create their accounts if they don't exist and send an email.`)) return;

    setBulkBusy(true);
    try {
      const res = await callAdminApi('send-credentials', { applicationIds: appIds });
      
      if (res.error) throw new Error(res.error);
      
      const failed = res.results.filter(r => !r.success);
      if (failed.length > 0) {
        alert(`${failed.length} failed. First error: ${failed[0].error}`);
      } else {
        alert(`Successfully sent credentials to ${appIds.length} student(s)!`);
      }
      setSelectedIds([]);
      fetchData();
      if (onChange) onChange();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setBulkBusy(false);
    }
  };

  // CSV Exports
  const exportStudentData = () => {
    const headers = ['Full Name', 'Email', 'Phone', 'College', 'Domain', 'Batch', 'Student ID', 'Status'];
    const csvRows = [headers.join(',')];
    
    filteredApps.forEach(app => {
      const student = getStudentByEmail(app.email);
      csvRows.push([
        `"${app.full_name}"`,
        `"${app.email}"`,
        `"${app.phone}"`,
        `"${app.college}"`,
        `"${app.domain}"`,
        `"${app.batch_name || 'General Cohort'}"`,
        `"${student ? student.student_id : 'Not Generated'}"`,
        `"${student ? student.status : 'Pending'}"`
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `premium_students_data_${new Date().getTime()}.csv`;
    a.click();
  };

  const exportCredentialsData = async () => {
    if (!confirm('This will export Student IDs and generate NEW passwords for all selected students. Use only for bulk setup where email delivery failed.')) return;
    if (selectedIds.length === 0) return alert('Please select students first');
    
    setBulkBusy(true);
    try {
      // Create a temporary endpoint in a real app, but here we can just use the Admin API
      // Since we don't have a specific export credentials endpoint, we'll alert the user
      alert("Please use the 'Send Credentials' button. Bulk Export CSV requires the 'export-credentials' backend which generates passwords. To bypass emails, you would need a new API endpoint. For now, credentials can be exported from the main Students tab.");
    } catch(e) {
      alert('Error: ' + e.message);
    }
    setBulkBusy(false);
  };

  // Edit Details & Mentor
  const openEditModal = (app) => {
    const student = getStudentByEmail(app.email);
    setEditingApp(app);
    setEditForm({
      name: app.full_name,
      phone: app.phone,
      domain: app.domain,
      batchName: app.batch_name || '',
      college: app.college || '',
      degree: app.degree || '',
      branch: app.branch || '',
      currentYear: app.current_year || '',
      graduationYear: app.graduation_year || '',
      duration: app.duration || '',
      startDate: app.start_date || '',
      aicteId: app.aicte_id || '',
      referralCode: app.referral_code || '',
      resumeUrl: app.resume_url || '',
      linkedinUrl: app.linkedin_url || '',
      githubUrl: app.github_url || ''
    });
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      // Update Premium Application
      const { error: appErr } = await supabase.from('premium_applications').update({
        full_name: editForm.name,
        phone: editForm.phone,
        domain: editForm.domain,
        batch_name: editForm.batchName,
        college: editForm.college,
        degree: editForm.degree,
        branch: editForm.branch,
        current_year: editForm.currentYear,
        graduation_year: editForm.graduationYear,
        duration: editForm.duration,
        start_date: editForm.startDate,
        aicte_id: editForm.aicteId,
        referral_code: editForm.referralCode,
        resume_url: editForm.resumeUrl,
        linkedin_url: editForm.linkedinUrl,
        github_url: editForm.githubUrl
      }).eq('id', editingApp.id);
      if (appErr) throw appErr;

      // Update Student if exists
      const student = getStudentByEmail(editingApp.email);
      if (student) {
        const { error: stdErr } = await supabase.from('students').update({
          name: editForm.name,
          phone: editForm.phone,
          domain: editForm.domain,
          batch_name: editForm.batchName
        }).eq('email', editingApp.email.trim().toLowerCase());
        if (stdErr) throw stdErr;
      }

      alert('Updated successfully');
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setEditSaving(false);
  };

  const filteredApps = applications.filter(app => 
    (app.full_name?.toLowerCase().includes(search.toLowerCase()) || 
     app.email?.toLowerCase().includes(search.toLowerCase()) ||
     app.domain?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Premium Students</h2>
      </div>

      <div className="admin-toolbar" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div className="admin-search" style={{ flex: '1 1 300px' }}>
          <Search size={18} />
          <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={exportStudentData}>
            <Download size={15} style={{ marginRight: '6px' }} /> Export Data
          </button>
          <button className="btn btn-outline" onClick={() => setMentorModalOpen(true)}>
            <Users size={15} style={{ marginRight: '6px' }} /> Assign Mentor
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => sendCredentials(selectedIds)} 
            disabled={selectedIds.length === 0 || bulkBusy}
          >
            <Mail size={15} style={{ marginRight: '6px' }} /> 
            {bulkBusy ? 'Sending...' : `Bulk Send Credentials (${selectedIds.length})`}
          </button>
        </div>
      </div>

      {error && <div className="auth-banner auth-banner-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-loading"><Loader2 className="spinner" size={24} /> Loading students...</div>
        ) : filteredApps.length === 0 ? (
          <div className="admin-loading">No premium students found.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input type="checkbox" checked={selectedIds.length === filteredApps.length && filteredApps.length > 0} onChange={handleSelectAll} />
                </th>
                <th>Student</th>
                <th>Domain & Batch</th>
                <th>Credentials</th>
                <th>Mentor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map(app => {
                const student = getStudentByEmail(app.email);
                return (
                  <tr key={app.id}>
                    <td>
                      <input type="checkbox" checked={selectedIds.includes(app.id)} onChange={() => handleSelectOne(app.id)} />
                    </td>
                    <td>
                      <div><strong>{app.full_name}</strong></div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{app.email}</div>
                      {student && <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>{student.student_id}</div>}
                    </td>
                    <td>
                      <div>{app.domain}</div>
                      <div className="badge badge-neutral" style={{ marginTop: '4px' }}>{app.batch_name || 'Unassigned'}</div>
                    </td>
                    <td>
                      {student ? (
                        student.credentials_sent 
                          ? <span className="badge badge-success">Sent</span>
                          : <span className="badge badge-danger">Failed to Send</span>
                      ) : (
                        <span className="badge badge-warning">Pending Setup</span>
                      )}
                    </td>
                    <td>
                      {student?.mentor_name || app.mentor_name ? <span className="badge badge-neutral">{student?.mentor_name || app.mentor_name}</span> : <span className="text-muted">-</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => { setViewingApp(app); setViewModalOpen(true); }} title="View Details">
                          <Eye size={14} /> View
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => openEditModal(app)} title="Edit Details & Mentor">
                          <Edit2 size={14} /> Edit
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => sendCredentials([app.id])} disabled={bulkBusy} title="Send / Resend Credentials">
                          <Mail size={14} /> Send
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={editModalOpen} onClose={() => !editSaving && setEditModalOpen(false)} wide={true}>
        <h2>Edit Student Details</h2>
        <p className="text-muted" style={{ marginBottom: '20px' }}>Update any information the student submitted.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input className="form-control" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
          </div>
          
          <div className="form-group">
            <label>Domain</label>
            <input className="form-control" value={editForm.domain} onChange={e => setEditForm({...editForm, domain: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Batch Name</label>
            <input className="form-control" value={editForm.batchName} onChange={e => setEditForm({...editForm, batchName: e.target.value})} />
          </div>

          <div className="form-group">
            <label>Duration</label>
            <input className="form-control" value={editForm.duration} onChange={e => setEditForm({...editForm, duration: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" className="form-control" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} />
          </div>

          <div className="form-group">
            <label>College</label>
            <input className="form-control" value={editForm.college} onChange={e => setEditForm({...editForm, college: e.target.value})} />
          </div>
          <div className="form-group">
            <label>AICTE ID</label>
            <input className="form-control" value={editForm.aicteId} onChange={e => setEditForm({...editForm, aicteId: e.target.value})} />
          </div>

          <div className="form-group">
            <label>Degree</label>
            <input className="form-control" value={editForm.degree} onChange={e => setEditForm({...editForm, degree: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Branch</label>
            <input className="form-control" value={editForm.branch} onChange={e => setEditForm({...editForm, branch: e.target.value})} />
          </div>

          <div className="form-group">
            <label>Current Year</label>
            <input className="form-control" value={editForm.currentYear} onChange={e => setEditForm({...editForm, currentYear: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Graduation Year</label>
            <input className="form-control" value={editForm.graduationYear} onChange={e => setEditForm({...editForm, graduationYear: e.target.value})} />
          </div>

          <div className="form-group">
            <label>Resume URL</label>
            <input className="form-control" value={editForm.resumeUrl} onChange={e => setEditForm({...editForm, resumeUrl: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Referral Code</label>
            <input className="form-control" value={editForm.referralCode} onChange={e => setEditForm({...editForm, referralCode: e.target.value})} />
          </div>

          <div className="form-group">
            <label>LinkedIn URL</label>
            <input className="form-control" value={editForm.linkedinUrl} onChange={e => setEditForm({...editForm, linkedinUrl: e.target.value})} />
          </div>
          <div className="form-group">
            <label>GitHub URL</label>
            <input className="form-control" value={editForm.githubUrl} onChange={e => setEditForm({...editForm, githubUrl: e.target.value})} />
          </div>
        </div>

        <div className="admin-modal-actions" style={{ marginTop: '30px' }}>
          <button className="btn btn-outline" onClick={() => setEditModalOpen(false)} disabled={editSaving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleEditSave} disabled={editSaving}>
            {editSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Assign Mentor Modal */}
      <Modal open={mentorModalOpen} onClose={() => setMentorModalOpen(false)}>
        <h2 style={{ marginBottom: 20 }}>Assign Mentor</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const mentor = mentors.find((m) => m.id === mentorForm.mentorId);
          if (!mentor) { alert('Select a mentor'); return; }
          
          const payload = { mentor_name: mentor.full_name, mentor_whatsapp: mentor.phone?.replace(/\D/g, '') || '' };
          
          if (mentorForm.target === 'all') {
            const emailsInDomain = applications.filter(a => a.domain === mentorForm.domain).map(a => a.email.toLowerCase());
            if (emailsInDomain.length === 0) { alert('No students found in this domain'); return; }
            await supabase.from('students').update(payload).in('email', emailsInDomain);
            const { error } = await supabase.from('premium_applications').update(payload).in('email', emailsInDomain);
            if (error && !error.message.includes("Could not find the 'mentor_name'")) { alert(error.message); return; }
            alert(`${mentor.full_name} assigned to all students in ${mentorForm.domain}`);
          } else if (mentorForm.target === 'batch') {
            if (!mentorForm.batchName) { alert('Select a batch'); return; }
            const emailsInBatch = applications.filter(a => a.domain === mentorForm.domain && a.batch_name === mentorForm.batchName).map(a => a.email.toLowerCase());
            if (emailsInBatch.length === 0) { alert('No students found in this batch'); return; }
            await supabase.from('students').update(payload).in('email', emailsInBatch);
            const { error } = await supabase.from('premium_applications').update(payload).in('email', emailsInBatch);
            if (error && !error.message.includes("Could not find the 'mentor_name'")) { alert(error.message); return; }
            alert(`${mentor.full_name} assigned to ${mentorForm.batchName} batch in ${mentorForm.domain}`);
          } else {
            if (!mentorForm.studentEmail) { alert('Select a student'); return; }
            await supabase.from('students').update(payload).eq('email', mentorForm.studentEmail.toLowerCase());
            const { error } = await supabase.from('premium_applications').update(payload).eq('email', mentorForm.studentEmail.toLowerCase());
            if (error && !error.message.includes("Could not find the 'mentor_name'")) { alert(error.message); return; }
            alert(`${mentor.full_name} assigned to that student`);
          }
          setMentorModalOpen(false);
          fetchData();
        }}>
          <div className="form-group">
            <label>Domain</label>
            <select className="form-control" value={mentorForm.domain} onChange={(e) => setMentorForm((f) => ({ ...f, domain: e.target.value, studentEmail: '', batchName: '' }))}>
              {[...new Set(applications.map(a => a.domain).filter(Boolean))].map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Mentor</label>
            <select className="form-control" required value={mentorForm.mentorId} onChange={(e) => setMentorForm((f) => ({ ...f, mentorId: e.target.value }))}>
              <option value="">Select a mentor...</option>
              {mentors.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
            {mentors.length === 0 && <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 6 }}>No staff with role "mentor" found yet — add one in the Staff tab first.</p>}
          </div>
          <div className="form-group">
            <label>Apply To</label>
            <select className="form-control" value={mentorForm.target} onChange={(e) => setMentorForm((f) => ({ ...f, target: e.target.value, studentEmail: '', batchName: '' }))}>
              <option value="all">All students in this domain</option>
              <option value="batch">Specific Batch in this domain</option>
              <option value="one">One specific student</option>
            </select>
          </div>
          {mentorForm.target === 'batch' && (
            <div className="form-group">
              <label>Batch</label>
              <select className="form-control" required value={mentorForm.batchName || ''} onChange={(e) => setMentorForm((f) => ({ ...f, batchName: e.target.value }))}>
                <option value="">Select a batch...</option>
                {[...new Set(applications.filter(a => a.domain === mentorForm.domain).map(a => a.batch_name).filter(Boolean))].map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}
          {mentorForm.target === 'one' && (
            <div className="form-group">
              <label>Student</label>
              <select className="form-control" required value={mentorForm.studentEmail} onChange={(e) => setMentorForm((f) => ({ ...f, studentEmail: e.target.value }))}>
                <option value="">Select a student...</option>
                {applications.filter(a => a.domain === mentorForm.domain).map((a) => <option key={a.email} value={a.email}>{a.full_name} ({a.email})</option>)}
              </select>
            </div>
          )}
          <div className="admin-modal-actions" style={{ marginTop: '30px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setMentorModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Assign Mentor</button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)} wide={true}>
        <h2>Student Application Details</h2>
        {viewingApp && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', textAlign: 'left' }}>
            <div className="card" style={{ padding: '16px', background: 'var(--surface-2)' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--primary-color)' }}>Personal Info</h3>
              <p><strong>Name:</strong> {viewingApp.full_name}</p>
              <p><strong>Email:</strong> {viewingApp.email}</p>
              <p><strong>Phone:</strong> {viewingApp.phone}</p>
              <p><strong>College:</strong> {viewingApp.college}</p>
              <p><strong>Degree/Branch:</strong> {viewingApp.degree} in {viewingApp.branch}</p>
              <p><strong>Batch Year:</strong> {viewingApp.current_year} (Graduating {viewingApp.graduation_year})</p>
              {viewingApp.aicte_id && <p><strong>AICTE ID:</strong> {viewingApp.aicte_id}</p>}
            </div>
            <div className="card" style={{ padding: '16px', background: 'var(--surface-2)' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--primary-color)' }}>Program Details</h3>
              <p><strong>Domain:</strong> {viewingApp.domain}</p>
              <p><strong>Duration:</strong> {viewingApp.duration}</p>
              <p><strong>Start Date:</strong> {viewingApp.start_date}</p>
              <p><strong>Batch:</strong> {viewingApp.batch_name || 'Unassigned'}</p>
              <p><strong>Referral Code:</strong> {viewingApp.referral_code || 'None'}</p>
            </div>
            <div className="card" style={{ padding: '16px', background: 'var(--surface-2)' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--primary-color)' }}>Links</h3>
              <p><a href={viewingApp.resume_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>View Resume</a></p>
              {viewingApp.linkedin_url && <p><a href={viewingApp.linkedin_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>LinkedIn Profile</a></p>}
              {viewingApp.github_url && <p><a href={viewingApp.github_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>GitHub Profile</a></p>}
            </div>
            <div className="card" style={{ padding: '16px', background: 'var(--surface-2)' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--primary-color)' }}>Payment Info</h3>
              <p><strong>Order ID:</strong> {viewingApp.razorpay_order_id}</p>
              <p><strong>Payment Status:</strong> <span className="badge badge-success">{viewingApp.payment_status?.toUpperCase() || 'PAID'}</span></p>
              <p><strong>Amount:</strong> ₹{viewingApp.amount}</p>
              <p><strong>Applied On:</strong> {new Date(viewingApp.created_at).toLocaleString()}</p>
            </div>
          </div>
        )}
        <div className="admin-modal-actions" style={{ marginTop: '30px' }}>
          <button className="btn btn-primary" onClick={() => setViewModalOpen(false)}>Close</button>
        </div>
      </Modal>

    </section>
  );
}
