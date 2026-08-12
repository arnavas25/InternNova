import './legal.css';

export default function LegalLayout({ title, effectiveDate, children }) {
  return (
    <div className="legal-page">
      <div className="container legal-container">
        <div className="legal-head">
          <span className="eyebrow">Internnova</span>
          <h1>{title}</h1>
          <div className="legal-meta mono">
            <strong>Effective Date:</strong> {effectiveDate}<br />
            <strong>Platform Name:</strong> Internnova
          </div>
        </div>
        <div className="legal-body">{children}</div>
        <div className="legal-foot">© 2026 Internnova. All rights reserved.</div>
      </div>
    </div>
  );
}
