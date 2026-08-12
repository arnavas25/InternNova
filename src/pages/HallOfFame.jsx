import React, { useState, useEffect, useMemo } from 'react';
import { Search, Sparkles, Award, Layers, Share2, ShieldCheck, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function HallOfFame() {
  const [achievers, setAchievers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic Theme State (Defaulting to Dark Theme)
  const [isDark, setIsDark] = useState(() => !document.body.classList.contains('light-theme'));

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(!document.body.classList.contains('light-theme'));
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchHallOfFame = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/get-hall-of-fame');
        if (!response.ok) {
          throw new Error(`Failed to fetch Hall of Fame: ${response.status}`);
        }
        
        const data = await response.json();
        setAchievers(data);
        
        const batches = Array.from(new Set(data.map(a => a.batch_name).filter(Boolean))).sort();
        if (batches.length > 0) {
          setSelectedBatch(batches[batches.length - 1]);
        }
      } catch (err) {
        console.error('Fetch Error:', err);
        setAchievers([]);
      }
      setLoading(false);
    };

    fetchHallOfFame();
  }, []);

  const handleShare = async (student) => {
    const shareText = `🎉 Check out ${student.name}'s Rank #${student.rank} achievement in ${student.domain} (${student.batch_name}) at InternNova!`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${student.name} - Top Performer`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share canceled', err);
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert('Achievement link copied! Share it with your friends 🚀');
    }
  };

  const batchesList = useMemo(() => {
    return Array.from(new Set(achievers.map(a => a.batch_name).filter(Boolean))).sort();
  }, [achievers]);

  const domainsList = useMemo(() => {
    const batchData = achievers.filter(a => a.batch_name === selectedBatch);
    const unique = Array.from(new Set(batchData.map(a => a.domain).filter(Boolean))).sort();
    return ['All Domains', ...unique];
  }, [achievers, selectedBatch]);

  const domainGroups = useMemo(() => {
    if (!selectedBatch) return {};

    const query = searchQuery.toLowerCase().trim();
    let filtered = achievers.filter(a => a.batch_name === selectedBatch);

    filtered = filtered.filter(a => {
      const name = (a.name || '').toLowerCase();
      const domain = (a.domain || '').toLowerCase();
      const studentId = (a.student_id || '').toLowerCase();
      return !query || name.includes(query) || domain.includes(query) || studentId.includes(query);
    });

    const groups = {};
    filtered.forEach(student => {
      const domainName = student.domain || 'General Track';
      if (!groups[domainName]) groups[domainName] = [];
      groups[domainName].push(student);
    });

    if (selectedDomain !== 'All Domains') {
      return { [selectedDomain]: groups[selectedDomain] || [] };
    }

    return groups;
  }, [achievers, selectedBatch, selectedDomain, searchQuery]);

  // Color palette matching Verification Portal screenshot
  const colors = {
    bgPage: isDark ? '#05070e' : '#f8fafc',
    bgCard: isDark ? '#0c101d' : '#ffffff',
    bgCardInner: isDark ? '#141a29' : '#f8fafc',
    bgInput: isDark ? '#121826' : '#ffffff',
    textMain: isDark ? '#f8fafc' : '#0f172a',
    textSub: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#1e293b' : '#e2e8f0',
    accentGold: '#d97706',
    pillBg: isDark ? '#121826' : '#ffffff',
    pillActiveBg: isDark ? '#f8fafc' : '#0f172a',
    pillActiveText: isDark ? '#0f172a' : '#ffffff'
  };

  return (
    <section style={{ 
      paddingTop: '80px', 
      paddingBottom: '100px', 
      minHeight: '100vh', 
      backgroundColor: colors.bgPage,
      backgroundImage: isDark ? 'radial-gradient(#1e293b 1px, transparent 1px)' : 'radial-gradient(#cbd5e1 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      transition: 'background-color 0.2s ease, color 0.2s ease'
    }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: colors.pillBg,
            color: colors.textMain,
            padding: '8px 20px',
            borderRadius: '30px',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '16px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
            InternNova Leaders • Verified Achievers
          </div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '38px', fontWeight: '800', margin: '0 0 10px 0', color: colors.textMain }}>
            Domain-Wise Top Performers
          </h1>
          <p style={{ fontSize: '15px', color: colors.textSub, margin: '0 auto', maxWidth: '580px', lineHeight: '1.6' }}>
            Recognizing top-performing interns across specialized tracks for exceptional contributions and project performance.
          </p>
        </div>

        {/* Batch Selector Tabs */}
        {batchesList.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {batchesList.map((batch) => {
              const isActive = selectedBatch === batch;
              return (
                <button
                  key={batch}
                  onClick={() => { setSelectedBatch(batch); setSelectedDomain('All Domains'); }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '100px',
                    border: isActive ? `1px solid ${colors.pillActiveBg}` : `1px solid ${colors.border}`,
                    backgroundColor: isActive ? colors.pillActiveBg : colors.pillBg,
                    color: isActive ? colors.pillActiveText : colors.textSub,
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Layers size={14} /> {batch}
                </button>
              );
            })}
          </div>
        )}

        {/* Search & Domain Filter Bar */}
        <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: colors.textSub }} />
            <input
              type="text"
              placeholder="Search by student name, ID, or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 18px 12px 44px',
                borderRadius: '100px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.bgInput,
                color: colors.textMain,
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', maxWidth: '850px' }}>
            {domainsList.map((domain) => {
              const active = selectedDomain === domain;
              return (
                <button
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '100px',
                    border: active ? '1px solid #3b82f6' : `1px solid ${colors.border}`,
                    backgroundColor: active ? '#2563eb' : colors.bgInput,
                    color: active ? '#ffffff' : colors.textSub,
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {domain}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Display Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: colors.textSub, fontWeight: '500' }}>Loading Achievers...</p>
          </div>
        ) : Object.keys(domainGroups).length === 0 || Object.values(domainGroups).every(arr => arr.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: colors.bgCard, borderRadius: '24px', border: `1px solid ${colors.border}` }}>
            <Sparkles size={32} style={{ color: colors.textSub, marginBottom: '8px' }} />
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: colors.textMain }}>No Achievers Found</h3>
            <p style={{ margin: 0, fontSize: '14px', color: colors.textSub }}>Try selecting another batch or resetting domain filters.</p>
          </div>
        ) : (
          Object.entries(domainGroups).map(([domainName, students]) => {
            if (!students || students.length === 0) return null;

            const sortedStudents = [...students].sort((a, b) => Number(a.rank) - Number(b.rank));
            const rank1 = sortedStudents.find(s => Number(s.rank) === 1) || sortedStudents[0];
            const rank2 = sortedStudents.find(s => Number(s.rank) === 2) || sortedStudents[1];
            const rank3 = sortedStudents.find(s => Number(s.rank) === 3) || sortedStudents[2];

            return (
              <div key={domainName} style={{ marginBottom: '36px', backgroundColor: colors.bgCard, padding: '28px', borderRadius: '24px', border: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '12px' }}>
                  <Award size={20} style={{ color: '#38bdf8' }} />
                  <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: colors.textMain }}>
                    {domainName}
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                  {rank1 && <TopCard student={rank1} badge="🥇 Rank #1 Champion" badgeBg={isDark ? '#451a03' : '#fef3c7'} badgeColor={isDark ? '#fde047' : '#d97706'} border={isDark ? '#78350f' : '#fde68a'} onShare={handleShare} colors={colors} isDark={isDark} />}
                  {rank2 && <TopCard student={rank2} badge="🥈 Rank #2 Runner Up" badgeBg={isDark ? '#1e293b' : '#f1f5f9'} badgeColor={isDark ? '#cbd5e1' : '#475569'} border={isDark ? '#334155' : '#e2e8f0'} onShare={handleShare} colors={colors} isDark={isDark} />}
                  {rank3 && <TopCard student={rank3} badge="🥉 Rank #3 Achiever" badgeBg={isDark ? '#431407' : '#ffedd5'} badgeColor={isDark ? '#fdba74' : '#ea580c'} border={isDark ? '#7c2d12' : '#fed7aa'} onShare={handleShare} colors={colors} isDark={isDark} />}
                </div>
              </div>
            );
          })
        )}

        {/* Company Banner */}
        <div style={{
          marginTop: '48px',
          padding: '32px',
          borderRadius: '24px',
          backgroundColor: colors.bgCard,
          color: colors.textMain,
          border: `1px solid ${colors.border}`,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
              <ShieldCheck size={18} /> Official InternNova Hiring Partner Portal
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '800', color: colors.textMain }}>
              Are you an Employer or Hiring Manager?
            </h3>
            <p style={{ margin: 0, color: colors.textSub, fontSize: '14px', maxWidth: '600px', lineHeight: '1.5' }}>
              Get direct access to our verified rankers' performance scorecards and verified project credentials.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/hire-talent'}
            style={{
              backgroundColor: colors.pillActiveBg,
              color: colors.pillActiveText,
              border: 'none',
              padding: '14px 28px',
              borderRadius: '100px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Briefcase size={16} /> Hire Top Talent
          </button>
        </div>

      </div>
    </section>
  );
}

function TopCard({ student, badge, badgeBg, badgeColor, border, onShare, colors, isDark }) {
  const photoUrl = student.profile_url || student.image;

  // Smart Initials logic: special terms ignore karke Clean initials nikalega
  const getInitials = (name) => {
    if (!name) return 'IN';
    // Sirf alphabetic words consider karenge
    const cleanName = name.replace(/[^a-zA-Z\s]/g, '').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    
    if (parts.length === 0) return 'IN';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    
    // Middle titles / terms like "A/L" bypass karke First & Last word ke letters legalega
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  return (
    <div style={{
      borderRadius: '20px',
      padding: '24px 20px',
      textAlign: 'center',
      backgroundColor: colors.bgCardInner,
      border: `2px solid ${border}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div>
        <span style={{ 
          backgroundColor: badgeBg, 
          color: badgeColor, 
          fontSize: '12px', 
          fontWeight: '700', 
          padding: '6px 14px', 
          borderRadius: '100px', 
          display: 'inline-block', 
          marginBottom: '16px' 
        }}>
          {badge}
        </span>

        {/* Fixed Profile Circle with Dead-Center Alignment */}
        <div style={{ width: '80px', height: '80px', margin: '0 auto 14px auto' }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={student.name}
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                border: `3px solid ${badgeColor}`, 
                backgroundColor: colors.bgInput
              }}
            />
          ) : (
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: isDark ? '#1e293b' : '#0f172a',
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center', // Typo Fixed: 'justify' -> 'justifyContent'
              border: `3px solid ${badgeColor}`,
              margin: '0 auto',
              boxSizing: 'border-box',
              lineHeight: 1
            }}>
              {getInitials(student.name)}
            </div>
          )}
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px 0', color: colors.textMain }}>
          {student.name}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
          {student.batch_name && (
            <span style={{ backgroundColor: isDark ? '#0369a122' : '#f0f9ff', border: `1px solid ${isDark ? '#0284c7' : '#e0f2fe'}`, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: '#38bdf8' }}>
              {student.batch_name}
            </span>
          )}
          {student.student_id && (
            <span style={{ backgroundColor: colors.bgInput, border: `1px solid ${colors.border}`, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: colors.textSub }}>
              {student.student_id}
            </span>
          )}
        </div>

        <p style={{ fontSize: '13px', color: badgeColor, fontWeight: '700', margin: '6px 0 0 0' }}>
          ⚡ {student.calculated_score || 0}% Score
        </p>
      </div>

      <div style={{ marginTop: '18px', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
        <button
          onClick={() => onShare(student)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '100px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.bgInput,
            color: colors.textSub,
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Share2 size={14} /> Share Achievement
        </button>
      </div>
    </div>
  );
}
