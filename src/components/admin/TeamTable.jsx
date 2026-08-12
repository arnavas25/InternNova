import { useEffect, useState, useRef } from 'react';
import { RotateCw, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

const DEFAULT_TEAM = [
  { name: 'Avya Nand', designation: 'Founder & CEO', photo_url: '/avya.jpg' },
  { name: 'Arnav Raj', designation: 'Head of Operations and Student Relation', photo_url: '/arnav.jpg' },
  { name: 'Vinay Pal', designation: 'Head of Technology', photo_url: '/vinay.jpg' },
  { name: 'Vaidik Dubey', designation: 'Head of Product & Innovation', photo_url: '/vaidik.jpg' },
  { name: 'Arnav Tiwari', designation: 'Mentor', photo_url: '/arnav.jpg' },
  { name: 'Raghavji Choudhary', designation: 'Mentor', photo_url: '/raghavji.jpg' },
  { name: 'Sahadev Rajiv Kumar Vishwakarma', designation: 'Mentor', photo_url: '/sahadev.jpg' }
];

export default function TeamTable() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', designation: '', photo_url: '' });
  const [addBusy, setAddBusy] = useState(false);
  const addFileRef = useRef(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', designation: '', photo_url: '' });
  const [editBusy, setEditBusy] = useState(false);
  const editFileRef = useRef(null);

  const getRoleWeight = (designation) => {
    const d = (designation || '').toLowerCase();
    if (d.includes('founder') || d.includes('ceo')) return 1;
    if (d.includes('operations')) return 2;
    if (d.includes('technology')) return 3;
    if (d.includes('product')) return 4;
    if (d.includes('mentor')) return 5;
    return 6;
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('team_members').select('*');
    if (error) {
      console.error(error);
      if (error.code === '42P01') {
        alert("The team_members table hasn't been created in Supabase yet. Please run the SQL command provided in the walkthrough.");
      }
    } else {
      const sortedData = (data || []).sort((a, b) => {
        const weightA = getRoleWeight(a.designation);
        const weightB = getRoleWeight(b.designation);
        if (weightA !== weightB) return weightA - weightB;
        // If same designation, sort by created_at
        return new Date(a.created_at) - new Date(b.created_at);
      });
      setTeam(sortedData);
    }
    setLoading(false);
  };

  const seedDefaultTeam = async () => {
    if (!confirm('This will populate the database with the original 7 team members. Continue?')) return;
    setLoading(true);
    let successCount = 0;
    for (const member of DEFAULT_TEAM) {
      const { error } = await supabase.from('team_members').insert([member]);
      if (!error) successCount++;
    }
    alert(`Successfully added ${successCount} default team members!`);
    load();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFile = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `team/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const closeAdd = () => { setAddOpen(false); setAddForm({ name: '', designation: '', photo_url: '' }); if (addFileRef.current) addFileRef.current.value = ''; };

  const submitAdd = async (e) => {
    e.preventDefault();
    setAddBusy(true);
    try {
      let finalUrl = addForm.photo_url;
      const file = addFileRef.current?.files[0];
      if (file) {
        finalUrl = await uploadFile(file);
      }
      const { error } = await supabase.from('team_members').insert([{ ...addForm, photo_url: finalUrl }]);
      if (error) throw error;
      closeAdd();
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setAddBusy(false);
    }
  };

  const openEdit = (t) => {
    setEditing(t);
    setEditForm({ name: t.name || '', designation: t.designation || '', photo_url: t.photo_url || '' });
    if (editFileRef.current) editFileRef.current.value = '';
    setEditOpen(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setEditBusy(true);
    try {
      let finalUrl = editForm.photo_url;
      const file = editFileRef.current?.files[0];
      if (file) {
        finalUrl = await uploadFile(file);
      }
      const { error } = await supabase.from('team_members').update({ ...editForm, photo_url: finalUrl }).eq('id', editing.id);
      if (error) throw error;
      setEditOpen(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setEditBusy(false);
    }
  };

  const remove = async (t) => {
    if (!confirm(`Delete ${t.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from('team_members').delete().eq('id', t.id);
    if (error) { alert(error.message); return; }
    load();
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Website Team Members</h2>
        <div className="admin-section-actions">
          {team.length === 0 && !loading && (
             <button className="btn btn-outline btn-sm" onClick={seedDefaultTeam}>Populate Default Team</button>
          )}
          <button className="btn btn-outline btn-sm" onClick={() => setAddOpen(true)}><UserPlus size={14} /> Add Member</button>
          <button className="btn btn-primary btn-sm" onClick={load}><RotateCw size={14} /> Refresh</button>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Photo</th><th>Name</th><th>Designation</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}>Loading Team Members...</td></tr>
            ) : team.length === 0 ? (
              <tr><td colSpan={4}>No team members found. Click "Add Member" to create one.</td></tr>
            ) : team.map((t) => (
              <tr key={t.id}>
                <td>
                  <img src={t.photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'} alt={t.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                </td>
                <td>{t.name || '-'}</td>
                <td>{t.designation || '-'}</td>
                <td className="admin-actions">
                  <button className="action-btn is-edit" onClick={() => openEdit(t)}>Edit</button>
                  <button className="action-btn is-delete" onClick={() => remove(t)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={addOpen} onClose={closeAdd}>
        <h2 style={{ marginBottom: 20 }}>Add Team Member</h2>
        <form onSubmit={submitAdd}>
          <div className="field">
            <label>Name</label>
            <input required placeholder="E.g. Avya Nand" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field">
            <label>Designation</label>
            <input required placeholder="E.g. Founder & CEO" value={addForm.designation} onChange={(e) => setAddForm((f) => ({ ...f, designation: e.target.value }))} />
          </div>
          <div className="field">
            <label>Upload Photo</label>
            <input type="file" accept="image/*" ref={addFileRef} />
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>Or provide a URL below:</p>
          </div>
          <div className="field">
            <label>Photo URL (Optional)</label>
            <input type="url" placeholder="https://..." value={addForm.photo_url} onChange={(e) => setAddForm((f) => ({ ...f, photo_url: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={addBusy}>
            {addBusy ? 'Saving…' : 'Add Team Member'}
          </button>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <h2 style={{ marginBottom: 20 }}>Edit {editing?.name}</h2>
        <form onSubmit={submitEdit}>
          <div className="field">
            <label>Name</label>
            <input required value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field">
            <label>Designation</label>
            <input required value={editForm.designation} onChange={(e) => setEditForm((f) => ({ ...f, designation: e.target.value }))} />
          </div>
          <div className="field">
            <label>Upload New Photo</label>
            <input type="file" accept="image/*" ref={editFileRef} />
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>Leave blank to keep the existing photo, or provide a URL below:</p>
          </div>
          <div className="field">
            <label>Photo URL (Optional)</label>
            <input type="url" placeholder="https://..." value={editForm.photo_url} onChange={(e) => setEditForm((f) => ({ ...f, photo_url: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={editBusy}>
            {editBusy ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Modal>
    </section>
  );
}
