import { useEffect, useState } from 'react';
import { RotateCw, Plus, Calendar, Award, CheckCircle, Clock, ExternalLink, Eye, Edit2, Trash2, GitBranch, HardDrive, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

export default function TasksTable({ onChange, currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  
  const [taskPage, setTaskPage] = useState(1);
  const tasksPerPage = 100;

  const [assignOpen, setAssignOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [evaluateOpen, setEvaluateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [assignForm, setAssignForm] = useState({
    week: 1, title: '', domain: '', batch: '', dueDate: '', marks: 100, description: '', fileUrl: '', linkUrl: ''
  });

const DOMAINS = ['Web Development', 'Data Analytics', 'Cyber Security', 'Artificial Intelligence', 'Digital Marketing', 'Human Resources', 'Python Programming', 'Java Development'];

  const [editForm, setEditForm] = useState({ title: '', dueDate: '' });
  const [evaluateForm, setEvaluateForm] = useState({ taskId: '', marksObtained: '', feedback: '', fullMarks: 100 });
  const [batches, setBatches] = useState([]);
  const [domains, setDomains] = useState(DOMAINS);

  const isMentor = currentUser?.role === 'mentor';

  const load = async () => {
    let url = '/api/admin?action=admin-tasks';
    if (!isMentor) {
      const params = new URLSearchParams();
      if (filterDomain) params.append('filterDomain', filterDomain);
      if (filterBatch) params.append('filterBatch', filterBatch);
      if (params.toString()) url += `&${params.toString()}`;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();

      const grouped = {};
      (data || []).forEach(t => {
        const key = `${t.task_title}|${t.domain}|${t.batch_name}|${t.week_number}`;
        if (!grouped[key]) {
          grouped[key] = {
            id: key, title: t.task_title, domain: t.domain, batch: t.batch_name, week: t.week_number,
            dueDate: t.due_date, uploadedBy: t.uploaded_by, description: t.task_description, marks: t.marks, submissions: []
          };
        }
        grouped[key].submissions.push(t);
      });
      setTasks(Object.values(grouped));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    
    // Fetch actual batches and domains from the database bypassing the 1000 row limit
    const fetchAllFilters = async () => {
      let allData = [];
      let from = 0;
      const step = 1000;
      while (true) {
        const { data, error } = await supabase.from('students').select('batch_name, domain').range(from, from + step - 1);
        if (error || !data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < step) break;
        from += step;
      }
      
      setBatches([...new Set(allData.map(d => d.batch_name).filter(Boolean))]);
      
      const uniqueDomains = [...new Set(allData.map(d => d.domain).filter(Boolean))];
      const cleanDomains = uniqueDomains.filter(d => d.length < 60);
      
      // Combine hardcoded defaults with clean dynamic ones
      setDomains([...new Set([...DOMAINS, ...cleanDomains])]);
    };
    fetchAllFilters();

    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [currentUser, filterBatch, filterDomain]);

  useEffect(() => {
    if (viewOpen && selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks]);

  const filtered = tasks.filter((g) => {
    const k = search.toLowerCase();
    return (g.title || '').toLowerCase().includes(k) || (g.domain || '').toLowerCase().includes(k) || (g.batch || '').toLowerCase().includes(k);
  });

  const totalTaskPages = Math.ceil(filtered.length / tasksPerPage);
  const paginatedTasks = filtered.slice((taskPage - 1) * tasksPerPage, taskPage * tasksPerPage);

  useEffect(() => { setTaskPage(1); }, [search, filterDomain, filterBatch]);

  const openAssignModal = () => {
    setAssignForm({ 
      week: 1, title: '', domain: isMentor ? currentUser.domain : '', batch: isMentor ? currentUser.batch_name : '', 
      dueDate: new Date().toISOString().split('T')[0], marks: 100, description: '', fileUrl: '', linkUrl: '' 
    });
    setAssignOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.domain) { alert('Please select a domain.'); return; }
    if (!assignForm.batch) { alert('Please select a batch.'); return; }

    if (!confirm(`Assign task "${assignForm.title}" to batch "${assignForm.batch}"?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin?action=admin-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ assignForm })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      alert(`Successfully assigned task to ${result.count} students!`);
      setAssignOpen(false);
      load();
      onChange?.();
    } catch (err) {
      alert(err.message);
    }
  };

  const openViewModal = (g) => { setSelectedTask(g); setViewOpen(true); };
  const openEditModal = (g) => { setSelectedTask(g); setEditForm({ title: g.title || '', dueDate: g.dueDate || '' }); setEditOpen(true); };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const taskIds = selectedTask.submissions.map(s => s.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin?action=admin-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ taskIds, title: editForm.title, dueDate: editForm.dueDate })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setEditOpen(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (g) => {
    if (!confirm(`Delete this task for ALL ${g.submissions.length} students?`)) return;
    const taskIds = g.submissions.map(s => s.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin?action=admin-tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ taskIds })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      load();
      onChange?.();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const openEvaluate = (submission) => {
    setEvaluateForm({ taskId: submission.id, marksObtained: submission.marks_obtained || '', feedback: submission.feedback || '', fullMarks: submission.marks || 100 });
    setEvaluateOpen(true);
  };

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEvaluateSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin?action=evaluate-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(evaluateForm)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      setEvaluateOpen(false);
      showToast('Evaluation saved successfully! 🎉');
      
      // Update selectedTask locally so the submissions modal updates instantly
      setSelectedTask(prev => {
        if (!prev) return prev;
        const newSubmissions = prev.submissions.map(s => 
          s.id === evaluateForm.taskId 
            ? { ...s, marks_obtained: evaluateForm.marksObtained, feedback: evaluateForm.feedback }
            : s
        );
        return { ...prev, submissions: newSubmissions };
      });

      load(); // Reload in background to keep data in sync
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionPage, setSubmissionPage] = useState(1);
  const submissionsPerPage = 100;

  const filteredSubmissions = selectedTask?.submissions?.filter(s => {
    const term = submissionSearch.toLowerCase().trim();
    if (!term) return true;
    const name = (s.students?.name || 'Unknown').toLowerCase();
    const id = (s.students?.student_id || 'N/A').toLowerCase();
    const email = (s.student_email || '').toLowerCase();
    return name.includes(term) || id.includes(term) || email.includes(term);
  }) || [];

  const totalSubmissionPages = Math.ceil(filteredSubmissions.length / submissionsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice((submissionPage - 1) * submissionsPerPage, submissionPage * submissionsPerPage);

  useEffect(() => { setSubmissionPage(1); }, [submissionSearch, selectedTask]);

  return (
    <section className="admin-section">
      {toast && (
        <div className={`custom-toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
      <div className="admin-section-head">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            Task Management
          </h2>
        </div>
        <div className="admin-section-actions">
          <input placeholder="Search Tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {!isMentor && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select className="btn btn-outline btn-sm" value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
                <option value="">All Domains</option>
                {domains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="btn btn-outline btn-sm" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
                <option value="">All Batches</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}
          {!isMentor && (
            <button className="btn btn-outline btn-sm" onClick={async () => {
              if (!confirm('This will permanently delete all duplicate task assignments in the database. Continue?')) return;
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch('/api/admin?action=cleanup-duplicates', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error);
                alert(json.message);
                load();
              } catch (err) { alert('Error: ' + err.message); }
            }}><Trash2 size={14} /> Cleanup Duplicates</button>
          )}
          
          <button className="btn btn-outline btn-sm" onClick={async () => {
            if (!confirm('This will scan the database for old tasks that students submitted but forgot to tick, and automatically tick them. Continue?')) return;
            try {
              const { data: { session } } = await supabase.auth.getSession();
              const res = await fetch('/api/admin?action=fix-tasks', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
              const json = await res.json();
              if (!res.ok) throw new Error(json.error);
              alert(json.message);
              load();
            } catch (err) { alert('Error: ' + err.message); }
          }}><CheckCircle size={14} /> Fix Unticked Tasks</button>

          <button className="btn btn-outline btn-sm" onClick={openAssignModal}><Plus size={14} /> Assign Task to Batch</button>
          <button className="btn btn-primary btn-sm" onClick={load}><RotateCw size={14} /> Refresh</button>
        </div>
      </div>
      <p className="text-muted" style={{ marginBottom: 14, fontSize: '0.85rem' }}>Tasks are grouped by Title, Domain, and Batch. Click "View Submissions" to see individual student progress.</p>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>S.No.</th><th>Week</th><th>Title</th><th>Domain</th><th>Batch</th><th>Due Date</th><th>Uploaded By</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8}>Loading Tasks...</td></tr> : filtered.length === 0 ? <tr><td colSpan={8}>No Tasks Available</td></tr> : paginatedTasks.map((g, idx) => (
              <tr key={g.id}>
                <td style={{ color: 'var(--text-muted)' }}>{(taskPage - 1) * tasksPerPage + idx + 1}</td>
                <td>Week {g.week}</td><td>{g.title}</td><td>{g.domain}</td><td>{g.batch || 'All'}</td>
                <td>{g.dueDate ? new Date(g.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                <td>{g.uploadedBy || 'Admin'}</td>
                <td className="admin-actions">
                  <button className="action-btn is-view" onClick={() => { setSelectedTask(g); setDetailsOpen(true); }}><Eye size={14} /> Details</button>
                  <button className="action-btn is-view" onClick={() => { setSelectedTask(g); setSubmissionSearch(''); setViewOpen(true); }}><ExternalLink size={14} /> Submissions</button>
                  <button className="action-btn is-edit" onClick={() => openEditModal(g)}><Edit2 size={14} /> Edit</button>
                  <button className="action-btn is-delete" onClick={() => remove(g)}><Trash2 size={14} /> Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalTaskPages > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap-reverse', justifyContent: 'center', gap: '16px', alignItems: 'center', marginTop: 16, padding: '0 8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {(taskPage - 1) * tasksPerPage + 1} to {Math.min(taskPage * tasksPerPage, filtered.length)} of {filtered.length} tasks
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" disabled={taskPage === 1} onClick={() => setTaskPage(p => p - 1)}>Previous</button>
            <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', padding: '0 8px' }}>Page {taskPage} of {totalTaskPages}</span>
            <button className="btn btn-outline btn-sm" disabled={taskPage === totalTaskPages} onClick={() => setTaskPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)}>
        <h2>Assign Task to Batch</h2>
        <form onSubmit={handleAssignSubmit}>
          <div className="field">
            <label>Domain</label>
            <select required disabled={isMentor} value={assignForm.domain} onChange={(e) => setAssignForm((f) => ({ ...f, domain: e.target.value }))}>
              <option value="" disabled>Select a Domain</option>
              {domains.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Batch Cohort</label>
            <select required disabled={isMentor} value={assignForm.batch} onChange={(e) => setAssignForm((f) => ({ ...f, batch: e.target.value }))}>
              <option value="" disabled>Select a Batch</option>
              {batches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="grid-col-2">
            <div className="field"><label>Week Number</label><input type="number" min="1" required value={assignForm.week} onChange={(e) => setAssignForm((f) => ({ ...f, week: e.target.value }))} /></div>
            <div className="field"><label>Due Date</label><input type="date" required value={assignForm.dueDate} onChange={(e) => setAssignForm((f) => ({ ...f, dueDate: e.target.value }))} /></div>
          </div>
          <div className="grid-col-2">
            <div className="field"><label>Task Title</label><input required placeholder="e.g. Build a Landing Page" value={assignForm.title} onChange={(e) => setAssignForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="field"><label>Marks</label><input type="number" min="0" required value={assignForm.marks} onChange={(e) => setAssignForm((f) => ({ ...f, marks: e.target.value }))} /></div>
          </div>
          <div className="field"><label>Description & Instructions</label><textarea required rows={4} value={assignForm.description} onChange={(e) => setAssignForm((f) => ({ ...f, description: e.target.value }))}></textarea></div>
          <div className="grid-col-2">
            <div className="field"><label>Attach File URL (Optional)</label><input type="url" value={assignForm.fileUrl} onChange={(e) => setAssignForm((f) => ({ ...f, fileUrl: e.target.value }))} /></div>
            <div className="field"><label>Reference Link (Optional)</label><input type="url" value={assignForm.linkUrl} onChange={(e) => setAssignForm((f) => ({ ...f, linkUrl: e.target.value }))} /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Assign Task</button>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <h2>Edit Task Group</h2>
        <form onSubmit={handleEditSubmit}>
          <div className="field"><label>Task Title</label><input required value={editForm.title} onChange={(e) => setEditForm(f => ({...f, title: e.target.value}))} /></div>
          <div className="field"><label>Due Date</label><input type="date" required value={editForm.dueDate} onChange={(e) => setEditForm(f => ({...f, dueDate: e.target.value}))} /></div>
          <button type="submit" className="btn btn-primary btn-block">Update All</button>
        </form>
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} wide>
        {selectedTask && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0 }}>Submissions for: {selectedTask.title}</h2>
                <p className="text-muted" style={{ margin: '4px 0 0' }}>Assigned to: {selectedTask.domain} ({selectedTask.batch || 'All Batches'}) - Week {selectedTask.week}</p>
              </div>
              <input 
                type="text" 
                placeholder="Search student name, ID or email..." 
                value={submissionSearch} 
                onChange={(e) => setSubmissionSearch(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: '6px', flex: '1 1 250px', maxWidth: '100%' }}
              />
            </div>
            
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Student Details</th><th>Status</th><th>Marks</th><th>Submission Link</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredSubmissions.length === 0 ? <tr><td colSpan={5}>No students match your search</td></tr> : paginatedSubmissions.map((s, idx) => {
                    const hasSubmitted = s.is_completed;
                    const isMissing = !hasSubmitted && s.due_date && new Date(s.due_date).setHours(23, 59, 59, 999) < new Date();
                    const isLate = hasSubmitted && s.submission_date && s.due_date && new Date(s.submission_date) > new Date(s.due_date).setHours(23, 59, 59, 999);
                    
                    let statusClass = 'status-pending';
                    let statusText = 'Pending';
                    if (isMissing) { statusClass = 'status-missing'; statusText = 'Missing'; }
                    else if (hasSubmitted) {
                      if (isLate) { statusClass = 'status-missing'; statusText = 'Late Submission'; }
                      else { statusClass = 'status-active'; statusText = 'On Time'; }
                    }
                    
                    let links = [];
                    if (s.submission_link) {
                      const urlRegex = /(https?:\/\/[^\s]+)/g;
                      links = s.submission_link.match(urlRegex) || [];
                    }

                    return (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.students?.name || 'Unknown'}</strong><br />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.students?.student_id || 'N/A'}</span><br />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.student_email}</span>
                        </td>
                        <td><span className={`status-pill ${statusClass}`}>{statusText}</span></td>
                        <td>{s.marks_obtained !== null && s.marks_obtained !== undefined ? `${s.marks_obtained} / ${s.marks || 100}` : '-'}</td>
                        <td>
                          {links.length > 0 ? links.map((link, i) => {
                            let icon = <Globe size={14} style={{ marginRight: 6 }} />;
                            let label = `View Link ${i + 1}`;
                            if (link.includes('github.com')) { icon = <GitBranch size={14} style={{ marginRight: 6 }} />; label = 'GitHub Repo'; }
                            else if (link.includes('drive.google.com')) { icon = <HardDrive size={14} style={{ marginRight: 6 }} />; label = 'Google Drive'; }
                            return (
                              <div key={i} style={{ marginBottom: 6 }}>
                                <a href={link} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', fontSize: '0.75rem', textDecoration: 'none' }}>
                                  {icon} {label}
                                </a>
                              </div>
                            );
                          }) : (s.submission_link ? <span>{s.submission_link}</span> : '-')}
                        </td>
                        <td>
                          {hasSubmitted && (
                            <button 
                              className={`btn btn-sm ${s.marks_obtained !== null && s.marks_obtained !== undefined ? 'btn-outline' : 'btn-primary'}`} 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => openEvaluate(s)}
                            >
                              {s.marks_obtained !== null && s.marks_obtained !== undefined ? <Edit2 size={14} /> : <Award size={14} />}
                              {s.marks_obtained !== null && s.marks_obtained !== undefined ? 'Edit Marks' : 'Evaluate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalSubmissionPages > 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap-reverse', justifyContent: 'center', gap: '16px', alignItems: 'center', marginTop: 16, padding: '0 8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Showing {(submissionPage - 1) * submissionsPerPage + 1} to {Math.min(submissionPage * submissionsPerPage, filteredSubmissions.length)} of {filteredSubmissions.length} submissions
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" disabled={submissionPage === 1} onClick={() => setSubmissionPage(p => p - 1)}>Previous</button>
                  <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', padding: '0 8px' }}>Page {submissionPage} of {totalSubmissionPages}</span>
                  <button className="btn btn-outline btn-sm" disabled={submissionPage === totalSubmissionPages} onClick={() => setSubmissionPage(p => p + 1)}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal open={evaluateOpen} onClose={() => setEvaluateOpen(false)}>
        <h2>Evaluate Submission</h2>
        <form onSubmit={handleEvaluateSubmit}>
          <div className="field">
            <label>Marks Obtained (out of {evaluateForm.fullMarks})</label>
            <input type="number" min="0" max={evaluateForm.fullMarks} required value={evaluateForm.marksObtained} onChange={(e) => setEvaluateForm(f => ({ ...f, marksObtained: e.target.value }))} />
          </div>
          <div className="field">
            <label>Mentor Feedback (Optional)</label>
            <textarea rows={4} value={evaluateForm.feedback} onChange={(e) => setEvaluateForm(f => ({ ...f, feedback: e.target.value }))} placeholder="Provide constructive feedback..."></textarea>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Save Evaluation</button>
        </form>
      </Modal>

      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)}>
        {selectedTask && (
          <>
            <h2>Task Details: {selectedTask.title}</h2>
            <div style={{ marginTop: 16, marginBottom: 16, fontSize: '0.95rem', lineHeight: '1.6' }}>
              <p><strong>Domain:</strong> {selectedTask.domain}</p>
              <p><strong>Batch:</strong> {selectedTask.batch || 'All'}</p>
              <p><strong>Week:</strong> {selectedTask.week}</p>
              <p><strong>Due Date:</strong> {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'None'}</p>
              <p><strong>Marks:</strong> {selectedTask.marks}</p>
              <div style={{ marginTop: 24 }}>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text)' }}>Description & Instructions:</strong>
                <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '8px', marginTop: '12px', whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>
                  {selectedTask.description || 'No description provided.'}
                </div>
              </div>
            </div>
            <button className="btn btn-outline btn-block" onClick={() => setDetailsOpen(false)}>Close</button>
          </>
        )}
      </Modal>
    </section>
  );
}
