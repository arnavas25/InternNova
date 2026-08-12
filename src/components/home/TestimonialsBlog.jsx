import { useEffect, useRef, useState } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Reveal from '../Reveal';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const TESTIMONIALS = [
  { initial: 'A', color: '#3E5C8A', name: 'Abhishek', meta: 'VIT Pune · Web Dev Intern', quote: 'The Web Development track was amazing. Building a live portfolio gave me real confidence!' },
  { initial: 'P', color: '#B8863A', name: 'Priya', meta: 'SRM University · Data Analyst Intern', quote: 'The Power BI dashboards we built in Data Analytics helped me crack my data analyst placement.' },
  { initial: 'R', color: '#8A4A5C', name: 'Rohan', meta: 'DTU Delhi · Cyber Security Intern', quote: 'Ethical hacking modules were extremely hands-on. I highly recommend the Cyber Security domain!' },
  { initial: 'N', color: '#1F8A5F', name: 'Neha', meta: 'BITS Pilani · AI Intern', quote: 'Integrating AI endpoints and building chatbots in Python was challenging but highly rewarding.' },
  { initial: 'A', color: '#B4642A', name: 'Amit', meta: 'Amity University · Digital Marketing Intern', quote: 'The SEO campaigns and keyword strategies I designed gave me a solid grasp of branding.' },
  { initial: 'S', color: '#3E6E7A', name: 'Sneha', meta: 'Symbiosis Pune · HR Intern', quote: 'HR recruitment operations and onboarding structures were thoroughly explained. A fantastic program!' },
];

const STARTER_ARTICLES = [
  { id: '1', title: 'How to Build a Resume That Gets Noticed in 2026', category: 'Resume Tips', excerpt: 'Your resume is your first impression. Learn how to optimize your bullet points, include metrics, and structure your layout to bypass applicant tracking systems (ATS).', read_time: 4, date: 'June 15, 2026', slug: 'build-resume-2026' },
  { id: '2', title: 'Top 5 GitHub Projects You Should Have as a CS Student', category: 'Career Growth', excerpt: 'Showcase your skills directly to hiring managers. We outline the key full-stack, data pipeline, and system architecture projects you must host on GitHub.', read_time: 3, date: 'June 12, 2026', slug: 'top-5-github-projects' },
  { id: '3', title: 'How to Ace Your First Technical Interview', category: 'Interview Prep', excerpt: 'Cracking coding assessments and system design loops requires structure. Discover the core communication and problem-solving tips to guide you.', read_time: 5, date: 'June 08, 2026', slug: 'ace-technical-interview' },
];

function useTestimonialAutoscroll() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let amount = 0, paused = false;
    const id = setInterval(() => {
      if (paused) return;
      amount += 1;
      if (amount >= el.scrollWidth - el.clientWidth) amount = 0;
      el.scrollLeft = amount;
    }, 30);
    const enter = () => { paused = true; };
    const leave = () => { paused = false; amount = el.scrollLeft; };
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
    return () => { clearInterval(id); el.removeEventListener('mouseenter', enter); el.removeEventListener('mouseleave', leave); };
  }, []);
  return ref;
}

export default function TestimonialsBlog() {
  const carouselRef = useTestimonialAutoscroll();
  const [articles, setArticles] = useState(STARTER_ARTICLES);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    (async () => {
      try {
        const { data, error } = await supabase.from('blog_articles').select('*').order('published_at', { ascending: false }).limit(3);
        if (!error && data?.length) {
          setArticles(data.map((item) => ({
            id: item.id, title: item.title, category: item.category, excerpt: item.excerpt,
            read_time: item.read_time,
            date: new Date(item.published_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
            slug: item.slug,
          })));
        }
      } catch (e) {
        console.warn('Could not fetch blog articles, using starters.', e);
      }
    })();
  }, []);

  return (
    <>
      <section className="section" id="testimonials">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">On The Record</span>
            <h2>What our interns say</h2>
            <p>Hear directly from students who built real-world skills with InternNova.</p>
          </div>
          <div className="testimonial-carousel" ref={carouselRef}>
            {TESTIMONIALS.map((t, i) => (
              <div className="testimonial-card card" key={i}>
                <div className="stars">{Array.from({ length: 5 }).map((_, s) => <Star key={s} size={13} fill="currentColor" />)}</div>
                <p>&ldquo;{t.quote}&rdquo;</p>
                <div className="testimonial-person">
                  <div className="avatar" style={{ background: t.color }}>{t.initial}</div>
                  <div><h4>{t.name}</h4><span className="text-muted">{t.meta}</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="stats-row-small">
            <div className="card"><h3>500+</h3><p>Reviews</p></div>
            <div className="card"><h3>4.9/5</h3><p>Rating</p></div>
            <div className="card"><h3>98%</h3><p>Recommend</p></div>
          </div>
        </div>
      </section>

      <section className="section" id="blog">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Career Insights</span>
            <h2>Tips &amp; guidance</h2>
            <p>Get the latest tips on resume building, tech career growth, and interview preparation.</p>
          </div>
          <div className="blog-grid">
            {articles.map((art, i) => (
              <Reveal className="blog-card card" delay={i * 60} key={art.id}>
                <div className="blog-card-head">
                  <span className="badge badge-neutral">{art.category}</span>
                  <span className="text-muted mono" style={{ fontSize: '0.75rem' }}>{art.read_time} min read</span>
                </div>
                <h3>{art.title}</h3>
                <p className="text-muted">{art.excerpt}</p>
                <div className="blog-card-foot">
                  <span className="text-muted" style={{ fontSize: '0.82rem' }}>{art.date}</span>
                  <Link to={`/blog#${art.slug}`}>Read More <ArrowRight size={13} /></Link>
                </div>
              </Reveal>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/blog" className="btn btn-outline">View All Articles <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
