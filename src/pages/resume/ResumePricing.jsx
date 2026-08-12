import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Lock } from 'lucide-react';
import './resume-builder.css';

export default function ResumePricing() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (plan) => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please enter your Name, Email, and Mobile number before selecting a plan.');
      return;
    }

    if (!formData.email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    const res = await loadRazorpayScript();
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }

    try {
      setLoading(true);
      // 1. Create Order on Server
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, plan })
      });

      let orderData;
      try {
        orderData = await orderRes.json();
      } catch (jsonErr) {
        throw new Error('Server returned invalid response (possibly crashed): ' + orderRes.status);
      }
      
      if (!orderData.orderId) {
        alert('Failed to initiate payment: ' + (orderData.error || 'Unknown server error'));
        setLoading(false);
        return;
      }

      // Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'InternNova',
        description: `InternNova AI Career Hub - ${plan} Plan`,
        order_id: orderData.orderId,
        handler: async function (response) {
          // 3. Verify Payment on Server
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              email: formData.email,
              name: formData.name,
              phone: formData.phone,
              plan
            })
          });

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            localStorage.setItem(`INTERNNOVA_RESUME_TOKEN_${verifyData.resumeId}`, verifyData.accessToken);
            navigate(`/resume/builder/${verifyData.resumeId}`);
          } else {
            alert('Payment verification failed.');
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#3b82f6'
        }
      };

      try {
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (rzpErr) {
        throw new Error('Razorpay SDK crashed: ' + rzpErr.message);
      }
      setLoading(false);

    } catch (err) {
      console.error(err);
      alert('Checkout error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="resume-builder-layout">
      <div className="rb-preview-container">
        <div className="rb-header">
          <h2>Unlock the AI Career Hub</h2>
          <p>Choose a plan to get instant access to our AI-powered resume builder, ATS scoring, and more.</p>
        </div>

        <div className="card" style={{ maxWidth: 500, margin: '0 auto 40px', padding: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>Step 1: Enter your details</h3>
          <p className="text-muted" style={{ marginBottom: '20px', fontSize: '0.9rem' }}>This will be used to send your receipt and recover your resume later.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)'}}>Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)'}}>Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)'}}>Mobile Number</label>
              <input 
                type="tel" 
                className="form-control" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>
        </div>

        {(formData.name && formData.email.includes('@') && formData.phone) && (
          <div className="rb-pricing">
            <div className="pricing-card">
              <div className="pc-head">
                <h3>Basic Plan</h3>
                <div className="price">₹30</div>
              </div>
              <ul className="pc-features">
                <li><CheckCircle size={16} /> Quick professional resume</li>
                <li><CheckCircle size={16} /> AI generates from limited inputs</li>
                <li><CheckCircle size={16} /> PDF, DOCX, Markdown export</li>
                <li><CheckCircle size={16} /> Secure Resume ID recovery</li>
              </ul>
              <button className="btn btn-outline btn-block" onClick={() => handlePayment('Basic')} disabled={loading}>
                {loading ? 'Processing...' : 'Get Basic for ₹30'}
              </button>
            </div>

            <div className="pricing-card popular">
              <div className="popular-badge">Most Popular</div>
              <div className="pc-head">
                <h3>Premium Plan</h3>
                <div className="price">₹50</div>
              </div>
              <ul className="pc-features">
                <li><CheckCircle size={16} /> <b>AI-powered professional resume</b></li>
                <li><CheckCircle size={16} /> AI auto-fills missing info</li>
                <li><CheckCircle size={16} /> <b>Job-Oriented Matcher (Paste JD)</b></li>
                <li><CheckCircle size={16} /> Detailed ATS & Resume Score</li>
                <li><CheckCircle size={16} /> AI Cover Letter & LinkedIn tools</li>
              </ul>
              <button className="btn btn-primary btn-block" onClick={() => handlePayment('Premium')} disabled={loading}>
                {loading ? 'Processing...' : 'Get Premium for ₹50'}
              </button>
            </div>

            <div className="pricing-card premium">
              <div className="pc-head">
                <h3>Lifetime Plan</h3>
                <div className="price">₹99</div>
              </div>
              <ul className="pc-features">
                <li><CheckCircle size={16} /> <b>Unlimited Premium access</b></li>
                <li><CheckCircle size={16} /> Lifetime access to all tools</li>
                <li><CheckCircle size={16} /> Create unlimited resumes</li>
                <li><CheckCircle size={16} /> Future AI feature updates</li>
              </ul>
              <button className="btn btn-primary btn-block" style={{background: 'var(--accent)', color: 'var(--bg)'}} onClick={() => handlePayment('Lifetime')} disabled={loading}>
                {loading ? 'Processing...' : 'Get Lifetime for ₹99'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
