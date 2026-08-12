import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from './Modal';

export default function ForcePasswordChange({ open, table, rowId, onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setBusy(true);
    try {
      // Force a session refresh in case the token expired while they were typing
      await supabase.auth.getSession();
      
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) { 
        if (pwError.message === 'Auth session missing!') {
          setError('Your session expired. Please refresh the page and log in again.');
        } else {
          setError(pwError.message); 
        }
        return; 
      }

      const { data: sessionData } = await supabase.auth.getSession();
      
      const res = await fetch('/api/admin?action=clear-password-flag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session?.access_token}`
        },
        body: JSON.stringify({ table, rowId })
      });
      const clonedRes = res.clone();
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        const text = await clonedRes.text();
        throw new Error(`API error (not JSON): Status ${res.status}. Body: ${text.substring(0, 100)}`);
      }

      if (!res.ok) { setError(data?.error || 'Failed to clear password flag.'); return; }

      onDone();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => {}}>
      <h2 style={{ marginBottom: 8 }}>Welcome! Set your password</h2>
      <p className="text-muted" style={{ marginBottom: 20, fontSize: '0.9rem' }}>
        For your security, choose a new password to replace the temporary one you were emailed.
      </p>
      {error && <div className="auth-banner auth-banner-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label><Lock size={13} /> New Password</label>
          <div className="pwd-wrap">
            <input type={showPwd ? 'text' : 'password'} required minLength={6} placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="pwd-toggle" onClick={() => setShowPwd((v) => !v)}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="field">
          <label><Lock size={13} /> Confirm Password</label>
          <input type={showPwd ? 'text' : 'password'} required placeholder="••••••••"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Saving…' : 'Set Password & Continue'}
        </button>
      </form>
    </Modal>
  );
}
