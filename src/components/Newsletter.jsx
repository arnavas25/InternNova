import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const blockedDomains = [
    'mailinator.com', '10minutemail.com', 'tempmail.com', 'guerrillamail.com',
    'yopmail.com', 'trashmail.com', 'fake.com', 'test.com'
  ];

  const validateEmail = (emailStr) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailStr)) {
      return { valid: false, reason: 'Please enter a valid email address.' };
    }
    const domain = emailStr.split('@')[1]?.toLowerCase();
    if (blockedDomains.includes(domain)) {
      return { valid: false, reason: 'Temporary email addresses are not allowed.' };
    }
    return { valid: true };
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const validation = validateEmail(email.trim());
    if (!validation.valid) {
      setMessage({ text: validation.reason, type: 'error' });
      setLoading(false);
      return;
    }

    if (!supabase) {
      setMessage({ text: 'Service unavailable. Please try again later.', type: 'error' });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email: email.trim().toLowerCase() }]);

    if (error) {
      if (error.code === '23505') {
        setMessage({ text: 'You are already subscribed to our newsletter!', type: 'info' });
      } else {
        setMessage({ text: 'Something went wrong. Please try again.', type: 'error' });
      }
    } else {
      setMessage({ text: 'Thank you for subscribing! 🎉', type: 'success' });
      setEmail('');
    }
    setLoading(false);
  };

  return (
    <section className="section" style={{ paddingTop: '20px', paddingBottom: '80px' }}>
      <div className="container">
        
        {/* Left Aligned Section Head */}
        <div className="section-head">
          <span className="eyebrow">STAY CONNECTED</span>
          <h2>Subscribe to our Newsletter</h2>
          <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
            Get exclusive updates, new batch announcements, and career opportunities delivered directly to your inbox.
          </p>
        </div>

        {/* Input Form Box */}
        <div style={{
          backgroundColor: 'var(--bg-raised)',
          padding: '28px 24px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          maxWidth: '640px'
        }}>
          <form onSubmit={handleSubscribe} style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center'
          }}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                flex: '1',
                minWidth: '240px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-strong)',
                fontSize: '14px',
                outline: 'none',
                color: 'var(--text)',
                backgroundColor: 'var(--surface-2)'
              }}
            />
            
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {loading ? 'Submitting...' : 'Subscribe →'}
            </button>
          </form>

          {message.text && (
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              backgroundColor: 
                message.type === 'success' ? '#f0fdf4' : 
                message.type === 'info' ? '#eff6ff' : '#fef2f2',
              color: 
                message.type === 'success' ? '#166534' : 
                message.type === 'info' ? '#1e40af' : '#991b1b',
              border: `1px solid ${
                message.type === 'success' ? '#bbf7d0' : 
                message.type === 'info' ? '#bfdbfe' : '#fecaca'
              }`
            }}>
              {message.text}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
