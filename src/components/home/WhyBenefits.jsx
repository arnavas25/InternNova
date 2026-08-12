import { Building2, Wallet, GraduationCap, UserCog, ShieldCheck, Rocket, Laptop, Award,
  FileSignature, BadgeCheck, Code, TrendingUp, FileText, Briefcase, Users } from 'lucide-react';
import Reveal from '../Reveal';

const WHY = [
  [Building2, 'MSME Registered'], [Wallet, 'Affordable Fees'], [GraduationCap, 'Industry-Oriented Curriculum'],
  [UserCog, 'Mentor Support'], [ShieldCheck, 'Certificate Verification Portal'], [Rocket, 'Career-Focused Learning'],
  [Laptop, 'Fully Online Internship'], [Award, 'Trusted Certification'],
];

const BENEFITS = [
  [FileSignature, 'Offer Letter'], [BadgeCheck, 'Internship Certificate'], [Code, 'Real Projects'],
  [TrendingUp, 'Skill Development'], [FileText, 'Resume Building'], [Briefcase, 'Industry Exposure'],
  [Award, 'Performance Recognition'], [Users, 'Networking Opportunities'],
];

function Grid({ eyebrow, title, items, id }) {
  return (
    <section className="section" id={id}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <div className="feature-grid">
          {items.map(([Icon, label], i) => (
            <Reveal className="feature-card card" delay={(i % 4) * 50} key={label}>
              <Icon size={22} /><h3>{label}</h3>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function WhyBenefits() {
  return (
    <>
      <Grid eyebrow="The Case For Us" title="Why choose InternNova" items={WHY} id="why-us" />
      <Grid eyebrow="What You Walk Away With" title="Internship benefits" items={BENEFITS} />
    </>
  );
}
