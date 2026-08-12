import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GithubIcon } from '../components/SocialIcons';
import './showcase.css';

const FILTERS = ['all', 'Web Development', 'Data Analytics', 'Cyber Security', 'Artificial Intelligence', 'Python Programming', 'Java Development'];

const FALLBACK_PROJECTS = [
  { title: 'E-Commerce Glassmorphism Portal', student_name: 'Akash Sharma', domain: 'Web Development', thumbnail_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&auto=format&fit=crop&q=60', project_url: 'https://github.com' },
  { title: 'HR Recruitment Pipelines Tracker', student_name: 'Neha Mittal', domain: 'Web Development', thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60', project_url: 'https://github.com' },
  { title: 'Interactive Sales Analytics Dashboard', student_name: 'Sneha Reddy', domain: 'Data Analytics', thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=60', project_url: 'https://github.com' },
  { title: 'Machine Learning Sentiment Analyzer', student_name: 'Ananya Sen', domain: 'Artificial Intelligence', thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=500&auto=format&fit=crop&q=60', project_url: 'https://github.com' },
  { title: 'Network Port Scanner and Intrusion Detector', student_name: 'Vijay Kapoor', domain: 'Cyber Security', thumbnail_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop&q=60', project_url: 'https://github.com' },
  { title: 'Automated Folder Cleanup Utility', student_name: 'Rahul Saxena', domain: 'Python Programming', thumbnail_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&auto=format&fit=crop&q=60', project_url: 'https://github.com' },
];

export default function Showcase() {
  const [projects, setProjects] = useState(FALLBACK_PROJECTS);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    (async () => {
      try {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (!error && data?.length) setProjects(data);
      } catch (e) {
        console.warn('DB showcase query failed, using static fallback.', e);
      }
    })();
  }, []);

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.domain === filter);

  return (
    <div className="showcase-page">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Proof Of Work</span>
          <h2>Student project showcase</h2>
          <p>Explore top production-grade projects deployed by our interns during their program.</p>
        </div>

        <div className="filter-bar">
          {FILTERS.map((f) => (
            <button key={f} className={`filter-btn ${filter === f ? 'is-active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All Domains' : f === 'Artificial Intelligence' ? 'AI' : f === 'Web Development' ? 'Web Dev' : f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '40px 0' }}>No projects uploaded in this domain yet.</p>
        ) : (
          <div className="showcase-grid">
            {filtered.map((p, i) => (
              <div className="project-card card" key={i}>
                <div className="project-thumb-wrap">
                  <img src={p.thumbnail_url || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&auto=format&fit=crop&q=60'} alt={p.title || p.project_title} className="project-thumb" />
                </div>
                <div className="project-info">
                  <span className="mono project-domain">{p.domain}</span>
                  <h3>{p.title || p.project_title}</h3>
                  <div className="project-author text-muted">By: <span>{p.student_name}</span></div>
                  <a href={p.project_url || '#'} target="_blank" rel="noreferrer" className="btn btn-outline btn-block btn-sm">
                    <GithubIcon size={15} /> View Project
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="showcase-cta card">
          <h3>Want your project featured here?</h3>
          <p className="text-muted">Complete your internship curriculum, submit your project repository, and verify your certification!</p>
          <Link to="/login" className="btn btn-primary">Submit Your Project</Link>
        </div>
      </div>
    </div>
  );
}
