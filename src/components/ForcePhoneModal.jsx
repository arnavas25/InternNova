import { useState } from 'react';
import { Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from './Modal';
import _PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const PhoneInput = _PhoneInput.default ? _PhoneInput.default : _PhoneInput;

export default function ForcePhoneModal({ open, studentEmail, onDone }) {
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!phone || phone.length < 8) {
      setError('Please enter a valid phone number.');
      return;
    }

    setBusy(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        setError('Your session expired. Please refresh the page and log in again.');
        return;
      }

      const res = await fetch('/api/update-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ email: studentEmail, phone: '+' + phone }) // react-phone-input-2 drops the + by default
      });
      
      const clonedRes = res.clone();
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        const text = await clonedRes.text();
        throw new Error(`API error (not JSON): Status ${res.status}. Body: ${text.substring(0, 100)}`);
      }

      if (!res.ok) {
        setError(data?.error || 'Failed to save phone number.');
        return;
      }

      onDone('+' + phone);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={() => {}} // Non-dismissible
      overflowVisible={true}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent)' }}>
          <Phone size={22} /> Action Required
        </div>
      }
      size="sm"
    >
      <div style={{ padding: '0 5px' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.95rem', lineHeight: '1.5' }}>
          Welcome! To complete your profile and ensure you receive critical updates, please add your active phone or WhatsApp number.
        </p>

        <form onSubmit={submit}>
          <div className="field" style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text)' }}>
              Phone / WhatsApp Number
            </label>
            <PhoneInput
              country={'in'}
              enableSearch={true}
              value={phone}
              onChange={setPhone}
              disabled={busy}
              inputStyle={{
                width: '100%',
                background: 'var(--surface-2)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text)',
                borderRadius: '8px',
                height: '42px',
                fontSize: '1rem',
              }}
              buttonStyle={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-strong)',
                borderRadius: '8px 0 0 8px',
              }}
              dropdownStyle={{
                background: '#18181b',
                color: '#fff',
                border: '1px solid var(--border-strong)',
              }}
              searchStyle={{
                background: '#27272a',
                color: '#fff',
                margin: '0',
                width: '100%',
                padding: '10px',
                borderBottom: '1px solid var(--border-strong)'
              }}
            />
          </div>

          {error && (
            <div className="alert-box" style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              padding: '12px', 
              borderRadius: '8px',
              fontSize: '0.9rem',
              marginBottom: '20px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {busy ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
