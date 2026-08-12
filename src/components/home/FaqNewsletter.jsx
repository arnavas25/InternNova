import { useState } from 'react';
import { ChevronDown, Send } from 'lucide-react';
import Reveal from '../Reveal';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const FAQS = [
  ['Are the certificates verified?', 'Yes, every certificate includes a unique verification ID and can be verified through the InternNova Verification Portal.'],
  ['Are the internships online?', 'Yes, all InternNova internship programs are conducted online, allowing students to learn and participate from anywhere.'],
  ['What is the duration of the internship?', 'Most InternNova internships are structured as 30-day programs with weekly learning modules, assignments, and project work.'],
  ['Will I receive mentor support?', 'Yes, interns receive guidance, learning support, and assistance with assignments and projects throughout the internship.'],
  ['Will I work on real projects?', 'Yes, every internship includes practical assignments and project-based learning to help you build real-world skills and strengthen your portfolio.'],
  ['Will I receive an Offer Letter?', 'Yes, selected candidates receive an official internship offer letter before the program begins.'],
  ['How are certificates awarded?', 'Certificates are awarded only after successful completion of internship requirements, assignments, and project submissions.'],
  ['Is there any fee for the internship?', 'Please refer to the application form for the latest internship fee, batch details, and available domains.'],
];

export default function FaqNewsletter() {
  const [openIdx, setOpenIdx] = useState(null);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null); // { type: 'success'|'error'|'info', text }

  const subscribe = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!isSupabaseConfigured()) {
      setMsg({ type: 'error', text: 'Subscriptions are temporarily unavailable. Please try again later.' });
      return;
    }
    try {
      const { data: existing } = await supabase.from('newsletter_subscribers').select('email').eq('email', email.trim().toLowerCase()).maybeSingle();
      if (existing) { setMsg({ type: 'info', text: "You're already subscribed!" }); return; }
      const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim().toLowerCase(), subscribed_at: new Date().toISOString() });
      if (error) { setMsg({ type: 'error', text: 'Failed to subscribe. Please try again.' }); return; }
      setMsg({ type: 'success', text: "You're in! Check your inbox." });
      setEmail('');
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'An error occurred. Try again.' });
    }
  };

  return (
    <>
      <section className="section" id="faq">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Common Questions</span>
            <h2>Frequently asked questions</h2>
          </div>
          <div className="faq-list">
            {FAQS.map(([q, a], i) => (
              <div className={`faq-item card ${openIdx === i ? 'is-open' : ''}`} key={q}>
                <button className="faq-question" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                  {q} <ChevronDown size={17} className="faq-chevron" />
                </button>
                {openIdx === i && <div className="faq-answer"><p>{a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section newsletter-section">
        <div className="container">
          <Reveal className="newsletter-card card">
            <div>
              <h3>Get free career tips &amp; internship updates</h3>
              <p className="text-muted">Join 500+ students already getting our weekly newsletter</p>
            </div>
            <form onSubmit={subscribe} className="newsletter-form">
              <input type="email" required placeholder="Enter your email address…" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn btn-primary" type="submit"><Send size={15} /> Subscribe</button>
            </form>
          </Reveal>
          {msg && <p className={`newsletter-msg newsletter-msg-${msg.type}`}>{msg.text}</p>}
        </div>
      </section>
    </>
  );
}
