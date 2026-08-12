import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Download, Plus, Eye, Loader2, Trash2 } from 'lucide-react';
import Modal from '../Modal';

export default function CertificatesTable() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    domain: 'Web Development',
    start_date: '',
    end_date: '',
    issue_date: new Date().toISOString().split('T')[0]
  });

  const fetchCertificates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    else setCertificates(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleExportCSV = () => {
    if (certificates.length === 0) {
      alert("No certificates to export.");
      return;
    }
    const headers = ['Certificate ID', 'Name', 'Email', 'Domain', 'Issue Date', 'Certificate URL'];
    const rows = certificates.map(c => [
      c.cert_id,
      `"${c.name}"`,
      c.email,
      `"${c.domain}"`,
      c.issue_date,
      `https://internnova.co.in/certificate/${c.cert_id}`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `InternNova_Certificates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      // Generate unique cert ID IN/26/WDxxxx
      const year = new Date().getFullYear().toString().slice(2);
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const cert_id = `IN/${year}/WD${randomPart}`;

      const { data, error } = await supabase.from('certificates').insert([{
        cert_id,
        name: formData.name,
        email: formData.email,
        domain: formData.domain,
        start_date: formData.start_date,
        end_date: formData.end_date,
        issue_date: formData.issue_date
      }]).select().single();

      if (error) throw error;
      setCertificates([data, ...certificates]);
      setShowModal(false);
      setFormData({ name: '', email: '', domain: 'Web Development', start_date: '', end_date: '', issue_date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      console.error(err);
      alert("Error generating certificate: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this certificate? This will invalidate it on the verify page.")) return;
    const { error } = await supabase.from('certificates').delete().eq('id', id);
    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      setCertificates(certificates.filter(c => c.id !== id));
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Certificates</h2>
          <p className="text-muted">Manage all generated internship certificates</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Generate Manually
          </button>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin mx-auto" /></div>
        ) : certificates.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No certificates found.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Certificate ID</th>
                <th>Student Name</th>
                <th>Domain</th>
                <th>Issue Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map(c => (
                <tr key={c.id}>
                  <td><span className="badge badge-purple">{c.cert_id}</span></td>
                  <td>
                    <strong>{c.name}</strong><br/>
                    <span className="text-muted" style={{fontSize:'12px'}}>{c.email}</span>
                  </td>
                  <td>{c.domain}</td>
                  <td>{c.issue_date}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="icon-btn" title="View" onClick={() => window.open(`/certificate/${c.cert_id}`, '_blank')}>
                        <Eye size={16} />
                      </button>
                      <button className="icon-btn text-red-500" title="Delete" onClick={() => handleDelete(c.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <h2 style={{ marginBottom: 20 }}>Generate Certificate</h2>
        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label>Student Name</label>
            <input type="text" required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Student Email</label>
            <input type="email" required className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Domain</label>
            <input type="text" required className="form-input" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Start Date</label>
              <input type="text" placeholder="01 Jul 2026" required className="form-input" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>End Date</label>
              <input type="text" placeholder="30 Jul 2026" required className="form-input" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Issue Date</label>
            <input type="text" required className="form-input" placeholder="23/07/2026" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={generating}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : 'Generate'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
