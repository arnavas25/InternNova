import { useEffect, useState } from 'react';
import { RotateCw, UserPlus, Users2, GraduationCap, Copy, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { callAdminApi } from '../../lib/adminApi';
import Modal from '../Modal';

const DOMAINS = ['Web Development', 'Data Analytics', 'Cyber Security', 'Artificial Intelligence', 'Digital Marketing', 'Human Resources', 'Python Programming', 'Java Development'];

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  
  const nameIdx = headers.findIndex(h => h.includes('name'));
  const emailIdx = headers.findIndex(h => h.includes('email'));
  const domainIdx = headers.findIndex(h => h.includes('domain'));
  const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));
  const batchIdx = headers.findIndex(h => h.includes('batch'));
  const startIdx = headers.findIndex(h => h.includes('start'));
  const endIdx = headers.findIndex(h => h.includes('end'));
  const offerIdx = headers.findIndex(h => h.includes('offer'));
  
  if (nameIdx === -1 || emailIdx === -1 || domainIdx === -1) {
    throw new Error('CSV must contain "name", "email", and "domain" columns.');
  }
  
  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (row.length < 3) continue;
    
    parsed.push({
      name: row[nameIdx] || '',
      email: row[emailIdx] || '',
      domain: row[domainIdx] || '',
      phone: phoneIdx !== -1 ? row[phoneIdx] || '' : '',
      batchName: batchIdx !== -1 ? row[batchIdx] || '' : '',
      batchStartDate: startIdx !== -1 ? row[startIdx] || '' : '',
      batchEndDate: endIdx !== -1 ? row[endIdx] || '' : '',
      offerLetterLink: offerIdx !== -1 ? row[offerIdx] || '' : ''
    });
  }
  return parsed;
}

