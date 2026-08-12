import { useEffect, useState } from 'react';
import { RotateCw, Search, CreditCard, Trash2, Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

export default function EnrollmentsTable({ onChange }) {
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', college: '', branch: '', year: '' });

  const load = async () => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .order('enrolled_at', { ascending: false });
    if (error) { console.error(error); return; }
    setEnrollments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 45000);
    return () => clearInterval(id);
  }, []);

  const filtered = enrollments.filter((e) => {
    const k = search.toLowerCase();
    return (
      (e.name || '').toLowerCase().includes(k) ||
      (e.email || '').toLowerCase().includes(k) ||
      (e.domain || '').toLowerCase().includes(k) ||
      (e.college || '').toLowerCase().includes(k)
    );
  });

  const openEdit = (e) => {
    setEditing(e);
    setEditForm({
      name: e.name || '',
      phone: e.phone || '',
      college: e.college || '',
      branch: e.branch || '',
      year: e.year || ''
    });
    setEditOpen(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('enrollments')
      .update(editForm)
      .eq('id', editing.id);
    if (error) { alert(error.message); return; }
    setEditOpen(false);
    load();
    onChange?.();
  };

  const remove = async (e) => {
    if (!confirm(`Delete enrollment for ${e.name}? This will delete the enrollment history.`)) return;
    const { error } = await supabase.from('enrollments').delete().eq('id', e.id);
    if (error) { alert(error.message); return; }
    load();
    onChange?.();
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Course Students Management</h2>
        <div className="admin-section-actions">
          <input
            placeholder="Search student or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={load}>
            <RotateCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Email / WhatsApp</th>
              <th>Course</th>
              <th>College / Branch / Year</th>
              <th>Razorpay ID</th>
              <th>Amount</th>
              <th>Enroll Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}>Loading Course Students...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}>No Paid Course Students Found</td></tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.name}</strong>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem' }}>{e.email}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{e.phone || '-'}</div>
                  </td>
                  <td><span className="highlight-text">{e.domain}</span></td>
                  <td>
                    <div>{e.college || '-'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {e.branch || '-'} {e.year ? `(${e.year})` : ''}
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: '0.8rem' }}>{e.razorpay_payment_id || '-'}</td>
                  <td>₹{e.amount}</td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : '-'}
                  </td>
                  <td className="admin-actions">
                    <button className="action-btn is-edit" onClick={() => openEdit(e)}>Edit</button>
                    <button className="action-btn is-delete" onClick={() => remove(e)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <h2>Edit Course Student</h2>
        <p className="text-muted" style={{ marginBottom: 18, fontSize: '0.85rem' }}>Update enrollment records for {editing?.name}.</p>
        <form onSubmit={submitEdit}>
          <div className="field">
            <label>Student Name</label>
            <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div className="field">
            <label>WhatsApp Number</label>
            <input required value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          </div>
          <div className="field">
            <label>College</label>
            <input required value={editForm.college} onChange={(e) => setEditForm({ ...editForm, college: e.target.value })} />
          </div>
          <div className="field">
            <label>Branch / Major</label>
            <input required value={editForm.branch} onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })} />
          </div>
          <div className="field">
            <label>Year of Study</label>
            <select value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="Graduate / Post-Graduate">Graduate / Post-Graduate</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Save Changes</button>
        </form>
      </Modal>
    </section>
  );
}
