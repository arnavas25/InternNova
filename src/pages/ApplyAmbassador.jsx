import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ApplyAmbassador() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ paddingTop: '80px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="container" style={{ textAlign: 'center', padding: '40px 20px 20px' }}>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--text-h)', marginBottom: '10px' }}>Campus Ambassador Application</h1>
          <p style={{ color: 'var(--text-muted)' }}>Join our ambassador program and become a leader on your campus.</p>
        </div>
        <div style={{ flex: 1, width: '100%', maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
          <iframe 
            src="https://docs.google.com/forms/d/e/1FAIpQLSf68w14sshJImp2dG8nIiETa-EYcDzkz-ejKQEBQFUbjajYPw/viewform?embedded=true" 
            width="100%" 
            height="1800" 
            frameBorder="0" 
            marginHeight="0" 
            marginWidth="0"
            style={{ border: 'none', background: 'transparent' }}
          >
            Loading…
          </iframe>
        </div>
      </div>
      <Footer />
    </div>
  );
}
