import { useEffect, useState } from 'react';
import { RotateCw, Plus, CalendarDays, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

const DOMAINS = ['Web Development', 'Data Analytics', 'Cyber Security', 'Artificial Intelligence', 'Digital Marketing', 'Human Resources', 'Python Programming', 'Java Development', 'All'];

export default function SessionsTable({ onChange, currentUser }) {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [batches, setBatches] = useState([]);
  const [domains, setDomains] = useState(DOMAINS);
  
  const [form, setForm] = useState({
    title: '',
    session_date: '',
    start_time: '',
    duration_minutes: 60,
    domain: DOMAINS[0],
    batch_name: '',
    meet_link: '',
    resource_link: '',
    resource_file_url: ''
  });

  const load = async () => {
    let q = supabase.from('live_sessions').select('*').order('session_date', { ascending: true });
    
    if (filterDomain) q = q.eq('domain', filterDomain);
    if (filterBatch) q = q.eq('batch_name', filterBatch);
    
    const { data, error } = await q;
    if (error) { console.error(error); return; }
    setSessions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
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

    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [currentUser, filterBatch, filterDomain]);

  const filtered = sessions.filter((s) => {
    const k = search.toLowerCase();
    return (
      (s.title || '').toLowerCase().includes(k) ||
      (s.batch_name || '').toLowerCase().includes(k) ||
      (s.domain || '').toLowerCase().includes(k)
    );
  });

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: '',
      session_date: new Date().toISOString().split('T')[0],
      start_time: '18:00',
      duration_minutes: 60,
      domain: DOMAINS[0],
      batch_name: '',
      meet_link: '',
      resource_link: '',
      resource_file_url: ''
    });
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      title: s.title || '',
      session_date: s.session_date || '',
      start_time: s.start_time || '',
      duration_minutes: s.duration_minutes || 60,
      domain: s.domain || DOMAINS[0],
      batch_name: s.batch_name || '',
      meet_link: s.meet_link || '',
      resource_link: s.resource_link || '',
      resource_file_url: s.resource_file_url || ''
    });
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      duration_minutes: Number(form.duration_minutes)
    };
    if (editing) {
      const { error } = await supabase
        .from('live_sessions')
        .update(payload)
        .eq('id', editing.id);
      if (error) { alert(error.message); return; }
    } else {
      const { error } = await supabase
        .from('live_sessions')
        .insert({ ...payload, created_at: new Date() });
      if (error) { alert(error.message); return; }
    }
    setModalOpen(false);
    load();
    onChange?.();
  };

  const remove = async (s) => {
    if (!confirm('Delete this session?')) return;
    await supabase.from('live_sessions').delete().eq('id', s.id);
    load();
    onChange?.();
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Live Sessions Management</h2>
        <div className="admin-section-actions">
          <input
            placeholder="Search Sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
          <button className="btn btn-outline btn-sm" onClick={openAdd}>
            <Plus size={14} /> Add Session
          </button>
          <button className="btn btn-primary btn-sm" onClick={load}>
            <RotateCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Domain</th>
              <th>Batch</th>
              <th>Meet Link</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>Loading Sessions...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>No Sessions Scheduled</td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.title}</td>
                  <td>
                    {new Date(s.session_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td>{s.start_time?.slice(0, 5)}</td>
                  <td>{s.duration_minutes} mins</td>
                  <td>{s.domain || '-'}</td>
                  <td>{s.batch_name}</td>
                  <td>
                    {s.meet_link ? (
                      <a href={s.meet_link} target="_blank" rel="noreferrer">
                        Join <ExternalLink size={12} style={{ verticalAlign: -1, marginLeft: 2 }} />
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="admin-actions">
                    <button className="action-btn is-edit" onClick={() => openEdit(s)}>
                      Edit
                    </button>
                    <button className="action-btn is-delete" onClick={() => remove(s)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 style={{ marginBottom: 20 }}>
          {editing ? 'Edit Live Session' : 'Schedule Live Session'}
        </h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Session Title</label>
            <input
              required
              placeholder="e.g. Q&A and Portfolio Review"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Session Date</label>
            <input
              type="date"
              required
              value={form.session_date}
              onChange={(e) => setForm((f) => ({ ...f, session_date: e.target.value }))}
            />
          </div>
          <div className="field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label>Start Time</label>
              <input
                type="time"
                required
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              />
            </div>
            <div>
              <label>Duration (mins)</label>
              <input
                type="number"
                min="1"
                required
                value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>Domain</label>
            <select value={form.domain} onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}>
              {domains.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Batch Name</label>
            <select
              required
              value={form.batch_name}
              onChange={(e) => setForm((f) => ({ ...f, batch_name: e.target.value }))}
            >
              <option value="" disabled>Select a batch...</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Google Meet / Zoom URL (Optional)</label>
            <input
              type="url"
              placeholder="https://meet.google.com/..."
              value={form.meet_link}
              onChange={(e) => setForm((f) => ({ ...f, meet_link: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Resource Link (Optional)</label>
            <input
              type="url"
              placeholder="e.g. GitHub repo, Notion page..."
              value={form.resource_link}
              onChange={(e) => setForm((f) => ({ ...f, resource_link: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Resource File URL (Optional)</label>
            <input
              type="url"
              placeholder="e.g. Google Drive PDF link..."
              value={form.resource_file_url}
              onChange={(e) => setForm((f) => ({ ...f, resource_file_url: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            {editing ? 'Save Changes' : 'Schedule Session'}
          </button>
        </form>
      </Modal>
    </section>
  );
}
