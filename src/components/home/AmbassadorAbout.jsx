import { GraduationCap, BadgeCheck, Users, Award, Gift, Briefcase, Megaphone } from 'lucide-react';
import Reveal from '../Reveal';
import { AMBASSADOR_FORM_URL } from '../../lib/programs';

const AMBASSADOR_BENEFITS = [
  [BadgeCheck, 'Leadership Certificate'], [Users, 'Professional Networking'], [Award, 'Recommendation Letter'],
  [Gift, 'Leadership Development'], [Briefcase, 'Priority Internship Opportunities'], [Megaphone, 'Campus Recognition'],
];

const HIGHLIGHTS = ['Project-Based Learning', 'Mentor Support', 'Verified Certificates', 'Industry-Oriented Curriculum'];

export default function AmbassadorAbout() {
  return (
    <>
      <section className="section" id="ambassador">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Represent Us</span>
            <h2>Campus ambassador program</h2>
            <p>
              Become the face of InternNova at your college, develop leadership skills, expand your
              professional network, and help fellow students discover valuable career opportunities.
            </p>
          </div>
          <Reveal className="ambassador-card card">
            <div className="ambassador-left">
              <div className="seal"><GraduationCap size={24} /></div>
              <h3>Become an InternNova Campus Ambassador</h3>
              <p className="text-muted">
                Join our Campus Ambassador Program and represent InternNova in your college. Gain
                hands-on experience in leadership, communication, community building, and student
                outreach while creating a meaningful impact on your campus.
              </p>
              <a href={AMBASSADOR_FORM_URL} className="btn btn-primary">Apply Now</a>
            </div>
            <div className="ambassador-right">
              {AMBASSADOR_BENEFITS.map(([Icon, label]) => (
                <div className="benefit-chip" key={label}><Icon size={16} /><span>{label}</span></div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" id="about">
        <div className="container">
          <Reveal className="about-card card">
            <div className="founder-photo">
              <img src="/founder.jpg" alt="Avya Nand" />
              <h3>Avya Nand</h3>
              <span className="text-muted">Founder &amp; CEO, InternNova</span>
            </div>
            <div className="founder-info">
              <span className="eyebrow">Our Story</span>
              <h2>About InternNova</h2>
              <p className="text-muted">
                InternNova is a project-based internship platform dedicated to helping students develop
                practical skills, gain industry exposure, and build career-ready portfolios through
                structured learning experiences.
              </p>
              <p className="text-muted">
                Our programs focus on real-world projects, mentor guidance, skill development, and
                verified certifications that help students strengthen their professional profiles and
                prepare for future opportunities.
              </p>
              <p className="text-muted">
                Founded by <strong>Avya Nand</strong>, a Computer Science Engineering student, InternNova
                was created with the vision of bridging the gap between classroom education and
                real-world industry requirements.
              </p>
              <div className="highlight-row">
                {HIGHLIGHTS.map((h) => <span className="badge badge-open" key={h}>{h}</span>)}
              </div>
              <div className="msme-box">
                <h4>MSME Registered Enterprise</h4>
                <p className="mono">Udyam Registration No: UDYAM-BR-24-0054689</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
