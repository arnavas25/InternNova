import { useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Download } from 'lucide-react';
import Reveal from '../Reveal';

const VERIFY_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwI17UTXuCOt2typslgHywaq5yu_w3h0JjBG7S9OTs5l3_yvyOC1ccFZom_wgs4wM8t5Q/exec';

export default function CertificateVerify() {
  const [docId, setDocId] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle' }); // idle | loading | found | notfound | error

  const verify = async (e) => {
    e.preventDefault();
    if (!docId.trim() || !email.trim()) {
      setState({ status: 'error', message: 'Please enter Document ID and Email' });
      return;
    }
    setState({ status: 'loading' });
    try {
      const res = await fetch(VERIFY_ENDPOINT);
      const data = await res.json();
      const record = data.find(
        (item) => item.documentId === docId.trim() && item.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (record) setState({ status: 'found', record });
      else setState({ status: 'notfound' });
    } catch (err) {
      console.error('Verification Error:', err);
      setState({ status: 'error', message: 'Verification service unavailable right now. Try again later.' });
    }
  };

  return (
    <>
      <section className="section" id="certificate">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Proof of Work</span>
            <h2>Sample certificate</h2>
            <p>Every intern receives a verified internship completion certificate.</p>
          </div>
          <Reveal className="certificate-frame card">
            <img src="/certificate-sample.png" alt="InternNova sample certificate" />
          </Reveal>
        </div>
      </section>

      <section className="section verify-section" id="verify">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">The Registry</span>
            <h2>Verification portal</h2>
            <p>Confirm any InternNova document by its ID and the registered email.</p>
          </div>
          <Reveal className="verify-box card">
            <form onSubmit={verify}>
              <div className="field">
                <label>Document ID</label>
                <input placeholder="e.g. INOL/2026/WD001" value={docId} onChange={(e) => setDocId(e.target.value)} />
              </div>
              <div className="field">
                <label>Registered Email</label>
                <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-block" disabled={state.status === 'loading'}>
                {state.status === 'loading' ? <><Loader2 size={16} className="spin" /> Verifying…</> : 'Verify Document'}
              </button>
            </form>

            {state.status === 'error' && <p className="verify-msg verify-msg-err">{state.message}</p>}

            {state.status === 'notfound' && (
              <div className="verify-result verify-result-err">
                <XCircle size={20} />
                <div>
                  <h4>Verification failed</h4>
                  <p>Document ID or email not found. Please check your spelling.</p>
                </div>
              </div>
            )}

            {state.status === 'found' && (
              <div className="verify-result verify-result-ok">
                <CheckCircle2 size={20} />
                <div>
                  <h4>Verified</h4>
                  <p><strong>Type:</strong> {state.record.type}</p>
                  <p><strong>Name:</strong> {state.record.name}</p>
                  <p><strong>Domain:</strong> {state.record.domain}</p>
                  <p><strong>Issue Date:</strong> {new Date(state.record.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <a href={state.record.downloadLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
                    <Download size={14} /> Download Document
                  </a>
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}
