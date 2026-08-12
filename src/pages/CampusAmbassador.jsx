import React, { useEffect, useState } from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  Award, 
  FileCheck2, 
  Sparkles, 
  Gift, 
  ArrowRight,
  ChevronDown,
  UserCheck,
  Rocket,
  Megaphone,
  Users2,
  CalendarCheck2,
  CheckCircle2,
  Search,
  CheckCircle,
  XCircle,
  Trophy,
  Loader2,
  Medal
} from 'lucide-react';
import Reveal from '../components/Reveal';
import { AMBASSADOR_FORM_URL } from '../lib/programs';

const API =
"https://script.google.com/macros/s/AKfycbz3qH5RsNH10HJRTjSPTQM4YqkU4BDTIJEiYQeN1KQg4iLmlNX49GOKV2dIwwsXGG6Kjw/exec";

// Responsibilities
const RESPONSIBILITIES = [
  {
    icon: Megaphone,
    title: 'Promote & Drive Awareness',
    desc: 'Share InternNova updates, programs, and opportunities across your college WhatsApp groups and student networks.'
  },
  {
    icon: CalendarCheck2,
    title: 'Lead Campus Campaigns',
    desc: 'Help organize virtual workshops, webinars, and promotional activities in your college campus.'
  },
  {
    icon: Users2,
    title: 'Connect & Guide Peers',
    desc: 'Act as the official bridge between InternNova and your college students for career guidance and queries.'
  }
];

// Perks
const PERKS = [
  {
    icon: GraduationCap,
    title: 'Leadership Experience',
    desc: 'Develop leadership, communication, and community-building skills to stand out to future employers.',
    bgColor: 'var(--accent-tint)',
    color: 'var(--accent)',
    delay: 300,
  },
  {
    icon: ShieldCheck,
    title: 'Official Certificate',
    desc: 'Receive an Official Campus Ambassador Certificate based on your active participation and contributions.',
    bgColor: 'var(--ok-tint)',
    color: 'var(--ok-500)',
    delay: 400,
  },
  {
    icon: Award,
    title: 'Performance Perks',
    desc: 'Earn special rewards, free access to premium webinars, and direct mentorship based on your overall impact.',
    bgColor: 'rgba(236,72,153,0.1)',
    color: 'var(--blob-pink)',
    delay: 500,
  },
  {
    icon: FileCheck2,
    title: 'Letter of Recommendation',
    desc: 'Earn a performance-based Letter of Recommendation (LOR) from InternNova leadership to boost your CV.',
    bgColor: 'rgba(99,102,241,0.1)',
    color: '#6366f1',
    delay: 600,
  },
  {
    icon: Sparkles,
    title: 'Official Social Recognition',
    desc: "Top performers get featured on InternNova's official LinkedIn and Instagram handles.",
    bgColor: 'rgba(245,158,11,0.1)',
    color: '#f59e0b',
    delay: 700,
  },
  {
    icon: Gift,
    title: 'Exciting Goodies & Rewards',
    desc: 'Stand out as a top performer to unlock exciting rewards, gift hampers, and exclusive perks.',
    bgColor: 'rgba(16,185,129,0.1)',
    color: '#10b981',
    delay: 800,
  },
];

// Journey Steps
const PROGRAM_STEPS = [
  {
    number: '01',
    icon: FileCheck2,
    title: 'Submit Application',
    desc: 'Fill out the simple application form sharing your background and campus presence.'
  },
  {
    number: '02',
    icon: UserCheck,
    title: 'Shortlisting & Onboarding',
    desc: 'Get selected and attend a brief orientation to learn about your responsibilities and resources.'
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Lead & Promote',
    desc: 'Represent InternNova in your college through campaigns, sharing updates, and helping peers.'
  },
  {
    number: '04',
    icon: Gift,
    title: 'Get Recognized & Rewarded',
    desc: 'Get featured on official handles, earn certificates, LORs, and exciting rewards based on performance.'
  }
];

// Eligibility
const ELIGIBILITY_POINTS = [
  'Currently enrolled in any college degree/diploma program (Any branch/year).',
  'Passionate about leadership, networking, and helping peers.',
  'Good written and verbal communication skills.',
  'Active presence on WhatsApp and social media platforms.'
];

