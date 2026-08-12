import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IdCard, Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ForcePasswordChange from '../components/ForcePasswordChange';
import './auth.css';

function redirectForRole(role, navigate) {
  navigate('/admin');
}

export default function StaffLogin() {
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pendingStaff, setPendingStaff] = useState(null);
  const [initCheck, setInitCheck] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('staff_id_remember');
    if (saved) { setStaffId(saved); setRemember(true); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!isSupabaseConfigured()) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: staff } = await supabase.from('staff_users').select('*').eq('email', session.user.email).single();
        if (!staff) return;
        if (staff.must_change_password) { setPendingStaff(staff); return; }
        redirectForRole(staff.role, navigate);
      } finally {
        setInitCheck(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (initCheck) {
    return <div className="auth-page staff-auth-page"><div className="admin-loading">Checking active session…</div></div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!staffId.trim() || !password.trim()) {
      setMsg({ type: 'error', text: 'Please fill all fields.' });
      return;
    }
    if (!isSupabaseConfigured()) {
      setMsg({ type: 'error', text: 'Staff portal database is not connected yet.' });
      return;
    }
    setBusy(true);
    try {
      // Look up email securely via Vercel API (bypassing RLS)
      const lookupRes = await fetch('/api/get-staff-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: staffId.trim() })
      });
      const lookupData = await lookupRes.json();
      
      if (!lookupRes.ok) throw new Error(lookupData.error || 'Invalid Staff ID.');

      const { error } = await supabase.auth.signInWithPassword({ email: lookupData.email, password });
      if (error) throw new Error('Incorrect password.');

      const { data: staff, error: staffError } = await supabase.from('staff_users').select('*').eq('staff_id', staffId.trim()).single();
      if (staffError || !staff) throw new Error('Staff account not found.');

      if (remember) localStorage.setItem('staff_id_remember', staffId.trim());
      else localStorage.removeItem('staff_id_remember');

      if (staff.must_change_password) { setPendingStaff(staff); return; }

      setMsg({ type: 'success', text: 'Login Successful...' });
      setTimeout(() => redirectForRole(staff.role, navigate), 800);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!staffId.trim()) { setMsg({ type: 'error', text: 'Enter your Staff ID first to reset password.' }); return; }
    if (!isSupabaseConfigured()) return;
    
    setBusy(true);
    try {
      const lookupRes = await fetch('/api/get-staff-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: staffId.trim() })
      });
      const lookupData = await lookupRes.json();
      
      if (!lookupRes.ok) throw new Error(lookupData.error || 'Invalid Staff ID.');
      
      const { error } = await supabase.auth.resetPasswordForEmail(lookupData.email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      setMsg({ type: 'success', text: 'Password reset link sent to the email associated with this Staff ID.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page staff-auth-page">
      <button className="btn btn-ghost auth-home-link" onClick={() => navigate('/')}><ArrowLeft size={15} /> Home</button>
      <div className="auth-card card staff-card">
        <div className="staff-logo-area">
          <img src="/logo.png" alt="InternNova" />
          <p className="text-muted">Staff Portal</p>
        </div>

        {msg && <div className={`auth-banner auth-banner-${msg.type}`}>{msg.text}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label><IdCard size={13} /> Staff ID</label>
            <input value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="INAD260001" required />
          </div>
          <div className="field">
            <label><Lock size={13} /> Password</label>
            <div className="pwd-wrap">
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
              <button type="button" className="pwd-toggle" onClick={() => setShowPwd((v) => !v)}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="staff-options">
            <label className="checkbox-label">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember Me
            </label>
            <a href="#" onClick={handleForgot}>Forgot Password?</a>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            <LogIn size={15} /> {busy ? 'Signing In…' : 'Login'}
          </button>
        </form>

        <div className="staff-bottom-links">
          <p className="text-muted" style={{ fontSize: '0.82rem' }}>
            Staff accounts are created by a Super Admin — you'll receive your Staff ID and password by email once added.
          </p>
        </div>
      </div>

      {pendingStaff && (
        <ForcePasswordChange
          open={true}
          table="staff_users"
          rowId={pendingStaff.id}
          onDone={() => redirectForRole(pendingStaff.role, navigate)}
        />
      )}
    </div>
  );
}
