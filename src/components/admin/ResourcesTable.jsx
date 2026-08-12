import { useEffect, useState } from 'react';
import { RotateCw, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

const DOMAINS = ['Web Development', 'Data Analytics', 'Cyber Security', 'Artificial Intelligence', 'Digital Marketing', 'Human Resources', 'Python Programming', 'Java Development'];
const TYPES = ['video', 'pdf', 'link'];

export default function ResourcesTable({ onChange, currentUser }) {
  const [resources, setResources] = useState([]);
  const [batches, setBatches] = useState([]);
  const [domains, setDomains] = useState(DOMAINS);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ week: 1, domain: DOMAINS[0], batch_name: '', title: '', type: 'video', url: '' });

  const isMentor = currentUser?.role === 'mentor';

  const load = async () => {
    let url = '/api/admin?action=admin-resources';
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
      if (!res.ok) throw new Error('Failed to fetch resources');
      const data = await res.json();
      setResources(data || []);
      
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, filterBatch, filterDomain]);

  const filtered = resources.filter((r) => {
    const k = search.toLowerCase();
    return (r.title || '').toLowerCase().includes(k) || (r.domain || '').toLowerCase().includes(k) || (r.type || '').toLowerCase().includes(k) || (r.batch_name || '').toLowerCase().includes(k);
  });

  const openAdd = () => { 
    setEditing(null); 
    setForm({ 
      week: 1, 
      domain: isMentor ? currentUser.domain : DOMAINS[0], 
      batch_name: isMentor ? currentUser.batch_name : '', 
      title: '', type: 'video', url: '' 
    }); 
    setModalOpen(true); 
  };
  
  const openEdit = (r) => { 
    setEditing(r); 
    setForm({ week: r.week || 1, domain: r.domain, batch_name: r.batch_name || '', title: r.title, type: r.type, url: r.url }); 
    setModalOpen(true); 
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let res;
      if (editing) {
        res = await fetch('/api/admin?action=admin-resources', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ id: editing.id, ...form })
        });
      } else {
        res = await fetch('/api/admin?action=admin-resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify(form)
        });
      }
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      setModalOpen(false);
      load(); 
      onChange?.();
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (r) => {
    if (!confirm('Delete this resource?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin?action=admin-resources', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id: r.id })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      load(); 
      onChange?.();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            Resource Management
          </h2>
        </div>
        <div className="admin-section-actions">
          <input placeholder="Search Resource..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
          <button className="btn btn-outline btn-sm" onClick={openAdd}><Plus size={14} /> Add Resource</button>
          <button className="btn btn-primary btn-sm" onClick={load}><RotateCw size={14} /> Refresh</button>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Week</th><th>Domain</th><th>Batch</th><th>Title</th><th>Type</th><th>Open</th><th>Uploaded By</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}>Loading Resources...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}>No Resources Available</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id}>
                <td>Week {r.week}</td>
                <td>{r.domain}</td>
                <td>{r.batch_name || <span className="text-muted">All</span>}</td>
                <td>{r.title}</td>
                <td>{r.type}</td>
                <td><a href={r.url} target="_blank" rel="noreferrer">Open</a></td>
                <td>{r.uploaded_by || '-'}</td>
                <td className="admin-actions">
                  <button className="action-btn is-edit" onClick={() => openEdit(r)}><Edit2 size={14} /> Edit</button>
                  <button className="action-btn is-delete" onClick={() => remove(r)}><Trash2 size={14} /> Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 style={{ marginBottom: 20 }}>{editing ? 'Edit Resource' : 'Add Resource'}</h2>
        <form onSubmit={submit}>
          <div className="field">
            <label>Week</label>
            <input type="number" min="1" max="4" required value={form.week} onChange={(e) => setForm((f) => ({ ...f, week: Number(e.target.value) }))} />
          </div>
          <div className="field">
            <label>Domain</label>
            <select required disabled={isMentor} value={form.domain} onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Batch Cohort (Optional)</label>
            <select disabled={isMentor} value={form.batch_name} onChange={(e) => setForm((f) => ({ ...f, batch_name: e.target.value }))}>
              <option value="">All Batches in Domain</option>
              {batches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Title</label>
            <input required placeholder="e.g. Week 1 - Intro to Flexbox" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="field">
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label>URL (Drive / YouTube / PDF link)</label>
            <input type="url" required placeholder="https://..." value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary btn-block">{editing ? 'Save Changes' : 'Upload Resource'}</button>
        </form>
      </Modal>
    </section>
  );
}