// FAQs
const CA_FAQS = [
  {
    q: 'Who is eligible to become a Campus Ambassador?',
    a: 'Any currently enrolled college student from any stream, department, or year with good communication skills and enthusiasm for leadership can apply.'
  },
  {
    q: 'What will be my weekly time commitment?',
    a: 'The role is completely flexible and requires around 3 to 5 hours per week. It is designed to fit easily around your classes and exams.'
  },
  {
    q: 'How can anyone verify if an Ambassador is genuine?',
    a: 'We provide an Official Campus Ambassador ID to selected ambassadors. Anyone can verify their identity in the "Verify Ambassador" section above.'
  }
];

// Helper for Gold, Silver, Bronze theme styling
const getPodiumTheme = (index) => {
  if (index === 0) {
    return {
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
    };
  }
  if (index === 1) {
    return {
      color: '#64748b',
      bgColor: 'rgba(100, 116, 139, 0.12)',
      border: '1px solid rgba(100, 116, 139, 0.3)',
    };
  }
  if (index === 2) {
    return {
      color: '#d97706',
      bgColor: 'rgba(217, 119, 6, 0.12)',
      border: '1px solid rgba(217, 119, 6, 0.3)',
    };
  }
  return {
    color: 'var(--accent)',
    bgColor: 'var(--accent-tint)',
    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
  };
};

