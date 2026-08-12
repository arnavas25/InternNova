import { useState } from 'react';
import { BookOpenText, FileVideo, FileText as FileIcon, ExternalLink, FileSignature, Award, Lock, Download } from 'lucide-react';
import CertificateModal from './CertificateModal';

export function ResourcesSection({ resources }) {
  return (
    <section id="resources-section" className="db-card card resources-card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
          <BookOpenText size={18} color="var(--accent)" /> Recommended Resources
        </h3>
        <span className="badge badge-open" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>Domain Specific</span>
      </div>
      <div className="resource-list-grid">
        {resources.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>No learning resources available for your track yet.</p>
        ) : resources.map((res) => {
          const Icon = res.type === 'video' ? FileVideo : FileIcon;
          return (
            <div className="resource-list-item card" key={res.id || res.title}>
              <div className="resource-list-title">
                <h4 style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.92rem', fontWeight: 600 }}>
                  <Icon size={16} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                  {res.title}
                </h4>
                <span className="badge badge-neutral" style={{ marginTop: 8, display: 'inline-block', fontSize: '0.62rem', padding: '2px 6px', textTransform: 'uppercase' }}>
                  {res.type}
                </span>
              </div>
              <div className="resource-list-meta" style={{ marginTop: 12 }}>
                <a href={res.url} target="_blank" rel="noreferrer" className="btn btn-outline btn-block btn-sm" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.78rem' }}>
                  Access Resource <ExternalLink size={12} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function DocumentsSection({ student, certificateOrder }) {
  const [modalOpen, setModalOpen] = useState(false);
  const hasOffer = !!student.offer_letter_link;
  const isComplete = student.status === 'Completed' && student.certificate_link;

  return (
    <section id="documents-section" className="db-card card documents-card">
      <div className="card-header" style={{ marginBottom: 20 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
          <FileIcon size={18} color="var(--accent)" /> Official Documents
        </h3>
      </div>
      <div className="documents-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        {/* Offer Letter Card */}
        <div className="document-card card" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div className="doc-icon" style={{ color: 'var(--accent)', background: 'var(--accent-tint)', width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSignature size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Offer Letter</h4>
          <p className="text-muted" style={{ fontSize: '0.8rem', minHeight: 36 }}>Your official internship offer and training outline letter.</p>
          {hasOffer ? (
            <a href={student.offer_letter_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-block btn-sm" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Download size={13} /> Download
            </a>
          ) : (
            <button className="btn btn-outline btn-block btn-sm" disabled style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Lock size={13} /> Locked / Processing
            </button>
          )}
        </div>

        {/* Certificate Card */}
        <div className={`document-card card ${!isComplete ? 'is-locked' : ''}`} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', opacity: isComplete ? 1 : 0.7 }}>
          <div className="doc-icon" style={{ color: isComplete ? 'var(--ok-500)' : 'var(--text-faint)', background: isComplete ? 'var(--ok-tint)' : 'rgba(255,255,255,0.03)', width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Internship Certificate</h4>
          <p className="text-muted" style={{ fontSize: '0.8rem', minHeight: 36 }}>
            {isComplete ? 'Your official completion certificate is ready!' : 'Locked. Complete all assignments to unlock.'}
          </p>
          {isComplete ? (
            <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-block btn-sm" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Download size={13} /> Download Certificate
            </button>
          ) : (
            <button className="btn btn-outline btn-block btn-sm" disabled style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Lock size={13} /> Locked
            </button>
          )}
        </div>
      </div>
      {isComplete && (
        <CertificateModal open={modalOpen} onClose={() => setModalOpen(false)} student={student} existingOrder={certificateOrder} />
      )}
    </section>
  );
}
