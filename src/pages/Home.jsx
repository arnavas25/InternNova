import { useState, useEffect } from 'react';
import { 
  Code2, PieChart, ShieldCheck, Brain, Terminal, Coffee, Layers, Zap, 
  Briefcase, Award, CheckCircle, MessageCircle, FileCheck, ChevronDown 
} from 'lucide-react';
import Reveal from '../components/Reveal';
import ProgramModal from '../components/ProgramModal';
import Testimonials from '../components/Testimonials';
import Newsletter from '../components/Newsletter';
import Universities from '../components/Universities'; // 🎓 Universities Component
import { PROGRAMS } from '../lib/programs';
import './home.css';

const ICONS = {
  'web-dev': Code2, 
  data: PieChart, 
  cyber: ShieldCheck, 
  ai: Brain,
  python: Terminal, 
  java: Coffee,
};

export default function Home() {
  const [activeProgram, setActiveProgram] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  // ☀️ Dynamic Greeting Logic
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good Morning ☀️');
    else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon 🌤️');
    else if (hour >= 17 && hour < 22) setGreeting('Good Evening 🌙');
    else setGreeting('Working Late Night? 🦉');
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Is the internship offer letter & certificate verified?",
      a: "Yes, 100%! Every offer letter and certificate comes with a unique QR code and Verification ID that can be authenticated on our portal anytime."
    },
    {
      q: "What is the duration and daily time commitment?",
      a: "All programs are 6 weeks long. You need to commit around 1-2 hours daily or flexible hours according to your college schedule."
    },
    {
      q: "Are these internships beginner-friendly?",
      a: "Absolutely. We start from foundational concepts before assigning real-world projects, with structured task roadmaps for every week."
    },
    {
      q: "How will I receive task updates and support?",
      a: "Once enrolled, you get access to the Student Dashboard and support community for continuous guidance."
    }
  ];

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="hero" id="home">
        <div className="blob-wrap">
          <div className="blob"></div>
        </div>

        {/* Dynamic Greeting Badge */}
        {greeting && (
          <Reveal delay={50}>
            <div className="hero-greeting-wrapper">
              <div className="hero-greeting-badge">
                <span>{greeting}</span>
                <span className="greeting-divider">•</span>
                <span>Welcome to InternNova</span>
              </div>
            </div>
          </Reveal>
        )}

        <Reveal className="hero-brand" delay={100}>
          INTERN NOVA
        </Reveal>
        
        <Reveal className="hero-tagline" delay={300}>
          Build real skills. Land real jobs.
        </Reveal>

        <Reveal className="hero-cta" delay={500}>
          <a href="#programs" className="btn btn-primary">Apply Now</a>
          <a href="#process" className="btn btn-outline">How it works</a>
        </Reveal>
      </section>

      {/* ---------------- MARQUEE ---------------- */}
      <div className="marquee-bar">
        <div className="marquee-track">
          <span className="marquee-text">
            Campus Ambassador applications now open &nbsp;·&nbsp; Limited seats for upcoming cohort &nbsp;·&nbsp;
            Offer letter included &nbsp;·&nbsp; Verified certificate &nbsp;·&nbsp; Real projects &nbsp;·&nbsp; Mentorship &nbsp;·&nbsp;
          </span>
          <span className="marquee-text" aria-hidden="true">
            Campus Ambassador applications now open &nbsp;·&nbsp; Limited seats for upcoming cohort &nbsp;·&nbsp;
            Offer letter included &nbsp;·&nbsp; Verified certificate &nbsp;·&nbsp; Real projects &nbsp;·&nbsp; Mentorship &nbsp;·&nbsp;
          </span>
        </div>
      </div>

      {/* ---------------- STATS (1000+) ---------------- */}
      <section className="stats-section">
        <div className="container stats-grid">
          {[
            ['1000+', 'Students Trained'],
            ['6', 'Industry Domains'],
            ['6', 'Weeks Duration'],
            ['100%', 'Verified Certificates'],
          ].map(([n, l], i) => (
            <Reveal className="stat-card" delay={i * 100} key={l}>
              <div className="stat-number">{n}</div>
              <div className="stat-label">{l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- PROGRAMS ---------------- */}
      <section className="section" id="programs" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">The Ledger</span>
            <h2>Internship Domains</h2>
            <p>Select a domain to view the detailed program overview. Our programs are designed to take you from fundamentals to real-world applications.</p>
          </div>
          <div className="programs-grid">
            {PROGRAMS.map((p, i) => {
              const Icon = ICONS[p.id] || Code2;
              return (
                <Reveal 
                  as="button" 
                  className="program-card" 
                  delay={(i % 3) * 100} 
                  key={p.id}
                  onClick={() => setActiveProgram(p)}
                >
                  <span className="program-code">D-{p.code}</span>
                  <div className="card-icon"><Icon size={24} /></div>
                  <h3>{p.title}</h3>
                  <p>{p.summary}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="section dot-grid" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Why InternNova</span>
            <h2>More than just an internship.</h2>
            <p>We focus on what actually matters: hands-on experience, verifiable skills, and a strong project portfolio.</p>
          </div>
          <div className="features-grid">
            <Reveal className="feature-card" delay={100}>
              <div className="feature-icon"><Zap size={24} /></div>
              <h3>Real-World Projects</h3>
              <p>Build applications that solve actual industry problems, not just generic tutorials.</p>
            </Reveal>
            <Reveal className="feature-card" delay={200}>
              <div className="feature-icon"><Briefcase size={24} /></div>
              <h3>Offer Letter</h3>
              <p>Receive a formal offer letter marking the start of your professional journey with us.</p>
            </Reveal>
            <Reveal className="feature-card" delay={300}>
              <div className="feature-icon"><Award size={24} /></div>
              <h3>Verified Certificate</h3>
              <p>Every completion certificate has a unique ID verifiable by future employers.</p>
            </Reveal>
            <Reveal className="feature-card" delay={400}>
              <div className="feature-icon"><CheckCircle size={24} /></div>
              <h3>Flexible Learning</h3>
              <p>Balance your academics with our structured but flexible remote internships.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- UNIVERSITIES SECTION (Testimonials ke UPPAR) ---------------- */}
      <Universities />

      {/* ---------------- PROCESS ---------------- */}
      <section className="section" id="process" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head" style={{ marginBottom: '60px' }}>
            <span className="eyebrow">How it works</span>
            <h2>Your Path to Success</h2>
          </div>
          <div className="process-list">
            <Reveal className="process-row" delay={100}>
              <div className="process-num">1</div>
              <div>
                <h3>Apply & Enroll</h3>
                <p>Select your preferred domain and complete the simple enrollment process to secure your spot in the upcoming batch.</p>
              </div>
            </Reveal>
            <Reveal className="process-row" delay={200}>
              <div className="process-num">2</div>
              <div>
                <h3>Access the Dashboard</h3>
                <p>Log in to your personalized student dashboard where you'll find your offer letter, weekly tasks, and learning resources.</p>
              </div>
            </Reveal>
            <Reveal className="process-row" delay={300}>
              <div className="process-num">3</div>
              <div>
                <h3>Build Projects</h3>
                <p>Complete weekly tasks and build real-world projects with guidance from industry experts.</p>
              </div>
            </Reveal>
            <Reveal className="process-row" delay={400}>
              <div className="process-num">4</div>
              <div>
                <h3>Get Certified</h3>
                <p>Submit your final evaluation to receive your verified internship completion certificate and recommendation letter.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ SECTION ---------------- */}
      <section className="section faq-section" id="faq" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Got Questions?</span>
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-list" style={{ maxWidth: '800px' }}>
            {faqs.map((faq, idx) => (
              <div className={`faq-item ${openFaq === idx ? 'active' : ''}`} key={idx} onClick={() => toggleFaq(idx)}>
                <div className="faq-question">
                  <h3>{faq.q}</h3>
                  <ChevronDown size={20} className="faq-arrow" />
                </div>
                {openFaq === idx && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ---------------- TESTIMONIALS SECTION ---------------- */}
      <Testimonials />

      {/* ---------------- NEWSLETTER SECTION ---------------- */}
      <Newsletter />

      {/* ---------------- WHATSAPP FLOAT ---------------- */}
      <a href="https://wa.me/919534196255?text=Hello%20InternNova" className="whatsapp-float" target="_blank" rel="noreferrer">
        <MessageCircle size={18} />
        <span>Chat With Us</span>
      </a>

      <ProgramModal program={activeProgram} onClose={() => setActiveProgram(null)} />
    </>
  );
}
