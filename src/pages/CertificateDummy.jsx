import React, { useEffect } from 'react';
import { Globe, Mail } from 'lucide-react';
import './certificate.css';

export default function CertificateDummy() {
  
  useEffect(() => {
    // Add print shortcut hint
    document.title = "InternNova Certificate - Sebastian Bennett";
  }, []);

  return (
    <div className="cert-page-wrapper">
      
      {/* Floating print button for demo */}
      <button 
        onClick={() => window.print()}
        style={{
          position: 'fixed', top: 20, right: 20, padding: '12px 24px',
          background: 'var(--accent)', color: 'white', border: 'none',
          borderRadius: 8, cursor: 'pointer', fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 100
        }}
        className="no-print"
      >
        🖨️ Print Certificate (A4)
      </button>

      <div className="certificate-container">
        
        {/* Header */}
        <div className="cert-header">
          <div className="cert-logo">
            <img src="/logo.png" alt="InternNova" />
            <div className="cert-issue-date">Issue Date : 23/07/2026</div>
          </div>
          <div className="cert-number">
            Certificate No.: IN/2026/00X
          </div>
        </div>

        {/* Body */}
        <div className="cert-body">
          <h1 className="cert-title">CERTIFICATE</h1>
          <div className="cert-ribbon">OF INTERNSHIP</div>
          
          <div className="cert-presented">This is proudly presented to :</div>
          <h2 className="cert-name">Sebastian Bennett</h2>
          
          <p className="cert-text">
            This is to certify that <strong>Sebastian Bennett</strong> has successfully completed the 6-Week <strong>Web Development</strong> Internship Program at InternNova from 01 Jul 2026 to 30 Jul 2026. During this period, the intern successfully completed the assigned learning modules, tasks, and projects with dedication and professionalism. We congratulate them on their successful completion and wish them continued success in their future endeavors.
          </p>
        </div>

        {/* Footer Content */}
        <div className="cert-footer-content">
          <div className="cert-signature">
            <div style={{ height: 40, fontFamily: "'Brush Script MT', cursive", fontSize: 28, color: '#000' }}>
              Avya Nand
            </div>
            <div className="cert-signature-line"></div>
            <h4>AVYA NAND</h4>
            <p>Founder & CEO</p>
          </div>
          
          <div className="cert-seal">
            <div className="cert-seal-inner">
              <img src="/logo.png" alt="InternNova icon" style={{ height: 24 }} />
              <div className="cert-seal-text">InternNova</div>
              <div className="cert-seal-text" style={{ fontSize: 6, marginTop: 4 }}>Verified & Authorized</div>
            </div>
          </div>

          <div className="cert-right-logos">
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/42/MSME_Logo.png" alt="MSME" className="cert-msme" />
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://internnova.co.in/verify/IN/2026/00X" alt="QR Code" className="cert-qr" />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="cert-bottom-bar">
          <span><Globe size={14} /> www.internnova.co.in</span>
          <span className="sep">|</span>
          <span><Mail size={14} /> info@internnova.co.in</span>
          <span className="sep">|</span>
          <span><Linkedin size={14} /> linkedin.com/company/internnovaofficial</span>
        </div>

      </div>
    </div>
  );
}
