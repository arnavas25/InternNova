import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import './auth.css';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Processing your verification link…');

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setMessage('System is not configured. Please contact support.');
      return;
    }

    const handleCallback = async () => {
      try {
        // Check for PKCE code in URL search params
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const type = params.get('type');

        if (code) {
          // PKCE flow: exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Code exchange error:', error);
            setMessage('Verification link expired or invalid. Please request a new one.');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
        }

        // Wait for the auth state change
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Determine where to redirect based on the type
          if (type === 'recovery') {
            navigate('/reset-password');
          } else {
            // Email verification or sign-in — redirect to login
            setMessage('Email verified successfully! Redirecting to login…');
            await supabase.auth.signOut();
            setTimeout(() => navigate('/login'), 1500);
          }
        } else {
          // Listen for auth state change (hash fragment flow)
          const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              sub.subscription.unsubscribe();
              if (type === 'recovery' || window.location.hash.includes('type=recovery')) {
                navigate('/reset-password');
              } else {
                setMessage('Email verified successfully! Redirecting to login…');
                supabase.auth.signOut().then(() => {
                  setTimeout(() => navigate('/login'), 1500);
                });
              }
            } else if (event === 'PASSWORD_RECOVERY') {
              sub.subscription.unsubscribe();
              navigate('/reset-password');
            }
          });

          // Timeout fallback
          setTimeout(() => {
            setMessage('Verification link may have expired. Please request a new one from the login page.');
          }, 8000);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setMessage('Something went wrong. Redirecting to login…');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-card card" style={{ textAlign: 'center' }}>
        <div className="auth-head">
          <img src="/logo.png" alt="InternNova" className="auth-logo" />
          <h2>Account Verification</h2>
        </div>
        <p className="text-muted" style={{ padding: '20px 0' }}>{message}</p>
      </div>
    </div>
  );
}
