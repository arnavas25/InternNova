import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Loader2, Check, X, Eye, FileText, AlertCircle, Edit2 } from 'lucide-react';
import Modal from '../Modal';
import { callAdminApi } from '../../lib/adminApi';

export default function PremiumAppsTable({ currentUser }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Modals
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Batch selection for approval
  const [batches, setBatches] = useState([]);
  const [batchOption, setBatchOption] = useState('existing'); // 'existing' or 'create_new'
  const [selectedBatch, setSelectedBatch] = useState('');
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchStartDate, setNewBatchStartDate] = useState('');
  const [newBatchEndDate, setNewBatchEndDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Edit State
  const [editForm, setEditForm] = useState({
    name: '', phone: '', domain: '', college: '', degree: '', branch: '',
    currentYear: '', graduationYear: '', duration: '', startDate: '',
    aicteId: '', referralCode: '', resumeUrl: '', linkedinUrl: '', githubUrl: ''
  });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchApps();
    fetchBatches();
  }, [filter]);

  const fetchApps = async () => {
    setLoading(true);
    let q = supabase.from('premium_applications').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') {
      q = q.eq('status', filter);
    }
    const { data, error } = await q;
    if (error) setError(error.message);
    else setApps(data || []);
    setLoading(false);
  };

  const fetchBatches = async () => {
    const { data } = await supabase.from('batches').select('batch_name, domain').order('created_at', { ascending: false });
    if (data) setBatches(data);
  };

  const filteredApps = apps.filter(app => 
    (app.full_name?.toLowerCase().includes(search.toLowerCase()) || 
     app.email?.toLowerCase().includes(search.toLowerCase()) ||
     app.domain?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleApproveSubmit = async () => {
    if (batchOption === 'existing' && !selectedBatch) {
      alert("Please select a batch.");
      return;
    }
    if (batchOption === 'create_new' && (!newBatchName || !newBatchStartDate)) {
      alert("Please provide batch name and start date.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await callAdminApi('approve-premium', {
        applicationId: selectedApp.id,
        batchOption: batchOption === 'existing' ? selectedBatch : 'create_new',
        newBatchName,
        newBatchStartDate,
        newBatchEndDate
      });
      if (res.success) {
        alert(res.message || 'Application approved successfully!');
        setApproveModalOpen(false);
        setSelectedApp(null);
        fetchApps();
      } else {
        throw new Error(res.error || 'Failed to approve');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!confirm('Are you sure you want to reject this application? This will send a rejection and refund email to the student.')) return;
    setActionLoading(true);
    try {
      const res = await callAdminApi('reject-premium', { applicationId: selectedApp.id });
      if (res.success) {
        alert(res.message || 'Application rejected successfully!');
        setRejectModalOpen(false);
        setSelectedApp(null);
        fetchApps();
      } else {
        throw new Error(res.error || 'Failed to reject');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (app) => {
    setSelectedApp(app);
    setEditForm({
      name: app.full_name,
      phone: app.phone,
      domain: app.domain,
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const { error } = await supabase.from('premium_applications').update({
        full_name: editForm.name,
        phone: editForm.phone,
        domain: editForm.domain,
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
      }).eq('id', selectedApp.id);
      
      if (error) throw error;
      
      alert('Application details updated successfully!');
      setEditModalOpen(false);
      fetchApps();
    } catch (err) {
      alert('Error saving changes: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Premium Applications</h2>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={18} />
          <input type="text" placeholder="Search by name, email, or domain..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="admin-filters">
          <select className="form-control" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {error && <div className="auth-banner auth-banner-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-loading"><Loader2 className="spinner" size={24} /> Loading applications...</div>
        ) : filteredApps.length === 0 ? (
          <div className="admin-loading">No applications found.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Domain</th>
                <th>College</th>
                <th>Referral</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map(app => (
                <tr key={app.id}>
                  <td>
                    <div><strong>{app.full_name}</strong></div>
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>{app.email}</div>
                  </td>
                  <td>
                    <div><strong>{app.domain}</strong></div>
                    {app.duration && <div className="text-muted" style={{ fontSize: '0.85rem' }}>{app.duration}</div>}
                    {app.start_date && <div className="text-muted" style={{ fontSize: '0.85rem' }}>Starts: {new Date(app.start_date).toLocaleDateString()}</div>}
                  </td>
                  <td>
                    <div>{app.college}</div>
                    {app.aicte_id && <div className="text-muted" style={{ fontSize: '0.85rem' }}>AICTE: {app.aicte_id}</div>}
                  </td>
                  <td>{app.referral_code ? <span className="badge badge-neutral">{app.referral_code}</span> : '-'}</td>
                  <td>{new Date(app.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'danger' : 'neutral'}`}>
                      {app.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => { setSelectedApp(app); setViewModalOpen(true); }} title="View Details">
                        <Eye size={14} /> View
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => openEditModal(app)} title="Edit Application">
                        <Edit2 size={14} /> Edit
                      </button>
                      {app.status === 'pending' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => { setSelectedApp(app); setApproveModalOpen(true); }} title="Approve">
                            <Check size={14} /> Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => { setSelectedApp(app); setRejectModalOpen(true); }} title="Reject">
                            <X size={14} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* APPROVE MODAL */}
      <Modal open={approveModalOpen} onClose={() => !actionLoading && setApproveModalOpen(false)}>
        <h2>Approve Application</h2>
        <p className="text-muted" style={{ marginBottom: '20px' }}>
          Assign <strong>{selectedApp?.full_name}</strong> ({selectedApp?.domain}) to a batch.
        </p>

        <div className="form-group">
          <label>Batch Selection</label>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="radio" name="batchOption" checked={batchOption === 'existing'} onChange={() => setBatchOption('existing')} />
              Existing Batch
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="radio" name="batchOption" checked={batchOption === 'create_new'} onChange={() => setBatchOption('create_new')} />
              Create New Batch
            </label>
          </div>
        </div>

        {batchOption === 'existing' && (
          <div className="form-group">
            <label>Select Batch</label>
            <select className="form-control" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
              <option value="">-- Select Batch --</option>
              {batches.filter(b => b.domain === selectedApp?.domain).map(b => (
                <option key={b.batch_name} value={b.batch_name}>{b.batch_name}</option>
              ))}
            </select>
          </div>
        )}

        {batchOption === 'create_new' && (
          <>
            <div className="form-group">
              <label>New Batch Name</label>
              <input type="text" className="form-control" placeholder="e.g. Batch-10" value={newBatchName} onChange={e => setNewBatchName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Batch Start Date</label>
              <input type="date" className="form-control" value={newBatchStartDate} onChange={e => setNewBatchStartDate(e.target.value)} />
            </div>
          </>
        )}

        <div className="admin-modal-actions" style={{ marginTop: '30px' }}>
          <button className="btn btn-outline" onClick={() => setApproveModalOpen(false)} disabled={actionLoading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleApproveSubmit} disabled={actionLoading}>
            {actionLoading ? 'Processing...' : 'Approve & Send Welcome Email'}
          </button>
        </div>
      </Modal>

      {/* REJECT MODAL */}
      <Modal open={rejectModalOpen} onClose={() => !actionLoading && setRejectModalOpen(false)}>
        <h2>Reject Application</h2>
        <div className="auth-banner auth-banner-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Warning: Rejecting an application will automatically send a Rejection Email to the student notifying them of a refund.
        </div>
        <p>Are you sure you want to reject <strong>{selectedApp?.full_name}</strong>'s application for {selectedApp?.domain}?</p>
        
        <div className="admin-modal-actions" style={{ marginTop: '30px' }}>
          <button className="btn btn-outline" onClick={() => setRejectModalOpen(false)} disabled={actionLoading}>Cancel</button>
          <button className="btn btn-danger" onClick={handleRejectSubmit} disabled={actionLoading}>
            {actionLoading ? 'Processing...' : 'Yes, Reject & Refund'}
          </button>
        </div>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)} wide={true}>
        <h2>Application Details</h2>
        {selectedApp && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', textAlign: 'left' }}>
            <div className="card" style={{ padding: '16px', background: 'var(--surface-2)' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--primary-color)' }}>Personal Info</h3>
              <p><strong>Name:</strong> {selectedApp.full_name}</p>
              <p><strong>Email:</strong> {selectedApp.email}</p>
              <p><strong>Phone:</strong> {selectedApp.phone}</p>
              <p><strong>College:</strong> {selectedApp.college}</p>
              <p><strong>Degree/Branch:</strong> {selectedApp.degree} in {selectedApp.branch}</p>
              <p><strong>Batch Year:</strong> {selectedApp.current_year} (Graduating {selectedApp.graduation_year})</p>
              {selectedApp.aicte_id && <p><strong>AICTE ID:</strong> {selectedApp.aicte_id}</p>}
            </div>
            <div className="card" style={{ padding: '16px', background: 'var(--surface-2)' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--primary-color)' }}>Program Details</h3>
              <p><strong>Domain:</strong> {selectedApp.domain}</p>
              <p><strong>Duration:</strong> {selectedApp.duration}</p>
              <p><strong>Start Date:</strong> {selectedApp.start_date}</p>
              <p><strong>Referral Code:</strong> {selectedApp.referral_code || 'None'}</p>
              <p><strong>Status:</strong> <span className={`badge badge-${selectedApp.status === 'approved' ? 'success' : selectedApp.status === 'rejected' ? 'danger' : 'warning'}`}>{selectedApp.status.toUpperCase()}</span></p>
            </div>
            <div className="card" style={{ padding: '16px', background: 'var(--surface-2)' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--primary-color)' }}>Links</h3>
              <p><a href={selectedApp.resume_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}><FileText size={14} style={{ verticalAlign: 'middle', marginRight: 4 }}/>View Resume</a></p>
              {selectedApp.linkedin_url && <p><a href={selectedApp.linkedin_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>LinkedIn Profile</a></p>}
              {selectedApp.github_url && <p><a href={selectedApp.github_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>GitHub Profile</a></p>}
            </div>
            <div className="card" style={{ padding: '16px', background: 'var(--surface-2)' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--primary-color)' }}>Payment Info</h3>
              <p><strong>Order ID:</strong> {selectedApp.razorpay_order_id}</p>
              <p><strong>Payment Status:</strong> <span className="badge badge-success">{selectedApp.payment_status?.toUpperCase() || 'PAID'}</span></p>
              <p><strong>Amount:</strong> ₹{selectedApp.amount}</p>
              <p><strong>Applied On:</strong> {new Date(selectedApp.created_at).toLocaleString()}</p>
            </div>
          </div>
        )}
        <div className="admin-modal-actions" style={{ marginTop: '30px' }}>
          <button className="btn btn-primary" onClick={() => setViewModalOpen(false)}>Close</button>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal open={editModalOpen} onClose={() => !editSaving && setEditModalOpen(false)} wide={true}>
        <h2>Edit Application Details</h2>
        <p className="text-muted" style={{ marginBottom: '20px' }}>Fix any typos in the application.</p>
        
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
            <input className="form-control" value={editForm.githubUrl} onChange={e => setEditForm({...editForm, githubUrl: e.target.value})} style={{ gridColumn: 'span 2' }} />
          </div>
        </div>

        <div className="admin-modal-actions" style={{ marginTop: '30px' }}>
          <button className="btn btn-outline" onClick={() => setEditModalOpen(false)} disabled={editSaving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleEditSubmit} disabled={editSaving}>
            {editSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

    </section>
  );
}
