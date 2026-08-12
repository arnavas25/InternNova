import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import './auth.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    // Supabase's client automatically picks up the recovery token from the
    // URL fragment and turns it into a real (temporary) session — we just
    // need to wait for that to happen before allowing the password update.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true);
      }
    });
    // Fallback: if a session already exists by the time this mounts (link
    // already processed), allow proceeding too.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBanner(null);
    if (password.length < 6) { setBanner({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    if (password !== confirm) { setBanner({ type: 'error', text: 'Passwords do not match.' }); return; }

    setBusy(true);
    try {
      // Force a session refresh in case the token expired while they were typing
      await supabase.auth.getSession();

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        if (error.message === 'Auth session missing!') {
          setBanner({ type: 'error', text: 'Your session expired. Please request a new reset link.' });
        } else {
          setBanner({ type: 'error', text: error.message });
        }
        return;
      }
      setDone(true);
    } catch (err) {
      console.error(err);
      setBanner({ type: 'error', text: 'Something went wrong. Please request a new reset link and try again.' });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card card" style={{ textAlign: 'center' }}>
          <CheckCircle2 size={44} color="var(--ok-500)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ marginBottom: 10 }}>Password updated</h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>You can now log in with your new password.</p>
          <button className="btn btn-primary btn-block" onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-head">
          <img src="/logo.png" alt="InternNova" className="auth-logo" />
          <h2>Set a new password</h2>
          <p className="text-muted">Choose a new password for your account.</p>
        </div>

        {banner && <div className={`auth-banner auth-banner-${banner.type}`}>{banner.text}</div>}

        {!ready ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>
            Verifying your reset link… if this doesn't finish in a few seconds, the link may have expired — request a new one from the login page.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
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
              <label><Lock size={13} /> Confirm New Password</label>
              <input type={showPwd ? 'text' : 'password'} required placeholder="••••••••"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