export default function CampusAmbassador() {
  const [openFaq, setOpenFaq] = useState(null);
  
  // Verification State
  const [searchId, setSearchId] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Live Leaderboard States with LocalStorage Instant Cache
  const [topAmbassadors, setTopAmbassadors] = useState(() => {
    try {
      const cached = localStorage.getItem('top_ambassadors_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [loadingTop, setLoadingTop] = useState(() => {
    try {
      return !localStorage.getItem('top_ambassadors_cache');
    } catch {
      return true;
    }
  });

  // Fetch Live Top Ambassadors (Background Sync)
  useEffect(() => {
    const loadTopAmbassadors = async () => {
      try {
        const res = await fetch(`${API}?action=top`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setTopAmbassadors(data);
          // Save in localStorage for instant loading next time
          localStorage.setItem('top_ambassadors_cache', JSON.stringify(data));
        }
      } catch (err) {
        console.error("Leaderboard Fetch Error:", err);
      } finally {
        setLoadingTop(false);
      }
    };

    loadTopAmbassadors();
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!searchId.trim()) return;

    setLoading(true);
    setHasSearched(false);

    try {
      const res = await fetch(`${API}?action=verify&id=${encodeURIComponent(searchId)}`);
      const data = await res.json();

      setVerifyResult(data.found ? data : null);
    } catch (err) {
      console.error(err);
      setVerifyResult(null);
    } finally {
      setHasSearched(true);
      setLoading(false);
    }
  };

  const isActive = verifyResult?.status?.trim().toLowerCase() === "active";

  return (
    <div>
      {/* Dynamic CSS Grid & Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner-icon {
          animation: spin 0.8s linear infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.25; }
        }
        .skeleton-box {
          background: rgba(255, 255, 255, 0.1);
          animation: pulse 1.4s ease-in-out infinite;
          border-radius: 6px;
        }

        .leaderboard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        @media (max-width: 900px) {
          .leaderboard-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .leaderboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .compact-card {
          padding: 22px 18px !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .compact-card:hover {
          transform: translateY(-3px);
        }
      `}</style>

      {/* Hero Section */}
      <section className="section dot-grid" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <div className="container text-center">
          <Reveal delay={100}>
            <span className="eyebrow">Join the movement</span>
            <h1 style={{ fontSize: 'var(--step-6)', margin: '16px 0 24px', letterSpacing: '-0.02em' }}>
              Campus <span className="text-gradient">Ambassador</span> Program
            </h1>
            <p className="text-muted" style={{ maxWidth: 700, margin: '0 auto', fontSize: 'var(--step-1)', lineHeight: 1.6 }}>
              Represent InternNova at your college. Build leadership skills, expand your network, 
              and earn exclusive perks while helping your peers discover career-launching opportunities.
            </p>
          </Reveal>
          
          <Reveal delay={200} style={{ marginTop: 40 }}>
            <a 
              href={AMBASSADOR_FORM_URL} 
              className="btn btn-primary" 
              style={{ padding: '16px 32px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              Apply Now <ArrowRight size={18} />
            </a>
          </Reveal>
        </div>
      </section>

      {/* Verify Campus Ambassador Section */}
      <section className="section" style={{ paddingTop: 10, paddingBottom: 50 }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <Reveal delay={100} className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <span className="eyebrow">Trust & Security</span>
            <h2 style={{ fontSize: 'var(--step-3)', marginTop: 8, marginBottom: 12 }}>
              Verify an Official Ambassador
            </h2>
            <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: 24 }}>
              Enter the official Ambassador ID to verify active status.
            </p>

            <form onSubmit={handleVerify} style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Enter Ambassador ID (e.g. IN-CA-101)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                disabled={loading}
                style={{
                  padding: '12px 18px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #ccc)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'inherit',
                  minWidth: '260px',
                  outline: 'none',
                  opacity: loading ? 0.7 : 1
                }}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
                style={{ 
                  padding: '12px 24px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 8,
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner-icon" /> Verifying...
                  </>
                ) : (
                  <>
                    <Search size={18} /> Verify Status
                  </>
                )}
              </button>
            </form>

            {/* Result Box */}
            {!loading && hasSearched && (
              <div style={{ 
                marginTop: 24, 
                padding: 18, 
                borderRadius: 8, 
                background: verifyResult
                  ? isActive
                    ? 'rgba(16,185,129,0.1)'
                    : 'rgba(245,158,11,0.1)'
                  : 'rgba(239,68,68,0.1)', 
                textAlign: 'left' 
              }}>
                {verifyResult ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <CheckCircle size={24} style={{ color: isActive ? '#10b981' : '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <h4 style={{ margin: 0, color: isActive ? "#10b981" : "#f59e0b", fontSize: '1.05rem' }}>
                        {isActive ? "Verified Active Ambassador" : "Verified Inactive Ambassador"}
                      </h4>

                      <div style={{ marginTop: 10, lineHeight: 1.8 }}>
                        <p style={{ margin: '2px 0' }}><strong>Ambassador ID:</strong> {verifyResult.id}</p>
                        <p style={{ margin: '2px 0' }}><strong>Name:</strong> {verifyResult.name}</p>
                        <p style={{ margin: '2px 0' }}><strong>College:</strong> {verifyResult.college}</p>
                        <p style={{ margin: '2px 0' }}><strong>Status:</strong> {verifyResult.status}</p>
                        <p style={{ margin: '2px 0' }}><strong>Join Date:</strong> {verifyResult.joinDate}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <XCircle size={24} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <h4 style={{ margin: 0, color: '#ef4444', fontSize: '1.05rem' }}>Ambassador Not Found</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        No active ambassador matches ID "{searchId}". Please re-check the ID or contact support.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* Top Ambassadors Leaderboard Section */}
      <section className="section" style={{ paddingTop: 10, paddingBottom: 50 }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          <Reveal delay={100} className="text-center" style={{ marginBottom: 32 }}>
            <span className="eyebrow">Spotlight</span>
            <h2 style={{ fontSize: 'var(--step-4)', marginTop: 8 }}>Top Performing Ambassadors</h2>
          </Reveal>

          <div className="leaderboard-grid">
            {loadingTop ? (
              // Fast-loading Skeleton Cards
              [1, 2, 3].map((_, idx) => (
                <div key={idx} className="card compact-card text-center">
                  <div className="skeleton-box" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 12px' }}></div>
                  <div className="skeleton-box" style={{ width: '70%', height: 18, margin: '0 auto 8px' }}></div>
                  <div className="skeleton-box" style={{ width: '85%', height: 14, margin: '0 auto 12px' }}></div>
                  <div className="skeleton-box" style={{ width: '50%', height: 14, margin: '0 auto' }}></div>
                </div>
              ))
            ) : topAmbassadors.length > 0 ? (
              // Compact Live Grid
              topAmbassadors.map((amb, idx) => {
                const theme = getPodiumTheme(idx);
                return (
                  <Reveal key={idx} delay={150 + idx * 80} className="card compact-card text-center" style={{ position: 'relative', border: theme.border }}>
                    <span style={{ 
                      position: 'absolute', 
                      top: 12, 
                      right: 12, 
                      background: theme.bgColor, 
                      color: theme.color, 
                      padding: '2px 10px', 
                      borderRadius: 16, 
                      fontWeight: 700, 
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      {idx < 3 && <Medal size={13} />}
                      {amb.rank || `#${idx + 1}`}
                    </span>

                    <div style={{ 
                      margin: '0 auto 12px', 
                      display: 'inline-flex', 
                      padding: 10, 
                      borderRadius: '50%', 
                      background: theme.bgColor, 
                      color: theme.color 
                    }}>
                      <Trophy size={26} />
                    </div>

                    <h3 style={{ fontSize: '1.08rem', marginBottom: 4, fontWeight: 700, lineHeight: 1.3 }}>{amb.name}</h3>
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 10, minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {amb.college}
                    </p>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: theme.color }}>
                      {amb.impact}
                    </div>
                  </Reveal>
                );
              })
            ) : (
              <p className="text-muted text-center" style={{ gridColumn: '1 / -1' }}>No leaderboard data available.</p>
            )}
          </div>
        </div>
      </section>

      {/* What Will You Do */}
      <section className="section" style={{ paddingTop: 20, paddingBottom: 50 }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          <Reveal delay={100} className="text-center" style={{ marginBottom: 40 }}>
            <span className="eyebrow">Your Role</span>
            <h2 style={{ fontSize: 'var(--step-4)', marginTop: 8 }}>What Will You Do?</h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {RESPONSIBILITIES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Reveal key={idx} delay={200 + idx * 100} className="card" style={{ padding: 28 }}>
                  <div style={{ color: 'var(--accent)', marginBottom: 16 }}>
                    <Icon size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: 12 }}>{item.title}</h3>
                  <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{item.desc}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Program Journey */}
      <section className="section" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          <Reveal delay={100} className="text-center" style={{ marginBottom: 40 }}>
            <span className="eyebrow">How It Works</span>
            <h2 style={{ fontSize: 'var(--step-4)', marginTop: 8 }}>Your Ambassador Journey</h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {PROGRAM_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <Reveal key={idx} delay={200 + idx * 100} className="card" style={{ padding: 28, position: 'relative' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', opacity: 0.8, display: 'block', marginBottom: 12 }}>
                    STEP {step.number}
                  </span>
                  <div style={{ color: 'var(--accent)', marginBottom: 16 }}>
                    <Icon size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>{step.title}</h3>
                  <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{step.desc}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="section" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          <Reveal delay={100} className="text-center" style={{ marginBottom: 40 }}>
            <span className="eyebrow">Perks & Rewards</span>
            <h2 style={{ fontSize: 'var(--step-4)', marginTop: 8 }}>Why Become an Ambassador?</h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {PERKS.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Reveal key={index} delay={item.delay} className="card" style={{ padding: 32, textAlign: 'center' }}>
                  <div style={{ padding: 16, borderRadius: '50%', background: item.bgColor, color: item.color, display: 'inline-flex', marginBottom: 20 }}>
                    <IconComponent size={32} />
                  </div>
                  <h3 style={{ marginBottom: 12 }}>{item.title}</h3>
                  <p className="text-muted">{item.desc}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="section" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <Reveal delay={100} className="card" style={{ padding: '36px 32px' }}>
            <div className="text-center" style={{ marginBottom: 28 }}>
              <span className="eyebrow">Criteria</span>
              <h2 style={{ fontSize: 'var(--step-3)', marginTop: 8 }}>Who Can Apply?</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ELIGIBILITY_POINTS.map((point, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <CheckCircle2
                    size={24}
                    style={{
                      color: "#10b981",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <span style={{ fontSize: '1rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>{point}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQs */}
      <section className="section" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <Reveal delay={100} className="text-center" style={{ marginBottom: 40 }}>
            <span className="eyebrow">Queries</span>
            <h2 style={{ fontSize: 'var(--step-4)', marginTop: 8 }}>Ambassador FAQs</h2>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {CA_FAQS.map((faq, index) => (
              <Reveal key={index} delay={200 + index * 100}>
                <div 
                  className="card" 
                  style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => toggleFaq(index)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{faq.q}</h4>
                    <ChevronDown 
                      size={20} 
                      style={{ 
                        transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0deg)', 
                        transition: 'transform 0.2s ease' 
                      }} 
                    />
                  </div>
                  {openFaq === index && (
                    <p className="text-muted" style={{ marginTop: 12, marginBottom: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section" style={{ padding: '60px 0 80px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <Reveal delay={100}>
            <h2>Ready to represent InternNova?</h2>
            <p className="text-muted" style={{ margin: '16px 0 24px' }}>
              Applications are active for the current batch. Take the lead at your campus today.
            </p>
            <a 
              href={AMBASSADOR_FORM_URL} 
              className="btn btn-primary" 
              style={{ padding: '16px 32px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              Apply as Campus Ambassador <ArrowRight size={18} />
            </a>
          </Reveal>
        </div>
      </section>

    </div>
  );
}
