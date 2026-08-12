import { useState, useEffect } from 'react';
import { Target, Users, Globe, ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';
import Reveal from '../components/Reveal';
import { supabase } from '../lib/supabase';
import { AMBASSADOR_FORM_URL } from '../lib/programs';

const DEFAULT_TEAM = [
  { id: 1, name: 'Avya Nand', designation: 'Founder & CEO', photo_url: '/avya.jpg' },
  { id: 2, name: 'Arnav Raj', designation: 'Head of Operations and Student Relation', photo_url: '/arnav.jpg' },
  { id: 3, name: 'Vinay Pal', designation: 'Head of Technology', photo_url: '/vinay.jpg' },
  { id: 4, name: 'Vaidik Dubey', designation: 'Head of Product & Innovation', photo_url: '/vaidik.jpg' },
  { id: 5, name: 'Arnav Tiwari', designation: 'Mentor', photo_url: '/arnav-tiwari.jpg' },
  { id: 6, name: 'Raghavji Choudhary', designation: 'Mentor', photo_url: '/raghavji.jpg' },
  { id: 7, name: 'Sahadev Rajiv Kumar Vishwakarma', designation: 'Mentor', photo_url: '/sahadev.jpg' }
];

export default function About() {
  const [team, setTeam] = useState(DEFAULT_TEAM);

  const getRoleWeight = (designation) => {
    const d = (designation || '').toLowerCase();
    if (d.includes('founder') || d.includes('ceo')) return 1;
    if (d.includes('operations')) return 2;
    if (d.includes('technology')) return 3;
    if (d.includes('product')) return 4;
    if (d.includes('mentor')) return 5;
    return 6;
  };

  useEffect(() => {
    supabase.from('team_members').select('*')
      .then(({ data }) => {
        if (data && data.length > 0) {
          const sortedData = data.sort((a, b) => {
            const weightA = getRoleWeight(a.designation);
            const weightB = getRoleWeight(b.designation);
            if (weightA !== weightB) return weightA - weightB;
            return new Date(a.created_at) - new Date(b.created_at);
          });
          setTeam(sortedData);
        }
      });
  }, []);

  return (
    <div className="page-top">
      {/* Hero Section */}
      <section className="section dot-grid" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <div className="container text-center">
          <Reveal delay={100}>
            <span className="eyebrow">Our Mission</span>
            <h1 style={{ fontSize: 'var(--step-6)', margin: '16px 0 24px', letterSpacing: '-0.02em' }}>
              Bridging the gap between <br />
              <span className="text-gradient">education and industry.</span>
            </h1>
            <p className="text-muted" style={{ maxWidth: 700, margin: '0 auto', fontSize: 'var(--step-1)', lineHeight: 1.6 }}>
              InternNova was founded with a single goal: to provide Indian college students with real-world skills, hands-on experience, and verifiable credentials to kickstart their tech careers.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="section">
        <div className="container">
          <Reveal className="text-center" style={{ marginBottom: 60 }}>
            <h2>Meet the Leadership</h2>
            <p className="text-muted">The team driving the vision of InternNova.</p>
          </Reveal>

          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
            {team.map((member, i) => (
              <Reveal key={member.id} delay={i * 100} style={{ width: 260, textAlign: 'center' }}>
                <div style={{ width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 20, background: 'var(--surface-2)' }}>
                  <img src={member.photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop'} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: 4, fontFamily: 'var(--font-body)' }}>{member.name}</h3>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>{member.designation}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}