export default function StudentsTable({ onChange, currentUser }) {
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const [batches, setBatches] = useState([]);
  const [domains, setDomains] = useState(DOMAINS);
  const [filterBatch, setFilterBatch] = useState('');
  const [filterDomain, setFilterDomain] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', domain: DOMAINS[0], batchName: '', batchStartDate: '', batchEndDate: '', offerLetterLink: '' });
  const [addBusy, setAddBusy] = useState(false);
  const [addResult, setAddResult] = useState(null);

  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [mentorForm, setMentorForm] = useState({ domain: DOMAINS[0], mentorId: '', target: 'all', studentEmail: '' });

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', domain: '', batch_name: '', status: 'Active' });

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkStudents, setBulkStudents] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null);
  const [bulkError, setBulkError] = useState(null);

  const [bulkResendOpen, setBulkResendOpen] = useState(false);
  const [bulkResendBatch, setBulkResendBatch] = useState('');
  const [bulkResendBusy, setBulkResendBusy] = useState(false);
  const [bulkResendResult, setBulkResendResult] = useState(null);

  const load = async () => {
    const getStudentQuery = () => {
      let q = supabase.from('students').select('*').order('created_at', { ascending: false });
      if (currentUser?.role === 'mentor') q = q.eq('mentor_name', currentUser.full_name);
      if (filterDomain) q = q.eq('domain', filterDomain);
      if (filterBatch) q = q.eq('batch_name', filterBatch);
      return q;
    };

    const fetchAll = async (queryFn) => {
      let allData = [];
      let from = 0;
      const step = 1000;
      while (true) {
        const { data, error } = await queryFn().range(from, from + step - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < step) break;
        from += step;
      }
      return allData;
    };
    
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
      setDomains([...new Set([...DOMAINS, ...cleanDomains])]);
    };
    
    try {
      const [studentRows, { data: staffRows }] = await Promise.all([
        fetchAll(getStudentQuery),
        supabase.from('staff_users').select('*').eq('role', 'mentor'),
        fetchAllFilters()
      ]);
      setStudents(studentRows || []);
      setMentors(staffRows || []);
    } catch (err) {
      console.error("Error loading students:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, filterBatch, filterDomain]);

  const filteredStudents = students.filter((s) => {
    const k = search.toLowerCase();
    return (s.name || '').toLowerCase().includes(k) || (s.email || '').toLowerCase().includes(k) ||
      (s.student_id || '').toLowerCase().includes(k) || (s.domain || '').toLowerCase().includes(k) ||
      (s.phone || '').toLowerCase().includes(k);
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to page 1 when search or filters change
  useEffect(() => { setCurrentPage(1); }, [search, filterDomain, filterBatch]);

  const [realtimeProgress, setRealtimeProgress] = useState({});

  useEffect(() => {
    const fetchRealtimeProgress = async () => {
      if (paginatedStudents.length === 0) return;
      const emails = paginatedStudents.map(s => s.email).filter(Boolean);
      if (emails.length === 0) return;

      // Fetch all tasks for these specific students
      const { data: tasks, error } = await supabase.from('tasks').select('student_email, is_completed, marks_obtained').in('student_email', emails);
      if (error || !tasks) return;

      const progressMap = {};
      emails.forEach(e => progressMap[e.toLowerCase()] = { total: 0, completed: 0 });

      tasks.forEach(t => {
        const email = (t.student_email || '').toLowerCase();
        if (progressMap[email]) {
          progressMap[email].total++;
          if (t.is_completed || t.marks_obtained !== null) {
            progressMap[email].completed++;
          }
        }
      });

      setRealtimeProgress(progressMap);
    };

    fetchRealtimeProgress();
  }, [currentPage, search, filterDomain, filterBatch, students]); // Re-run when the displayed students change

  const getProgress = (s) => {
    const email = (s.email || '').toLowerCase();
    const rt = realtimeProgress[email];
    if (rt) return rt;
    return { total: s.tasks_total || 0, completed: s.tasks_completed || 0 };
  };

  const progressPct = (s) => {
    const { total, completed } = getProgress(s);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // ---- Add student (creates the real account directly) ----
  const closeAdd = () => { setAddOpen(false); setAddResult(null); setAddForm({ name: '', email: '', phone: '', domain: DOMAINS[0], batchName: '' }); };

  const submitAdd = async (e) => {
    e.preventDefault();
    setAddBusy(true);
    try {
      const result = await callAdminApi('create-student', {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim() || undefined,
        domain: addForm.domain,
        batchName: addForm.batchName.trim() || undefined,
        batchStartDate: addForm.batchStartDate || undefined,
        batchEndDate: addForm.batchEndDate || undefined,
        offerLetterLink: addForm.offerLetterLink.trim() || undefined,
      });
      setAddResult(result);
      load(); onChange?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setAddBusy(false);
    }
  };

  const copyCreds = () => {
    const text = `Student ID: ${addResult.studentId}\nEmail: ${addResult.email}\nPassword: ${addResult.password}\nLogin at: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  // ---- Edit student ----
  const openEdit = (s) => { setEditing(s); setEditForm({ name: s.name || '', phone: s.phone || '', domain: s.domain, batch_name: s.batch_name, status: s.status }); setEditOpen(true); };
  const submitEdit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('students').update(editForm).eq('id', editing.id);
    if (error) { alert(error.message); return; }

    if (editForm.status === 'Completed' && editing.status !== 'Completed') {
      try {
        const year = new Date().getFullYear().toString().slice(2);
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        // Extract initials of domain for cert ID
        const domainInitials = (editForm.domain || editing.domain || 'WD').split(' ').map(w => w[0]).join('').toUpperCase();
        const cert_id = `IN/${year}/${domainInitials}${randomPart}`;

        await supabase.from('certificates').insert([{
          cert_id,
          student_id: editing.student_id || editing.id,
          name: editForm.name || editing.name,
          email: editing.email,
          domain: editForm.domain || editing.domain,
          start_date: editing.created_at ? editing.created_at.split('T')[0] : '01 Jul 2026',
          end_date: new Date().toISOString().split('T')[0],
          issue_date: new Date().toISOString().split('T')[0]
        }]);
        
        await supabase.from('students').update({ certificate_link: `/certificate/${cert_id}` }).eq('id', editing.id);
      } catch (err) {
        console.error("Failed to auto-generate certificate:", err);
      }
    }

    setEditOpen(false);
    load(); onChange?.();
  };

  const remove = async (s) => {
    if (!confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from('students').delete().eq('id', s.id);
    if (error) { alert(error.message); return; }
    load(); onChange?.();
  };

  // ---- Assign mentor ----
  const studentsInDomain = students.filter((s) => s.domain === mentorForm.domain);
  const domainBatches = [...new Set(studentsInDomain.map(s => s.batch_name).filter(Boolean))];

  const submitMentorAssign = async (e) => {
    e.preventDefault();
    const mentor = mentors.find((m) => m.id === mentorForm.mentorId);
    if (!mentor) { alert('Select a mentor'); return; }
    const payload = { mentor_name: mentor.full_name, mentor_whatsapp: mentor.phone?.replace(/\D/g, '') || '' };

    if (mentorForm.target === 'all') {
      const { error } = await supabase.from('students').update(payload).eq('domain', mentorForm.domain);
      if (error) { alert(error.message); return; }
      alert(`${mentor.full_name} assigned to all students in ${mentorForm.domain}`);
    } else if (mentorForm.target === 'batch') {
      if (!mentorForm.batchName) { alert('Select a batch'); return; }
      const { error } = await supabase.from('students').update(payload).eq('domain', mentorForm.domain).eq('batch_name', mentorForm.batchName);
      if (error) { alert(error.message); return; }
      alert(`${mentor.full_name} assigned to ${mentorForm.batchName} batch in ${mentorForm.domain}`);
    } else {
      if (!mentorForm.studentEmail) { alert('Select a student'); return; }
      const { error } = await supabase.from('students').update(payload).eq('email', mentorForm.studentEmail);
      if (error) { alert(error.message); return; }
      alert(`${mentor.full_name} assigned to that student`);
    }
    setMentorModalOpen(false);
    load();
  };

  const handleCSVChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkError(null);
    setBulkProgress(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        if (parsed.length === 0) throw new Error('No valid rows found in CSV file.');
        setBulkStudents(parsed);
      } catch (err) {
        setBulkError(err.message);
        setBulkStudents([]);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async (studentsToImport) => {
    setBulkBusy(true);
    const progress = { total: studentsToImport.length, current: 0, successes: 0, errors: [] };
    setBulkProgress(progress);
    
    for (const studentData of studentsToImport) {
      try {
        await callAdminApi('create-student', {
          name: studentData.name,
          email: studentData.email,
          phone: studentData.phone || undefined,
          domain: studentData.domain,
          batchName: studentData.batchName || undefined,
          batchStartDate: studentData.batchStartDate || undefined,
          batchEndDate: studentData.batchEndDate || undefined,
          offerLetterLink: studentData.offerLetterLink || undefined
        });
        progress.successes++;
      } catch (err) {
        progress.errors.push({ email: studentData.email, name: studentData.name, error: err.message });
      }
      progress.current++;
      setBulkProgress({ ...progress });
    }
    setBulkBusy(false);
    load();
    onChange?.();
  };

  const submitBulkResend = async (e) => {
    e.preventDefault();
    if (!bulkResendBatch) { alert('Select a batch'); return; }
    
    setBulkResendBusy(true);
    setBulkResendResult(null);
    try {
      // Find students in this batch who haven't logged in yet
      const { data: studentsToResend } = await supabase
        .from('students')
        .select('id')
        .eq('batch_name', bulkResendBatch)
        .eq('must_change_password', true);
        
      if (!studentsToResend || studentsToResend.length === 0) {
        alert('All students in this batch have already logged in or no students found.');
        setBulkResendBusy(false);
        return;
      }
      
      const ids = studentsToResend.map(s => s.id);
      if (!confirm(`Are you sure you want to resend credentials to ${ids.length} students?`)) {
        setBulkResendBusy(false);
        return;
      }
      
      const res = await callAdminApi('resend-credentials', { studentIds: ids });
      setBulkResendResult(res);
    } catch (err) {
      alert(err.message);
    } finally {
      setBulkResendBusy(false);
    }
  };


  const resendRow = async (s) => {
    if (!confirm(`Generate and email new password for ${s.name}?`)) return;
    try {
      await callAdminApi('resend-credentials', { studentIds: [s.id] });
      alert(`Sent new credentials to ${s.email}`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Student Management</h2>
        <div className="admin-section-actions">
          <input placeholder="Search Student..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
          {currentUser?.role !== 'mentor' && (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => setMentorModalOpen(true)}><Users2 size={14} /> Assign Mentor</button>
              <button className="btn btn-outline btn-sm" onClick={() => setBulkOpen(true)}><Upload size={14} /> Bulk Upload (CSV)</button>
              <button className="btn btn-outline btn-sm" onClick={() => { setBulkResendOpen(true); setBulkResendResult(null); }}><RotateCw size={14} /> Bulk Resend Login</button>
              <button className="btn btn-outline btn-sm" onClick={() => setAddOpen(true)}><UserPlus size={14} /> Add Student</button>
            </>
          )}
          <button className="btn btn-primary btn-sm" onClick={load}><RotateCw size={14} /> Refresh</button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th style={{ width: 60, minWidth: 60, maxWidth: 60 }}>S.No.</th><th className="col-sticky-2">Student ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Domain</th><th>Batch</th><th>Mentor</th><th>Progress</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11}>Loading Students...</td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan={11}>No students yet — click "Add Student" to create the first account.</td></tr>
            ) : paginatedStudents.map((s, idx) => (
              <tr key={s.id}>
                <td style={{ color: 'var(--text-muted)' }}>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                <td className="col-sticky-2">{s.student_id || '-'}</td>
                <td>{s.name || '-'}</td>
                <td>{s.email || '-'}</td>
                <td>{s.phone || '-'}</td>
                <td>{s.domain || '-'}</td>
                <td>{s.batch_name || '-'}</td>
                <td>{s.mentor_name || <span className="text-muted">Unassigned</span>}</td>
                  {(() => {
                    const { total, completed } = getProgress(s);
                    return <td>{completed}/{total} ({progressPct(s)}%)</td>;
                  })()}
                <td><span className={`status-pill status-${(s.status || '').toLowerCase()}`}>{s.status || '-'}</span></td>
                <td className="admin-actions">
                  {currentUser?.role !== 'mentor' ? (
                    <>
                      <button className="action-btn is-edit" onClick={() => openEdit(s)}>Edit</button>
                      <button className="action-btn is-delete" onClick={() => remove(s)}>Delete</button>
                      <button className="action-btn" onClick={() => resendRow(s)} style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-1)' }}>Resend</button>
                    </>
                  ) : (
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>Restricted</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap-reverse', justifyContent: 'center', gap: '16px', alignItems: 'center', marginTop: 16, padding: '0 8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
            <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', padding: '0 8px' }}>Page {currentPage} of {totalPages}</span>
            <button className="btn btn-outline btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {/* Add Student */}
      <Modal open={addOpen} onClose={closeAdd}>
        {addResult ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: 10 }}>Account Created ✓</h2>
            <p className="text-muted" style={{ marginBottom: 16 }}>
              {addResult.emailSent
                ? `Credentials were emailed to ${addResult.email}.`
                : `Email wasn't sent (Resend not configured yet) — copy these and send manually:`}
            </p>
            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 16, marginBottom: 20, textAlign: 'left' }} className="mono">
              <div style={{ marginBottom: 6 }}><strong>ID:</strong> {addResult.studentId}</div>
              <div style={{ marginBottom: 6 }}><strong>Email:</strong> {addResult.email}</div>
              <div><strong>Password:</strong> {addResult.password}</div>
            </div>
            <button className="btn btn-outline btn-block" style={{ marginBottom: 10 }} onClick={copyCreds}><Copy size={14} /> Copy Credentials</button>
            <button className="btn btn-primary btn-block" onClick={closeAdd}>Done</button>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: 20 }}>Add Student</h2>
            <p className="text-muted" style={{ marginBottom: 16, fontSize: '0.85rem' }}>
              This creates their login account immediately and emails them their Student ID + a temporary password.
            </p>
            <form onSubmit={submitAdd}>
              <div className="field">
                <label>Full Name</label>
                <input required placeholder="Jane Doe" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" required placeholder="student@email.com" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="field">
                <label>Phone Number (Optional)</label>
                <input type="tel" placeholder="+91 XXXXXXXXXX" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="field">
                <label>Domain</label>
                <select value={addForm.domain} onChange={(e) => setAddForm((f) => ({ ...f, domain: e.target.value }))}>
                  {domains.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Batch Name (optional)</label>
                <input list="batch-list" placeholder="e.g. August Cohort" value={addForm.batchName} onChange={(e) => setAddForm((f) => ({ ...f, batchName: e.target.value }))} />
                <datalist id="batch-list">
                  {batches.map(b => <option key={b} value={b} />)}
                </datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>Start Date (optional)</label>
                  <input type="date" value={addForm.batchStartDate} onChange={(e) => setAddForm((f) => ({ ...f, batchStartDate: e.target.value }))} />
                </div>
                <div className="field">
                  <label>End Date (optional)</label>
                  <input type="date" value={addForm.batchEndDate} onChange={(e) => setAddForm((f) => ({ ...f, batchEndDate: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Offer Letter Link (optional)</label>
                <input type="url" placeholder="https://..." value={addForm.offerLetterLink} onChange={(e) => setAddForm((f) => ({ ...f, offerLetterLink: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={addBusy}>
                {addBusy ? 'Creating…' : 'Create Account & Send Credentials'}
              </button>
            </form>
          </>
        )}
      </Modal>

      {/* Edit student */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <h2 style={{ marginBottom: 20 }}>Edit {editing?.name}</h2>
        <form onSubmit={submitEdit}>
          <div className="field">
            <label>Full Name</label>
            <input required value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field">
            <label>Email Address (Read-Only)</label>
            <input disabled value={editing?.email || ''} style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input type="tel" placeholder="+91XXXXXXXXXX" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="field">
            <label>Domain</label>
            <select value={editForm.domain} onChange={(e) => setEditForm((f) => ({ ...f, domain: e.target.value }))}>
              {domains.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Batch Name</label>
            <input value={editForm.batch_name} onChange={(e) => setEditForm((f) => ({ ...f, batch_name: e.target.value }))} />
          </div>
          <div className="field">
            <label>Status</label>
            <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
              <option>Active</option><option>Completed</option><option>Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Save Changes</button>
        </form>
      </Modal>

      {/* Assign Mentor */}
      <Modal open={mentorModalOpen} onClose={() => setMentorModalOpen(false)}>
        <h2 style={{ marginBottom: 20 }}>Assign Mentor</h2>
        <form onSubmit={submitMentorAssign}>
          <div className="field">
            <label>Domain</label>
            <select value={mentorForm.domain} onChange={(e) => setMentorForm((f) => ({ ...f, domain: e.target.value, studentEmail: '' }))}>
              {domains.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Mentor</label>
            <select required value={mentorForm.mentorId} onChange={(e) => setMentorForm((f) => ({ ...f, mentorId: e.target.value }))}>
              <option value="">Select a mentor...</option>
              {mentors.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
            {mentors.length === 0 && <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 6 }}>No staff with role "mentor" found yet — add one in the Staff tab first.</p>}
          </div>
          <div className="field">
            <label>Apply To</label>
            <select value={mentorForm.target} onChange={(e) => setMentorForm((f) => ({ ...f, target: e.target.value, studentEmail: '', batchName: '' }))}>
              <option value="all">All students in this domain ({studentsInDomain.length})</option>
              <option value="batch">Specific Batch in this domain</option>
              <option value="one">One specific student</option>
            </select>
          </div>
          {mentorForm.target === 'batch' && (
            <div className="field">
              <label>Batch</label>
              <select required value={mentorForm.batchName || ''} onChange={(e) => setMentorForm((f) => ({ ...f, batchName: e.target.value }))}>
                <option value="">Select a batch...</option>
                {domainBatches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}
          {mentorForm.target === 'one' && (
            <div className="field">
              <label>Student</label>
              <select required value={mentorForm.studentEmail} onChange={(e) => setMentorForm((f) => ({ ...f, studentEmail: e.target.value }))}>
                <option value="">Select a student...</option>
                {studentsInDomain.map((s) => <option key={s.email} value={s.email}>{s.name} ({s.student_id})</option>)}
              </select>
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-block">Assign Mentor</button>
        </form>
      </Modal>

      {/* Bulk Upload CSV Modal */}
      <Modal open={bulkOpen} onClose={() => { if (!bulkBusy) { setBulkOpen(false); setBulkStudents([]); setBulkProgress(null); setBulkError(null); } }} wide={true}>
        <h2>Bulk Upload Students (CSV)</h2>
        <p className="text-muted" style={{ marginBottom: 20, fontSize: '0.85rem' }}>
          Upload a CSV file containing columns: <strong>name</strong>, <strong>email</strong>, and <strong>domain</strong> (optionally <strong>phone</strong>, <strong>batch</strong>).
        </p>

        {bulkError && <div className="auth-banner auth-banner-error" style={{ marginBottom: 16 }}>{bulkError}</div>}

        {!bulkProgress && (
          <div className="field">
            <label>Select CSV File</label>
            <input type="file" accept=".csv" onChange={handleCSVChange} disabled={bulkBusy} />
          </div>
        )}

        {bulkStudents.length > 0 && !bulkProgress && (
          <div>
            <h3 style={{ margin: '16px 0 10px', fontSize: '0.95rem' }}>Preview ({bulkStudents.length} students found)</h3>
            <div style={{ maxHeight: 200, overflowY: 'auto', background: 'var(--surface-2)', borderRadius: 8, padding: 8, marginBottom: 20 }}>
              <table className="admin-table" style={{ minWidth: 'unset', fontSize: '0.8rem' }}>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Phone</th><th>Domain</th><th>Batch</th></tr>
                </thead>
                <tbody>
                  {bulkStudents.slice(0, 10).map((s, idx) => (
                    <tr key={idx}>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                      <td>{s.phone || '-'}</td>
                      <td>{s.domain}</td>
                      <td>{s.batchName || 'General'}</td>
                    </tr>
                  ))}
                  {bulkStudents.length > 10 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        ... and {bulkStudents.length - 10} more students
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button className="btn btn-primary btn-block" onClick={() => handleBulkImport(bulkStudents)} disabled={bulkBusy}>
              Import {bulkStudents.length} Students
            </button>
          </div>
        )}

        {bulkProgress && (
          <div style={{ padding: '16px 0' }}>
            <h3 style={{ marginBottom: 8, fontSize: '1rem' }}>
              {bulkBusy ? 'Importing Students...' : 'Import Complete!'}
            </h3>
            <div style={{ height: 10, background: 'var(--surface-2)', borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{
                height: '100%',
                background: 'var(--accent-strong)',
                width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
                transition: 'width 0.1s var(--ease)'
              }} />
            </div>
            <p style={{ fontSize: '0.85rem', marginBottom: 16 }}>
              Processed {bulkProgress.current} of {bulkProgress.total} students ({bulkProgress.successes} successful, {bulkProgress.errors.length} failed).
            </p>

            {bulkProgress.errors.length > 0 && (
              <div>
                <h4 style={{ color: 'var(--err-500)', fontSize: '0.85rem', marginBottom: 6 }}>Failures:</h4>
                <div style={{ maxHeight: 150, overflowY: 'auto', background: 'var(--surface-2)', borderRadius: 8, padding: 8, fontSize: '0.75rem' }}>
                  {bulkProgress.errors.map((e, idx) => (
                    <div key={idx} style={{ marginBottom: 6, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                      <strong>{e.name}</strong> ({e.email}): <span style={{ color: 'var(--err-500)' }}>{e.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!bulkBusy && (
              <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={() => { setBulkOpen(false); setBulkStudents([]); setBulkProgress(null); }}>
                Done
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Bulk Resend Credentials */}
      <Modal open={bulkResendOpen} onClose={() => { if (!bulkResendBusy) setBulkResendOpen(false); }}>
        <h2 style={{ marginBottom: 20 }}>Bulk Resend Credentials</h2>
        {bulkResendResult ? (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: 10 }}>Resend Complete</h3>
            <p style={{ marginBottom: 20 }}>
              Successfully sent to <strong>{bulkResendResult.successful}</strong> students.
              <br />
              Failed to send to <strong>{bulkResendResult.failed}</strong> students.
            </p>
            {bulkResendResult.errors?.length > 0 && (
              <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: '0.85rem', color: 'var(--danger)', textAlign: 'left', maxHeight: 150, overflowY: 'auto', marginBottom: 20 }}>
                {bulkResendResult.errors.map((e, i) => <div key={i}>ID {e.id}: {e.error}</div>)}
              </div>
            )}
            <button className="btn btn-primary btn-block" onClick={() => setBulkResendOpen(false)}>Done</button>
          </div>
        ) : (
          <>
            <p className="text-muted" style={{ marginBottom: 20, fontSize: '0.9rem' }}>
              Select a batch to automatically find all students who <strong>have never logged in</strong> and resend them a fresh password. 
              <br/><br/>
              <em>Warning: Sending to hundreds of students at once may exceed your email provider's daily limits.</em>
            </p>
            <form onSubmit={submitBulkResend}>
              <div className="field">
                <label>Target Batch</label>
                <select required value={bulkResendBatch} onChange={e => setBulkResendBatch(e.target.value)}>
                  <option value="">Select a batch...</option>
                  {batches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={bulkResendBusy || !bulkResendBatch}>
                  {bulkResendBusy ? 'Processing...' : 'Send Emails'}
                </button>
                <span className="text-muted" style={{ flex: 1, fontSize: '0.8rem', alignSelf: 'center' }}>
                  Credentials are sent securely by email.
                </span>
              </div>
            </form>
          </>
        )}
      </Modal>

    </section>
  );
}
