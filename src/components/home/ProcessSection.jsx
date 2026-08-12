import { FileSignature, Search, FileText, LaptopMinimalCheck, GitBranch, TrendingUp, Award } from 'lucide-react';
import Reveal from '../Reveal';

const STEPS = [
  [FileSignature, 'Apply', 'Submit your internship application through our online form.'],
  [Search, 'Application Review', 'Our team reviews your application, eligibility, and selected internship domain.'],
  [FileText, 'Offer Letter', 'Selected candidates receive an internship offer letter via email.'],
  [LaptopMinimalCheck, 'Training & Learning', 'Attend guided learning sessions, complete weekly assignments, and receive mentor support.'],
  [GitBranch, 'Project Work', 'Build portfolio-worthy projects using industry-relevant technologies and tools.'],
  [TrendingUp, 'Evaluation', 'Assignments, project work, and overall performance will be evaluated before certification.'],
  [Award, 'Certificate', 'Receive a verified internship completion certificate.'],
];

export default function ProcessSection() {
  return (
    <section className="section" id="process">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">The Record, Step By Step</span>
          <h2>Internship process</h2>
          <p>Your journey with InternNova, entry by entry.</p>
        </div>
        <div className="process-list">
          {STEPS.map(([Icon, title, body], i) => (
            <Reveal className="process-row" delay={i * 40} key={title}>
              <span className="mono process-num">{String(i + 1).padStart(2, '0')}</span>
              <Icon size={20} className="process-icon" />
              <div>
                <h3>{title}</h3>
                <p className="text-muted">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
