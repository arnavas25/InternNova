import React, { useState } from 'react';
import { ShieldCheck, Search, Loader2, AlertCircle, CheckCircle2, FileText, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Helper function to format date strings
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; 
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const Verify = () => {
  const [docType, setDocType] = useState('offer'); // 'offer' ya 'certificate'
  const [searchId, setSearchId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuP-tgrb_Q_ahl3j_78RB4YiwVgyz-DLTGAaf6eISm-3Pxq7O9XOkWGxRdHm98hjJk/exec";

  // Tab change handler
  const handleTabChange = (type) => {
    setDocType(type);
    setError('');
    setResult(null);
    setSearchId('');
    setEmail('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const queryId = searchId.trim();
    const queryEmail = email.trim().toLowerCase();

    if (!queryId) return;
    if (docType === 'offer' && !queryEmail) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      if (docType === 'certificate') {
        let query = supabase
          .from('certificates')
          .select('*')
          .eq('cert_id', queryId)
          .maybeSingle();

        const { data: certData } = await query;

        if (certData) {
          setResult({
            status: 'success',
            type: 'Internship Certificate',
            data: {
              certId: certData.cert_id,
              name: certData.name,
              email: certData.email,
              domain: certData.domain,
              startDate: certData.start_date,
              endDate: certData.end_date,
              issueDate: certData.issue_date
            }
          });
          setLoading(false);
          return;
        } else {
          const url = `${SCRIPT_URL}?id=${encodeURIComponent(queryId)}&type=certificate`;
          const response = await fetch(url, { method: 'GET', redirect: 'follow' });
          const data = await response.json();

          if (data.status === 'success') {
            setResult(data);
          } else {
            setError(data.message || `No certificate record found for Certificate ID: ${queryId}`);
          }
        }
      } else {
        const url = `${SCRIPT_URL}?id=${encodeURIComponent(queryId)}&email=${encodeURIComponent(queryEmail)}&type=offer`;
        
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const data = await response.json();

        if (data.status === 'success') {
          setResult(data);
        } else {
          const { data: certData } = await supabase
            .from('certificates')
            .select('*')
            .eq('cert_id', queryId)
            .eq('email', queryEmail)
            .maybeSingle();

          if (certData) {
            setResult({
              status: 'success',
              type: 'Offer Letter',
              data: {
                documentId: certData.cert_id,
                name: certData.name,
                email: certData.email,
                domain: certData.domain,
                issueDate: certData.issue_date
              }
            });
          } else {
            setError(data.message || `No record found matching this ID and Email combination.`);
          }
        }
      }
    } catch (err) {
      console.error("Verification Error:", err);
      setError('Unable to verify at the moment. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const isOfferLetter = docType === 'offer' || result?.type?.toUpperCase().includes('OFFER');

  return (
    <section className="section" id="verify" style={{ paddingTop: '110px', paddingBottom: '60px', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '620px', margin: '0 auto' }}>
        
        {/* Verification Container Card */}
        <div className="card" style={{
          borderRadius: '20px',
          padding: '36px 28px',
          boxShadow: 'var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.08))',
          position: 'relative'
        }}>

          {/* Header Icon & Section Head */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: 'var(--primary, #2563eb)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '1px solid rgba(37, 99, 235, 0.2)'
            }}>
              <ShieldCheck size={32} />
            </div>

            <span className="eyebrow" style={{ display: 'inline-block', marginBottom: '6px' }}>VERIFY CREDENTIALS</span>
            <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main, currentColor)', margin: 0 }}>
              Official Verification Portal
            </h2>
            <p className="text-muted" style={{ fontSize: '14px', marginTop: '6px', lineHeight: '1.5' }}>
              Verify authentic offer letters and internship certificates issued by InternNova.
            </p>
          </div>

          {/* Tabs Navigation */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-subtle, rgba(255,255,255,0.05))',
            padding: '5px',
            borderRadius: '12px',
            marginBottom: '24px',
            gap: '6px',
            border: '1px solid var(--border-color, rgba(255,255,255,0.1))'
          }}>
            <button
              type="button"
              onClick={() => handleTabChange('offer')}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: '9px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                backgroundColor: docType === 'offer' ? 'var(--bg-card, #ffffff)' : 'transparent',
                color: docType === 'offer' ? 'var(--text-main, #111827)' : 'var(--text-muted, #6b7280)',
                boxShadow: docType === 'offer' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <FileText size={17} />
              Offer Letter
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('certificate')}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: '9px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                backgroundColor: docType === 'certificate' ? 'var(--bg-card, #ffffff)' : 'transparent',
                color: docType === 'certificate' ? 'var(--text-main, #111827)' : 'var(--text-muted, #6b7280)',
                boxShadow: docType === 'certificate' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Award size={17} />
              Certificate
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #374151)', marginBottom: '6px' }}>
                {docType === 'offer' ? 'Offer Letter ID' : 'Certificate ID'}
              </label>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder={docType === 'offer' ? "e.g. INOL/26/WD001" : "e.g. CERT-998234"}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, #d1d5db)',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'var(--bg-input, rgba(255,255,255,0.03))',
                  color: 'var(--text-main, inherit)',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                required
              />
            </div>

            {docType === 'offer' && (
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #374151)', marginBottom: '6px' }}>
                  Registered Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #d1d5db)',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'var(--bg-input, rgba(255,255,255,0.03))',
                    color: 'var(--text-main, inherit)',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
                marginTop: '6px'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Verifying Record...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Verify {docType === 'offer' ? 'Offer Letter' : 'Certificate'}</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              textAlign: 'left'
            }}>
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
              <div style={{ fontSize: '14px' }}>
                <strong style={{ display: 'block', color: '#ef4444' }}>Verification Failed</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#f87171' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div style={{
              marginTop: '24px',
              padding: '24px',
              backgroundColor: 'var(--bg-subtle, rgba(255,255,255,0.03))',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              borderRadius: '14px',
              textAlign: 'left'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                paddingBottom: '14px',
                marginBottom: '18px'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted, #64748b)' }}>
                  {result.type} DETAILS
                </span>
                <span style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  <CheckCircle2 size={15} /> Verified Authentic
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
                {isOfferLetter ? (
                  <>
                    <div><span style={{ color: 'var(--text-muted, #64748b)', fontSize: '12px', display: 'block' }}>Document ID</span> <strong style={{ color: 'var(--text-main, inherit)' }}>{result.data.documentId || result.data.certId || searchId}</strong></div>
                    <div><span style={{ color: 'var(--text-muted, #64748b)', fontSize: '12px', display: 'block' }}>Student Name</span> <strong style={{ color: 'var(--text-main, inherit)' }}>{result.data.name}</strong></div>
                    <div><span style={{ color: 'var(--text-muted, #64748b)', fontSize: '12px', display: 'block' }}>Email</span> <strong style={{ color: 'var(--text-main, inherit)' }}>{result.data.email}</strong></div>
                    <div><span style={{ color: 'var(--text-muted, #64748b)', fontSize: '12px', display: 'block' }}>Domain</span> <strong style={{ color: 'var(--primary, #2563eb)' }}>{result.data.domain}</strong></div>
                    {result.data.issueDate && <div><span style={{ color: 'var(--text-muted, #64748b)', fontSize: '12px', display: 'block' }}>Issue Date</span> <strong style={{ color: 'var(--text-main, inherit)' }}>{formatDate(result.data.issueDate)}</strong></div>}
                  </>
                ) : (
                  <>
                    <div><span style={{ color: 'var(--text-muted, #64748b)', fontSize: '12px', display: 'block' }}>Certificate ID</span> <strong style={{ color: 'var(--text-main, inherit)' }}>{result.data.certId || result.data.studentId || searchId}</strong></div>
                    <div><span style={{ color: 'var(--text-muted, #64748b)', fontSize: '12px', display: 'block' }}>Student Name</span> <strong style={{ color: 'var(--text-main, inherit)' }}>{result.data.name}</strong></div>
                    {result.data.email && <div><span style={{ color: 'var(--text-muted, #64748b)', fontSize: '12px', display: 'block' }}>Email</span> <strong style={{ color: 'var(--text-main, inherit)' }}>{result.data.email}</strong></div>}
                    <div><span style={{ color: 'var(--text-muted, #64748b)', fontSize: '12px', display: 'block' }}>Domain</span> <strong style={{ color: 'var(--primary, #2563eb)' }}>{result.data.domain}</strong></div>
                    {result.data.startDate && (
                      <div>
                        <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '12px', display: 'block' }}>Duration</span>
                        <strong style={{ color: 'var(--text-main, inherit)' }}>
                          {formatDate(result.data.startDate)} — {formatDate(result.data.endDate)}
                        </strong>
                      </div>
                    )}
                    {result.data.issueDate && <div><span style={{ color: 'var(--text-muted, #64748b)', fontSize: '12px', display: 'block' }}>Issue Date</span> <strong style={{ color: 'var(--text-main, inherit)' }}>{formatDate(result.data.issueDate)}</strong></div>}
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default Verify;
