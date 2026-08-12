import { useEffect, useState } from 'react';
import { RotateCw, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

const DOMAINS = ['All', 'Web Development', 'Data Analytics', 'Cyber Security', 'Artificial Intelligence', 'Digital Marketing', 'Human Resources', 'Python Programming', 'Java Development'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export default function AnnouncementsTable({ currentUser }) {
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [domains, setDomains] = useState(DOMAINS);
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', message: '', target: 'All', batch_name: 'All', priority: 'Medium' });

  const load = async () => {
    let q = supabase.from('announcements').select('*').order('created_at', { ascending: false });
    
    if (filterDomain) q = q.eq('target', filterDomain);
    if (filterBatch) q = q.eq('batch_name', filterBatch);
    
    const { data, error } = await q;
    if (error) { console.error(error); return; }
    setItems(data || []);
    
    // Fetch unique batches and domains bypassing the 1000 row limit
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
    fetchAllFilters();

    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, filterBatch, filterDomain]);

  const openAdd = () => { setEditing(null); setForm({ title: '', message: '', target: 'All', batch_name: 'All', priority: 'Medium' }); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ title: item.title || '', message: item.message, target: item.target, batch_name: item.batch_name || 'All', priority: item.priority }); setModalOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase.from('announcements').update(form).eq('id', editing.id);
      if (error) { alert(error.message); return; }
    } else {
      const { error } = await supabase.from('announcements').insert({ ...form, created_by: currentUser?.full_name || 'Admin', created_at: new Date() });
      if (error) { alert(error.message); return; }
    }
    setModalOpen(false);
    load();
  };

  const remove = async (item) => {
    if (!confirm('Delete this announcement?')) return;
    await supabase.from('announcements').delete().eq('id', item.id);
    load();
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Announcements</h2>
        <div className="admin-section-actions">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select className="btn btn-outline btn-sm" value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
              <option value="">All Domains</option>
              {domains.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="btn btn-outline btn-sm" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
              <option value="">All Batches</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <button className="btn btn-outline btn-sm" onClick={openAdd}><Plus size={14} /> New Announcement</button>
          <button className="btn btn-primary btn-sm" onClick={load}><RotateCw size={14} /> Refresh</button>
        </div>
      </div>
      <p className="text-muted" style={{ marginBottom: 14, fontSize: '0.85rem' }}>
        "Target" controls who sees this on their dashboard — "All" reaches every student, or pick a specific domain. You can also target by Batch.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Domain Target</th><th>Batch Target</th><th>Priority</th><th>Created By</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>Loading Announcements...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7}>No Announcements</td></tr>
            ) : items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.target}</td>
                <td>{item.batch_name || 'All'}</td>
                <td><span className={`status-pill ${item.priority === 'High' ? 'status-inactive' : item.priority === 'Medium' ? 'status-pending' : 'status-active'}`}>{item.priority}</span></td>
                <td>{item.created_by}</td>
                <td>{item.created_at?.split?.('T')[0] || '-'}</td>
                <td className="admin-actions">
                  <button className="action-btn is-edit" onClick={() => openEdit(item)}>Edit</button>
                  <button className="action-btn is-delete" onClick={() => remove(item)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 style={{ marginBottom: 20 }}>{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
        <form onSubmit={submit}>
          <div className="field">
            <label>Title</label>
            <input required placeholder="e.g. Batch 2 Kickoff" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="field">
            <label>Message</label>
            <textarea required rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
          </div>
          <div className="field">
            <label>Target Domain</label>
            <select value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}>
              {domains.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Target Batch</label>
            <select value={form.batch_name} onChange={(e) => setForm((f) => ({ ...f, batch_name: e.target.value }))}>
              <option value="All">All Batches</option>
              {batches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Priority</label>
            <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block">{editing ? 'Save Changes' : 'Publish Announcement'}</button>
        </form>
      </Modal>
    </section>
  );
}
