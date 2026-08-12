import { useState } from 'react';
import { Download, MapPin, CheckCircle2, ShieldCheck, Truck } from 'lucide-react';
import Modal from '../Modal';
import { supabase } from '../../lib/supabase';

export default function CertificateModal({ open, onClose, student, existingOrder }) {
  const [step, setStep] = useState('choose'); // 'choose', 'address', 'processing', 'success'
  const [form, setForm] = useState({
    fullName: student.name || '',
    email: student.email || '',
    phone: student.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [error, setError] = useState('');

  const isIndia = form.country.trim().toLowerCase() === 'india';

  const handleDigitalDownload = () => {
    window.open(student.certificate_link, '_blank');
    onClose();
  };

  const startPhysicalOrder = () => {
    if (!isIndia) {
      setError('Physical Certificate delivery is currently available only within India. You can still download your Digital Certificate for free, which is official and fully valid.');
      return;
    }
    setError('');
    setStep('address');
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');
    setStep('processing');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be logged in.');

      // 1. Create order
      const res = await fetch('/api/cert-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'create' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment.');

      // 2. Open Razorpay
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: 'INR',
        name: 'InternNova',
        description: 'Physical Certificate Order',
        order_id: data.orderId,
        handler: async function (response) {
          try {
            setStep('processing');
            // 3. Verify payment and create record
            const verifyRes = await fetch('/api/cert-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                action: 'verify',
                ...response,
                studentId: student.id,
                domain: student.domain,
                batchName: student.batch_name,
                form
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed.');
            setStep('success');
          } catch (err) {
            console.error(err);
            setError(err.message || 'Verification failed. Contact support if amount was deducted.');
            setStep('address');
          }
        },
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: '#CE9C4C'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(response.error.description || 'Payment failed.');
        setStep('address');
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Payment initialization failed.');
      setStep('address');
    }
  };

  const closeReset = () => {
    setStep('choose');
    setError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={closeReset}>
      {step === 'choose' && (
        <div>
          <h2 style={{ marginBottom: '8px' }}>Get Your Certificate</h2>
          <p className="text-muted" style={{ marginBottom: '24px' }}>Choose how you'd like to receive your official internship certificate.</p>
          
          {error && <div className="auth-banner auth-banner-error" style={{ marginBottom: 16 }}>{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {/* Digital Option */}
            <div className="card" style={{ padding: '24px', border: '2px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text)' }}>Digital</h3>
                <span className="badge badge-neutral">FREE</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} color="var(--ok-500)"/> Instant Download</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} color="var(--ok-500)"/> High-Res PDF</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={14} color="var(--ok-500)"/> Official & Valid</li>
              </ul>
              <button className="btn btn-outline btn-block" style={{ marginTop: 'auto' }} onClick={handleDigitalDownload}>
                <Download size={14} style={{ marginRight: '6px' }} /> Download PDF
              </button>
            </div>

            {/* Physical Option */}
            {existingOrder && existingOrder.payment_status === 'paid' ? (
              <div className="card" style={{ padding: '24px', border: '2px solid var(--ok-500)', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--ok-tint)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text)' }}>Physical</h3>
                  <span className="badge badge-success">Ordered</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                    <strong>Status:</strong> {existingOrder.delivery_status || 'Processing'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>Delivery Address:</strong><br />
                    {existingOrder.address_line1}, {existingOrder.city} - {existingOrder.pincode}
                  </div>
                </div>
                <button className="btn btn-outline btn-block" style={{ marginTop: 'auto', pointerEvents: 'none' }}>
                  <CheckCircle2 size={14} style={{ marginRight: '6px' }} /> Payment Successful
                </button>
              </div>
            ) : (
              <div className="card" style={{ padding: '24px', border: '2px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--accent-tint)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text)' }}>Physical</h3>
                  <span className="badge" style={{ background: 'var(--accent)', color: 'var(--surface-1)' }}>₹199</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={14} color="var(--accent)"/> Home Delivery</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} color="var(--accent)"/> Premium Printed Copy</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} color="var(--accent)"/> Original Signature & Seal</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={14} color="var(--accent)"/> Official & Valid</li>
                </ul>
                <button 
                  className="btn btn-primary btn-block" 
                  style={{ marginTop: 'auto' }} 
                  onClick={startPhysicalOrder}
                  disabled={!isIndia && form.country !== 'India'}
                >
                  <MapPin size={14} style={{ marginRight: '6px' }} /> Order Delivery
                </button>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '20px', background: 'var(--surface-2)' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>Validity & Authenticity</h4>
            <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
              Both the Digital and Physical certificates are equally official and valid. There is no difference in authenticity. The Physical Certificate is simply a premium printed version with an original signature, official stamp, and home delivery (India only).
            </p>
          </div>
        </div>
      )}

      {step === 'address' && (
        <div>
          <h2 style={{ marginBottom: '8px' }}>Delivery Address</h2>
          <p className="text-muted" style={{ marginBottom: '20px' }}>Enter your details for physical delivery.</p>
          
          {error && <div className="auth-banner auth-banner-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Full Name</label>
                <input required type="text" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Phone Number</label>
                <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
            </div>
            
            <div className="field">
              <label>Email Address</label>
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>

            <div className="field">
              <label>House/Flat No. & Street/Area</label>
              <input required type="text" value={form.addressLine1} onChange={e => setForm({...form, addressLine1: e.target.value})} placeholder="123 Main St, Apartment 4B" />
            </div>

            <div className="field">
              <label>Landmark / Address Line 2 (Optional)</label>
              <input type="text" value={form.addressLine2} onChange={e => setForm({...form, addressLine2: e.target.value})} />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="field" style={{ flex: 1 }}>
                <label>City</label>
                <input required type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>State</label>
                <input required type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="field" style={{ flex: 1 }}>
                <label>PIN Code</label>
                <input required type="text" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Country</label>
                <input required type="text" value={form.country} onChange={e => {
                  setForm({...form, country: e.target.value});
                  if (e.target.value.trim().toLowerCase() !== 'india') {
                    setError('Physical Certificate delivery is currently available only within India.');
                  } else {
                    setError('');
                  }
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setStep('choose'); setError(''); }} style={{ flex: 1 }}>Back</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={!isIndia}>Pay ₹199</button>
            </div>
          </form>
        </div>
      )}

      {step === 'processing' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h3>Processing Payment...</h3>
          <p className="text-muted" style={{ marginTop: '10px' }}>Please do not close this window.</p>
        </div>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircle2 size={48} color="var(--ok-500)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ marginBottom: '12px' }}>Order Confirmed!</h2>
          <p className="text-muted" style={{ marginBottom: '24px' }}>Your physical certificate order has been placed successfully. We'll send tracking details to your email once it's shipped.</p>
          <button className="btn btn-primary btn-block" onClick={closeReset}>Done</button>
        </div>
      )}
    </Modal>
  );
}
