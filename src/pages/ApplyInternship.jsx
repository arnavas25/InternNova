import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ApplyInternship() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const FREE_LINK = "https://docs.google.com/forms/d/e/1FAIpQLSd-Bt_lamBujtJ703OGqdhvjmSmJkLLfADzf9YASvs6NZm0ww/viewform";

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Header />
      <div style={{ paddingTop: '100px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <div className="container" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <h1 style={{ fontSize: '3rem', color: 'var(--text)', marginBottom: '16px', fontWeight: 700 }}>Choose Your Internship Plan</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            Kickstart your career with our industry-recognized internship programs. Choose the plan that best fits your goals.
          </p>
        </div>

        <div className="container" style={{ padding: '20px 20px 80px', display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
          
          {/* Premium Plan */}
          <div className="pricing-card premium" style={{
            background: 'linear-gradient(145deg, #1A2235 0%, #111827 100%)',
            border: '2px solid var(--accent)',
            borderRadius: '16px',
            padding: '40px',
            width: '100%',
            maxWidth: '450px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(206, 156, 76, 0.15)',
            transform: 'scale(1.05)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--accent)',
              color: '#000',
              padding: '6px 16px',
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Star size={14} fill="#000" /> RECOMMENDED
            </div>

            <h2 style={{ fontSize: '1.8rem', color: '#FFF', marginBottom: '10px' }}>Premium Track</h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent)' }}>₹499</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>/ one-time fee</span>
            </div>
            
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '30px', lineHeight: 1.6 }}>
              Comprehensive support, career guidance, and personalized mentorship to land your dream job.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', flex: 1 }}>
              {[
                'Everything included in the Basic Track',
                'Dedicated Mentor Support',
                'Resume & ATS Optimization',
                'LinkedIn Profile Review',
                'Priority Doubt Support & Evaluation',
                'Career Guidance & Interview Prep',
                'Premium Learning Resources',
                'Flexible Internship Duration',
                'Physical Certificate (Home Delivery - India Only)'
              ].map((feature, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', color: '#FFF' }}>
                  <Check size={20} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => navigate('/apply-premium')}
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                padding: '16px', 
                textAlign: 'center',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Apply for Premium <ArrowRight size={18} />
            </button>
          </div>

          {/* Free Plan */}
          <div className="pricing-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '40px',
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text)', marginBottom: '10px' }}>Basic Track</h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text)' }}>₹0</span>
              <span style={{ color: 'var(--text-muted)' }}>/ internship</span>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px', lineHeight: 1.6 }}>
              Perfect for self-driven learners who want to build projects and gain experience independently.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', flex: 1 }}>
              {[
                'Self-paced learning',
                'Learning Resources',
                'Tasks & Assignments',
                'Digital Certificate',
                'Community Support'
              ].map((feature, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', color: 'var(--text)' }}>
                  <Check size={20} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <a 
              href={FREE_LINK} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn" 
              style={{ 
                width: '100%', 
                padding: '16px', 
                textAlign: 'center', 
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                background: 'transparent',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '1.1rem'
              }}
            >
              Apply for Free
            </a>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
