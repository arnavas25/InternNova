import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle } from 'lucide-react';
import './footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        
        {/* Column 1: Brand & Socials */}
        <div className="footer-col footer-brand">
          <div className="footer-logo" style={{ display: 'inline-block', marginBottom: 12 }}>
            <img src="/logo.png" alt="InternNova" height="52" style={{ display: 'block' }} />
          </div>
          <p>India's internship & certification platform. Build real skills, land real jobs.</p>
          
          <div className="footer-socials">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              
              {/* LinkedIn */}
              <a 
                href="https://www.linkedin.com/company/internnovaofficial/" 
                target="_blank" 
                rel="noreferrer" 
                aria-label="LinkedIn"
                style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href="https://www.instagram.com/internnova.co.in/" 
                target="_blank" 
                rel="noreferrer" 
                aria-label="Instagram"
                style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>

              {/* WhatsApp */}
              <a 
                href="https://wa.me/919534196255" 
                target="_blank" 
                rel="noreferrer" 
                aria-label="WhatsApp"
                style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}
              >
                <MessageCircle size={18} />
              </a>

              {/* YouTube */}
              <a 
                href="https://youtube.com/@internnova?si=4sI1pxP2rJ08dpe5" 
                target="_blank" 
                rel="noreferrer" 
                aria-label="YouTube"
                style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </a>

              {/* X */}
              <a 
                href="https://x.com/TheInternNova" 
                target="_blank" 
                rel="noreferrer" 
                aria-label="X (Twitter)"
                style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>

            </div>
          </div>
        </div>

        {/* Column 2: Platform Links */}
        <div className="footer-col">
          <h3>PLATFORM</h3>
          <Link to="/hire-talent">Hire Top Talent</Link>
          <Link to="/verify">Verify Certificate</Link>
          <Link to="/about">About Us</Link>
          <Link to="/courses">Courses</Link>
          <Link to="/faq">FAQ</Link>
        </div>

        {/* Column 3: Legal */}
        <div className="footer-col">
          <h3>Legal</h3>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/refund-policy">Refund Policy</Link>
          <Link to="/cancellation-policy">Cancellation Policy</Link>
        </div>

        {/* Column 4: Contact */}
        <div className="footer-col">
          <h3>Contact</h3>
          <a href="mailto:support@internnova.co.in"><Mail size={14} /> support@internnova.co.in</a>
          <a href="tel:+919534196255"><MessageCircle size={14} /> +91 9534196255</a>
          <div className="msme-badge" style={{ marginTop: '12px' }}>
            MSME Registered<br />
            <span>UDYAM-BR-24-0054689</span>
          </div>
        </div>

      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} InternNova. All rights reserved.</p>
      </div>
    </footer>
  );
}
