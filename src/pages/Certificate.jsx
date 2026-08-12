import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './certificate.css';
import { Loader2, Download } from 'lucide-react';

export default function Certificate() {
  const params = useParams();
  const id = params['*']; // The cert_id from the URL (e.g. IN/26/WD0001)
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCertificate() {
      try {
        // Find certificate by cert_id (we encode/decode if there are slashes, but react-router might pass the whole thing)
        // Usually, URLs will look like /certificate/IN26WD0001 or IN-26-WD0001 to avoid slash issues in routing.
        // Let's assume the ID passed in URL is without slashes, or URL encoded.
        const { data, error } = await supabase
          .from('certificates')
          .select('*')
          .eq('cert_id', id)
          .single();

        if (error || !data) {
          setError("Certificate not found or invalid ID.");
        } else {
          setCertData(data);
        }
      } catch (err) {
        setError("Error loading certificate.");
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      loadCertificate();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#e0e4ec]">
        <Loader2 className="animate-spin text-[#281259]" size={48} />
      </div>
    );
  }

  if (error || !certData) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#e0e4ec]">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Invalid Certificate</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://internnova.co.in/verify`;

  return (
    <div className="certificate-page">
      <div className="no-print" style={{ position: 'absolute', top: 20, right: 30, zIndex: 10 }}>
        <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 6, fontWeight: 600 }}>
          <Download size={16} /> Download PDF
        </button>
      </div>
      <div className="certificate-scale-wrapper">
        <div className="certificate-container">
        <div className="cert-header">
          <div className="cert-logo">
            <img src="/internnova-logo.png" alt="InternNova Logo" />
            <div className="cert-issue-date">Issue Date : {certData.issue_date}</div>
          </div>
          <div className="cert-number">Certificate No.: {certData.cert_id}</div>
        </div>
        <div className="cert-body">
          <h1 className="cert-title">CERTIFICATE</h1>
          <div className="cert-ribbon">OF INTERNSHIP</div>
          <div className="cert-presented">This is proudly presented to :</div>
          <h2 className="cert-name">{certData.name}</h2>
          <p className="cert-text">
            This is to certify that <strong>{certData.name}</strong> has successfully completed the 6-Week <strong>{certData.domain}</strong> Internship Program at InternNova from {certData.start_date} to {certData.end_date}. During this period, the intern successfully completed the assigned learning modules, tasks, and projects with dedication and professionalism. We congratulate them on their successful completion and wish them continued success in their future endeavors.
          </p>
        </div>
        <div className="cert-footer-content">
          <div className="cert-signature">
            <img src="/signature3.png" alt="Avya Nand Signature" style={{ height: '60px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
            <div className="cert-signature-line"></div>
            <h4>AVYA NAND</h4>
            <p>Founder & CEO</p>
          </div>
          <div className="cert-seal">
             <img src="/seal-logo.jpg" alt="InternNova Seal" style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <div className="cert-right-logos">
            <img src="/msme-logo.png" alt="MSME" className="cert-msme" />
            <img src={qrCodeUrl} alt="QR" className="cert-qr" />
          </div>
        </div>
        <div className="cert-bottom-bar">
          <span>www.internnova.co.in</span> | <span>info@internnova.co.in</span> | <span>linkedin.com/company/internnovaofficial</span>
        </div>
      </div>
    </div>
  </div>
  );
}
