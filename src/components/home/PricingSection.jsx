import { useState } from 'react';
import { Check, User, Mail, Phone, GraduationCap, BookOpen, Clock, Building, School, Sparkles, CheckCircle2, XCircle, Printer } from 'lucide-react';
import Reveal from '../Reveal';
import Modal from '../Modal';
import useExternalScript from '../../lib/useExternalScript';
import emailjs from '@emailjs/browser';
import { getConfig } from '../../lib/supabase';
import { COURSES } from '../../lib/programs';

const COURSE_FEATURES = [
  'Verified Industry Certificate',
  '90-Day Guided Learning Track',
  '1:1 Personal Mentor Sessions',
  'Resume & LinkedIn Portfolio Review',
  'ATS-Compliant Profile Setup',
  'Line-by-Line Project Code Review',
  'Career Interview Prep Kit (PDF)',
  'Direct Mentor Support on WhatsApp'
];

export default function PricingSection() {
  const razorpayReady = useExternalScript('https://checkout.razorpay.com/v1/checkout.js');
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    branch: '',
    year: '3rd Year'
  });
  const [receiptData, setReceiptData] = useState(null);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const sendEmailConfirmation = (name, email, domain, paymentId) => {
    const { emailjsServiceId, emailjsTemplateId, emailjsPublicKey } = getConfig();
    if (!emailjsServiceId || emailjsServiceId === 'YOUR_EMAILJS_SERVICE_ID') return;
    emailjs.init({ publicKey: emailjsPublicKey });
    emailjs.send(emailjsServiceId, emailjsTemplateId, {
      student_name: name, student_email: email, domain, payment_id: paymentId,
    }).catch((err) => console.error('EmailJS failed to deliver', err));
  };

  const handlePaymentResponse = async (response) => {
    const { name, email, phone, college, branch, year } = form;
    const domain = selectedCourse.title;
    try {
      const res = await fetch('/api/course-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          name,
          email,
          phone,
          domain,
          college,
          branch,
          year
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setShowFailure(true);
        return;
      }
      sendEmailConfirmation(name, email, domain, response.razorpay_payment_id);
      
      setReceiptData({
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
        date: new Date().toLocaleString('en-IN', { hour12: true }),
        name,
        email,
        phone,
        college,
        branch,
        year,
        course: domain,
        amount: '₹1499'
      });
      
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setShowFailure(true);
    }
  };

  const submitEnrollment = async (e) => {
    e.preventDefault();
    const rawPhone = form.phone.replace(/[\s\-+]/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(rawPhone)) {
      alert('Please enter a valid 10-digit Indian WhatsApp number.');
      return;
    }
    if (!razorpayReady || typeof window.Razorpay === 'undefined') {
      alert('Payment SDK is still loading. Please try again in a moment.');
      return;
    }

    setCreatingOrder(true);
    try {
      const orderRes = await fetch('/api/course-payment', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) { alert(orderData.error || 'Could not start payment. Please try again.'); return; }

      setEnrollOpen(false);

      const options = {
        key: orderData.keyId,
        order_id: orderData.orderId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'InternNova',
        description: `${selectedCourse.title} Paid Course Enrollment`,
        image: '/logo.png',
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#B8863A' },
        handler: handlePaymentResponse,
        modal: { ondismiss: () => console.log('Checkout dismissed by student.') },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => setShowFailure(true));
      rzp.open();
    } catch (err) {
      console.error('Could not start payment', err);
      alert('Could not start payment. Please try again.');
    } finally {
      setCreatingOrder(false);
    }
  };

  const openEnrollModal = (course) => {
    setSelectedCourse(course);
    setEnrollOpen(true);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-print-area').innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // reload to restore react state bindings
  };

  return (
    <section className="section" id="courses" style={{ paddingTop: 0 }}>
      <div className="container">

        <div className="program-grid" style={{ marginTop: 40 }}>
          {COURSES.map((course, i) => (
            <Reveal className="program-card card" delay={(i % 4) * 60} key={course.id}>
              <span className="mono program-code">COURSE—{course.code}</span>
              <h3>{course.title}</h3>
              <p style={{ minHeight: 48, fontSize: '0.86rem', color: 'var(--text-muted)' }}>{course.overview}</p>
              
              <div style={{ margin: '18px 0', borderBottom: '1px dashed var(--border)' }} />
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-faint)', fontSize: '0.9rem' }}>₹2999</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent)' }}>₹1499</span>
                <span className="badge badge-open" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>50% OFF</span>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {COURSE_FEATURES.slice(0, 4).map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={13} color="var(--accent)" /> {f}
                  </li>
                ))}
              </ul>

              <button className="btn btn-primary btn-block btn-sm" onClick={() => openEnrollModal(course)}>
                <Sparkles size={13} /> Enroll Now
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Enrollment Modal Form */}
      <Modal open={enrollOpen} onClose={() => setEnrollOpen(false)}>
        {selectedCourse && (
          <>
            <div className="modal-hero">
              <span className="program-code" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)' }}>
                ENROLLING IN: {selectedCourse.title.toUpperCase()}
              </span>
              <h2 style={{ marginTop: 4 }}>Course Admission</h2>
              <p className="text-muted">Enter your details to initiate payment of ₹1499 via Razorpay securely.</p>
            </div>
            <form className="modal-body" onSubmit={submitEnrollment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label><User size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> Full Name</label>
                <input required placeholder="Jane Doe" value={form.name} onChange={update('name')} />
              </div>
              <div className="field">
                <label><Mail size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> Email Address</label>
                <input required type="email" placeholder="student@email.com" value={form.email} onChange={update('email')} />
              </div>
              <div className="field">
                <label><Phone size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> WhatsApp Contact Number</label>
                <input required type="tel" placeholder="e.g. 9876543210" value={form.phone} onChange={update('phone')} />
              </div>
              <div className="field">
                <label><School size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> Current College / Institution</label>
                <input required placeholder="e.g. Delhi Technological University" value={form.college} onChange={update('college')} />
              </div>
              <div className="field">
                <label><Building size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> Branch / Major of Study</label>
                <input required placeholder="e.g. Computer Science Engineering" value={form.branch} onChange={update('branch')} />
              </div>
              <div className="field">
                <label><Clock size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> Current Year of Study</label>
                <select value={form.year} onChange={update('year')}>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate / Post-Graduate">Graduate / Post-Graduate</option>
                </select>
              </div>
              
              <button type="submit" className="btn btn-primary btn-block" disabled={creatingOrder} style={{ marginTop: 10 }}>
                {creatingOrder ? 'Setting up Razorpay...' : 'Proceed to Payment (₹1499)'}
              </button>
            </form>
          </>
        )}
      </Modal>

      {/* Success Confirmation Page & Payment Receipt Modal */}
      <Modal open={showSuccess} onClose={() => setShowSuccess(false)} wide={true}>
        {receiptData && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <CheckCircle2 size={44} color="var(--ok-500)" style={{ margin: '0 auto 10px' }} />
              <h2 style={{ color: 'var(--ok-500)', fontSize: '1.4rem' }}>Enrollment Confirmed!</h2>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Your payment was verified. An official confirmation email has been dispatched to <strong>{receiptData.email}</strong>.
              </p>
            </div>

            {/* Receipt Print Container */}
            <div id="receipt-print-area" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text)' }}>
              {/* Receipt Header styling */}
              <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: 16, marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--accent)', fontFamily: 'var(--font-display)', margin: '0 0 4px' }}>INTERNNOVA RECEIPT</h3>
                <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>OFFICIAL PAYMENT SLIP</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ color: 'var(--text-faint)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: 2 }}>Receipt No. (Payment ID)</div>
                  <strong style={{ color: 'var(--accent)' }}>{receiptData.paymentId}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-faint)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: 2 }}>Payment Date</div>
                  <strong>{receiptData.date}</strong>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
                <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--accent)', marginBottom: 8 }}>Student Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><strong>Name:</strong> {receiptData.name}</div>
                  <div><strong>Email:</strong> {receiptData.email}</div>
                  <div><strong>WhatsApp:</strong> {receiptData.phone}</div>
                  <div><strong>College:</strong> {receiptData.college}</div>
                  <div><strong>Branch:</strong> {receiptData.branch}</div>
                  <div><strong>Academic Year:</strong> {receiptData.year}</div>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
                <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--accent)', marginBottom: 8 }}>Itemized Details</h4>
                <div style={{ display: 'flex', justifySpace: 'between', justifyContent: 'space-between' }}>
                  <span>{receiptData.course} Certification Course (90-Day Track)</span>
                  <strong>{receiptData.amount}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifySpace: 'between', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <strong style={{ textTransform: 'uppercase', color: 'var(--accent)' }}>Total Paid</strong>
                <strong style={{ color: 'var(--ok-500)' }}>{receiptData.amount} (SUCCESS)</strong>
              </div>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.68rem', color: 'var(--text-faint)', borderTop: '1px dashed var(--border)', paddingTop: 12 }}>
                This is a computer-generated invoice document issued by InternNova Platform.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={handlePrint}>
                <Printer size={14} /> Print Receipt
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowSuccess(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Failure Modal */}
      <Modal open={showFailure} onClose={() => setShowFailure(false)}>
        <div style={{ textAlign: 'center' }}>
          <XCircle size={44} color="var(--err-500)" style={{ margin: '0 auto 10px' }} />
          <h2 style={{ color: 'var(--err-500)', fontSize: '1.3rem' }}>Transaction Failed</h2>
          <p className="text-muted" style={{ margin: '14px 0 24px', fontSize: '0.85rem' }}>
            We encountered a problem authenticating or processing your payment. Your bank account will be automatically refunded if debited.
          </p>
          <button className="btn btn-primary btn-block btn-sm" onClick={() => { setShowFailure(false); setEnrollOpen(true); }}>
            Retry Enrollment
          </button>
        </div>
      </Modal>
    </section>
  );
}
