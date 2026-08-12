import { useEffect, useState } from 'react';
import { RotateCw, UserPlus, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { callAdminApi } from '../../lib/adminApi';
import Modal from '../Modal';

const ROLES = [['mentor', 'Mentor'], ['admin', 'Admin'], ['super_admin', 'Super Admin']];
const DEPARTMENTS = ['Administration', 'Academic', 'Technical', 'Marketing', 'HR', 'Operations'];
const DOMAINS = ['Web Development', 'Data Analytics', 'Cyber Security', 'Artificial Intelligence', 'Digital Marketing', 'Human Resources', 'Python Programming', 'Java Development'];

export default function StaffTable({ onChange, currentUser }) {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: '', email: '', phone: '', department: DEPARTMENTS[0], role: ROLES[0][0] });
  const [addBusy, setAddBusy] = useState(false);
  const [addResult, setAddResult] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', department: '', role: '', status: 'active' });

  const load = async () => {
    const { data, error } = await supabase.from('staff_users').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    setStaff(data || []);

    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = staff.filter((u) => {
    const k = search.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(k) || (u.email || '').toLowerCase().includes(k) || (u.role || '').toLowerCase().includes(k) || (u.department || '').toLowerCase().includes(k);
  });

  const closeAdd = () => { setAddOpen(false); setAddResult(null); setAddForm({ fullName: '', email: '', phone: '', department: DEPARTMENTS[0], role: ROLES[0][0] }); };

  const submitAdd = async (e) => {
    e.preventDefault();
    setAddBusy(true);
    try {
      const result = await callAdminApi('create-staff', addForm);
      setAddResult(result);
      load(); onChange?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setAddBusy(false);
    }
  };

  const copyCreds = () => {
    const text = `Staff ID: ${addResult.staffId}\nEmail: ${addResult.email}\nPassword: ${addResult.password}\nLogin at: ${window.location.origin}/staff-login`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  const openEdit = (u) => {
    setEditing(u);
    setEditForm({ full_name: u.full_name || '', phone: u.phone || '', department: u.department || DEPARTMENTS[0], role: u.role || 'mentor', status: u.status || 'active' });
    setEditOpen(true);
  };
  const submitEdit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('staff_users').update({
      full_name: editForm.full_name,
      phone: editForm.phone,
      department: editForm.department,
      role: editForm.role,
      status: editForm.status
    }).eq('id', editing.id);
    if (error) { alert(error.message); return; }
    setEditOpen(false);
    load(); onChange?.();
  };

  const remove = async (u) => {
    if (!confirm(`Delete ${u.full_name}? This cannot be undone.`)) return;
    const { error } = await supabase.from('staff_users').delete().eq('id', u.id);
    if (error) { alert(error.message); return; }
    load(); onChange?.();
  };

  const canEdit = (u) => {
    if (u.id === currentUser.id) return false;
    if (currentUser.role === 'super_admin') return true;
    return u.role === 'mentor';
  };

  const allowedRoles = currentUser.role === 'super_admin' ? ROLES : ROLES.filter(([v]) => v === 'mentor');

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Staff Management</h2>
        <div className="admin-section-actions">
          <input placeholder="Search Staff..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-outline btn-sm" onClick={() => setAddOpen(true)}><UserPlus size={14} /> Add Staff</button>
          <button className="btn btn-primary btn-sm" onClick={load}><RotateCw size={14} /> Refresh</button>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Staff ID</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}>Loading Staff...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}>No staff yet — click "Add Staff" to create the first account.</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.staff_id || '-'}</td>
                <td>{u.full_name || '-'}</td>
                <td>{u.email || '-'}</td>
                <td>{u.role || '-'}</td>
                <td>{u.department || '-'}</td>
                <td><span className={`status-pill status-${(u.status || '').toLowerCase()}`}>{u.status || '-'}</span></td>
                <td className="admin-actions">
                  {canEdit(u) ? (
                    <>
                      <button className="action-btn is-edit" onClick={() => openEdit(u)}>Edit</button>
                      <button className="action-btn is-delete" onClick={() => remove(u)}>Delete</button>
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
              <div style={{ marginBottom: 6 }}><strong>ID:</strong> {addResult.staffId}</div>
              <div style={{ marginBottom: 6 }}><strong>Email:</strong> {addResult.email}</div>
              <div><strong>Password:</strong> {addResult.password}</div>
            </div>
            <button className="btn btn-outline btn-block" style={{ marginBottom: 10 }} onClick={copyCreds}><Copy size={14} /> Copy Credentials</button>
            <button className="btn btn-primary btn-block" onClick={closeAdd}>Done</button>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: 20 }}>Add Staff</h2>
            <p className="text-muted" style={{ marginBottom: 16, fontSize: '0.85rem' }}>
              This creates their login account immediately and emails them their Staff ID + a temporary password.
            </p>
            <form onSubmit={submitAdd}>
              <div className="field">
                <label>Full Name</label>
                <input required placeholder="John Mentor" value={addForm.fullName} onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" required placeholder="name@internnova.co.in" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="field">
                <label>Phone</label>
                <input type="tel" placeholder="+91XXXXXXXXXX" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="field">
                <label>Department</label>
                <select value={addForm.department} onChange={(e) => setAddForm((f) => ({ ...f, department: e.target.value }))}>
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Role</label>
                <select value={addForm.role} onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))} disabled={allowedRoles.length === 1}>
                  {allowedRoles.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={addBusy}>
                {addBusy ? 'Creating…' : 'Create Account & Send Credentials'}
              </button>
            </form>
          </>
        )}
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <h2 style={{ marginBottom: 20 }}>Edit {editing?.full_name}</h2>
        <form onSubmit={submitEdit}>
          <div className="field">
            <label>Full Name</label>
            <input required value={editForm.full_name} onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input type="tel" placeholder="+91XXXXXXXXXX" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="field">
            <label>Department</label>
            <select value={editForm.department} onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Role</label>
            <select value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))} disabled={allowedRoles.length === 1}>
              {allowedRoles.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Status</label>
            <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Save Changes</button>
        </form>
      </Modal>
    </section>
  );
}
