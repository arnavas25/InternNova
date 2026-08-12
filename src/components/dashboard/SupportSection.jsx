import { CircleHelp, UserRound, MessageCircle } from 'lucide-react';

export default function SupportSection({ student }) {
  const waLink = student.mentor_whatsapp ? `https://wa.me/${student.mentor_whatsapp.replace(/\D/g, '')}` : null;

  return (
    <section id="support-section" className="db-card card support-card">
      <div className="card-header"><h3><CircleHelp size={17} color="var(--accent)" /> Mentor Support</h3></div>
      <div className="support-body">
        <div className="mentor-info-card card">
          <div className="mentor-avatar"><UserRound size={26} /></div>
          <div className="mentor-text">
            <span className="text-muted mentor-label">Assigned Mentor</span>
            <h4>{student.mentor_name || 'Unassigned'}</h4>
            {waLink && <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm"><MessageCircle size={14} /> Chat on WhatsApp</a>}
          </div>
        </div>
        <div className="support-faq-box">
          <h4>Need Help?</h4>
          <p className="text-muted">Contact the operations team for batch queries, schedule extensions, or details corrections at:</p>
          <a href="mailto:support@internnova.co.in" className="support-email">support@internnova.co.in</a>
        </div>
      </div>
    </section>
  );
}
