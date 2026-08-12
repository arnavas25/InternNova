import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Reveal from '../components/Reveal';

const FAQS = [
  {
    q: "Is the internship completely remote?",
    a: "Yes, all our internship programs are 100% remote. You can complete the tasks and projects at your own pace from anywhere."
  },
  {
    q: "Do I get a verified certificate?",
    a: "Absolutely. Upon successful completion of your internship tasks, you will receive a verified certificate with a unique ID that can be authenticated by future employers."
  },
  {
    q: "Is there any fee to join?",
    a: "We offer both Free and Premium tracks. The Free track gives you access to resources and a digital certificate. The Premium track requires a one-time fee of ₹499 and includes dedicated mentorship, ATS resume reviews, flexible durations, and priority doubt support."
  },
  {
    q: "What happens if I miss a deadline?",
    a: "We understand you have academics to manage. Our deadlines are flexible—as long as all tasks are completed by the end of your program duration, you will receive your certificate."
  },
  {
    q: "How do I communicate with mentors?",
    a: "You will have access to our support channels and a dedicated WhatsApp number where you can reach out for technical doubts or guidance."
  }
];

export default function Faq() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className="page-top">
      <section className="section dot-grid" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="container text-center">
          <Reveal delay={100}>
            <span className="eyebrow">Support</span>
            <h1 style={{ fontSize: 'var(--step-5)', margin: '16px 0 24px' }}>Frequently Asked Questions</h1>
            <p className="text-muted" style={{ maxWidth: 500, margin: '0 auto', fontSize: 'var(--step-1)' }}>
              Everything you need to know about our internship programs and how they work.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FAQS.map((faq, i) => (
              <Reveal key={i} delay={i * 100} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <button 
                  onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                  style={{ 
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '24px 28px', background: 'transparent', border: 'none', textAlign: 'left',
                    color: 'var(--text)', fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                    cursor: 'pointer'
                  }}
                >
                  {faq.q}
                  <ChevronDown 
                    size={20} 
                    style={{ 
                      color: 'var(--text-muted)', 
                      transition: 'transform 0.3s var(--ease)',
                      transform: openIdx === i ? 'rotate(180deg)' : 'none'
                    }} 
                  />
                </button>
                <div 
                  style={{
                    maxHeight: openIdx === i ? 200 : 0,
                    opacity: openIdx === i ? 1 : 0,
                    transition: 'all 0.3s var(--ease)',
                    padding: openIdx === i ? '0 28px 24px' : '0 28px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6
                  }}
                >
                  {faq.a}
                </div>
              </Reveal>
            ))}
          </div>
          
          <Reveal delay={600} className="text-center" style={{ marginTop: 60 }}>
            <p className="text-muted" style={{ marginBottom: 20 }}>Still have questions?</p>
            <a href="https://wa.me/919534196255" className="btn btn-outline" target="_blank" rel="noreferrer">Chat with Support</a>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
