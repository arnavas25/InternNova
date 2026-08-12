import { useEffect, useState } from 'react';
import { RotateCw, Send, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { callAdminApi } from '../../lib/adminApi';
import Modal from '../Modal';

export default function NewsletterTable() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await callAdminApi('get-subscribers', {});
      setSubscribers(data.subscribers || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!confirm(`Are you sure you want to send this email to all ${subscribers.length} subscribers?`)) return;
    
    setSending(true);
    setResult(null);
    try {
      const data = await callAdminApi('send-newsletter', {
        subject: form.subject,
        html: form.message
      });
      setResult({ success: true, message: `Successfully sent to ${data.sentCount} subscribers.` });
      setForm({ subject: '', message: '' });
      setTimeout(() => { setModalOpen(false); setResult(null); }, 3000);
    } catch (err) {
      setResult({ success: false, message: err.message });
    }
    setSending(false);
  };

  const removeSubscriber = async (id) => {
    if (!confirm('Remove this subscriber?')) return;
    try {
      await callAdminApi('delete-subscriber', { id });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Newsletter Subscribers ({subscribers.length})</h2>
        <div className="admin-section-actions">
          <button className="btn btn-outline btn-sm" onClick={() => setModalOpen(true)}><Send size={14} /> Send Mass Email</button>
          <button className="btn btn-primary btn-sm" onClick={load}><RotateCw size={14} /> Refresh</button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th style={{ width: 60, minWidth: 60, maxWidth: 60 }}>S.No.</th><th>Email Address</th><th>Subscribed At</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4}>Loading...</td></tr> : subscribers.length === 0 ? <tr><td colSpan={4}>No subscribers yet.</td></tr> : subscribers.map((sub, idx) => (
              <tr key={sub.id}>
                <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                <td>{sub.email}</td>
                <td>{new Date(sub.subscribed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td>
                  <button className="action-btn is-delete" onClick={() => removeSubscriber(sub.id)}><Trash2 size={14} /> Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => !sending && setModalOpen(false)}>
        <h2>Send Newsletter Broadcast</h2>
        <p className="text-muted" style={{ marginBottom: '16px', fontSize: '0.85rem' }}>This will email all {subscribers.length} subscribers.</p>
        
        {result && (
          <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', background: result.success ? 'var(--ok-tint)' : 'var(--err-tint)', color: result.success ? 'var(--ok-500)' : 'var(--err-500)', border: `1px solid ${result.success ? 'var(--ok-500)' : 'var(--err-500)'}` }}>
            {result.message}
          </div>
        )}

        <form onSubmit={handleSend}>
          <div className="field">
            <label>Subject</label>
            <input required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. November Batch Announcements!" />
          </div>
          <div className="field">
            <label>HTML Content / Message</label>
            <textarea required rows={8} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="<h1>Hello</h1><p>Write your HTML or plain text message here.</p>" style={{ fontFamily: 'var(--font-mono)' }}></textarea>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={sending || subscribers.length === 0}>
            {sending ? 'Sending Broadcast...' : 'Send Broadcast'}
          </button>
        </form>
      </Modal>
    </section>
  );
}
