import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ForcePasswordChange from '../components/ForcePasswordChange';
import './auth.css';

export default function Login() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [pendingStudent, setPendingStudent] = useState(null); // set when must_change_password is true

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const email = session.user.email.toLowerCase();
      const { data: student } = await supabase.from('students').select('*').eq('email', email).maybeSingle();
      if (!student) { await supabase.auth.signOut(); return; }
      if (student.must_change_password) { setPendingStudent(student); return; }
      navigate(student.is_admin ? '/admin' : '/dashboard');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requireSupabase = () => {
    if (!isSupabaseConfigured()) {
      setBanner({ type: 'error', text: 'The student portal is not connected to a database yet. Please contact the InternNova team.' });
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!requireSupabase()) return;
    setBusy(true);
    setBanner(null);
    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setBanner({ type: 'error', text: 'Incorrect email or password.' }); return; }

      const { data: student, error: studentError } = await supabase.from('students').select('*').eq('email', email).maybeSingle();
      if (studentError || !student) {
        await supabase.auth.signOut();
        setBanner({ type: 'error', text: "We couldn't find your student profile. If you just received your login details, contact InternNova support." });
        return;
      }

      if (student.must_change_password) { setPendingStudent(student); return; }

      setBanner({ type: 'success', text: 'Login successful! Redirecting...' });
      setTimeout(() => navigate(student.is_admin ? '/admin' : '/dashboard'), 800);
    } catch (err) {
      console.error(err);
      setBanner({ type: 'error', text: 'An unexpected error occurred during login.' });
    } finally {
      setBusy(false);
    }
  };

  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!requireSupabase()) return;
    if (cooldown > 0) return;
    if (!form.email) { setBanner({ type: 'error', text: 'Enter your email above first, then click Forgot Password.' }); return; }
    setBusy(true);
    try {
      const resp = await fetch('/api/reset-password-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim() }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setBanner({ type: 'success', text: 'Password reset link sent to your email! Check your inbox (and spam folder).' });
        setCooldown(60);
      } else {
        setBanner({ type: 'error', text: data.error || 'Failed to send password reset email.' });
      }
    } catch (err) {
      console.error(err);
      setBanner({ type: 'error', text: 'Failed to request password reset. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <button className="btn btn-ghost auth-home-link" onClick={() => navigate('/')}><ArrowLeft size={15} /> Home</button>
      <div className="auth-card card">
        <div className="auth-head">
          <img src="/logo.png" alt="InternNova" className="auth-logo" />
          <h2>Student Portal</h2>
          <p className="text-muted">Log in with the credentials emailed to you.</p>
        </div>

        {banner && <div className={`auth-banner auth-banner-${banner.type}`}>{banner.text}</div>}

        <form onSubmit={handleLogin}>
          <div className="field">
            <label><Mail size={13} /> Email Address</label>
            <input type="email" required placeholder="name@email.com" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="field">
            <label><Lock size={13} /> Password</label>
            <div className="pwd-wrap">
              <input type={showPwd ? 'text' : 'password'} required placeholder="••••••••" value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              <button type="button" className="pwd-toggle" onClick={() => setShowPwd((v) => !v)}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="auth-forgot">
            {cooldown > 0 ? (
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>Resend available in {cooldown}s</span>
            ) : (
              <a href="#" onClick={handleForgotPassword}>Forgot Password?</a>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Signing In…' : <>Sign In <ArrowRight size={15} /></>}
          </button>
        </form>

        <div className="auth-foot">
          Don't have login details yet? Once InternNova approves your application, your Student ID and password
          are sent directly to your email — check your inbox (and spam folder).
        </div>
      </div>

      {pendingStudent && (
        <ForcePasswordChange
          open={true}
          table="students"
          rowId={pendingStudent.id}
          onDone={() => navigate(pendingStudent.is_admin ? '/admin' : '/dashboard')}
        />
      )}
    </div>
  );
}
