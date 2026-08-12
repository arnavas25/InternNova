import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { APPLY_FORM_URL } from '../lib/programs';
import { Calendar, Users, ArrowRight, Briefcase, Clock, Flame, Sparkles } from 'lucide-react';
import Reveal from '../components/Reveal';
import './batches.css';

// --- Mobile Responsive Countdown Component ---
function BatchCountdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div style={{
      display: 'flex',
      gap: '6px',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '10px',
      fontSize: '0.88rem',
      fontWeight: 'bold',
      color: '#e11d48',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Clock size={16} />
        <span>Starts In:</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ background: '#ffe4e6', padding: '3px 8px', borderRadius: '6px', minWidth: '32px', textAlign: 'center' }}>{timeLeft.days}d</span>:
        <span style={{ background: '#ffe4e6', padding: '3px 8px', borderRadius: '6px', minWidth: '32px', textAlign: 'center' }}>{timeLeft.hours}h</span>:
        <span style={{ background: '#ffe4e6', padding: '3px 8px', borderRadius: '6px', minWidth: '32px', textAlign: 'center' }}>{timeLeft.minutes}m</span>:
        <span style={{ background: '#ffe4e6', padding: '3px 8px', borderRadius: '6px', minWidth: '32px', textAlign: 'center' }}>{timeLeft.seconds}s</span>
      </div>
    </div>
  );
}

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBatches() {
      try {
        const { data, error } = await supabase
          .from('batches')
          .select('*')
          .order('start_date', { ascending: true });
        
        if (error) throw error;
        setBatches(data || []);
      } catch (err) {
        console.error('Error fetching batches:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBatches();
  }, []);

  // Filter next active upcoming batch
  const nextBatch = batches.find(b => {
    const isFuture = new Date(b.start_date) > new Date();
    const statusLower = (b.status || '').toLowerCase();
    const isClosed = statusLower.includes('closed') || statusLower.includes('progress') || statusLower.includes('full');
    
    return isFuture && !isClosed;
  });

  // Date formatting helper function
  const formatBatchDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="page-top">
      <section className="section dot-grid" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Reveal delay={100} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Eyebrow badge centered */}
            <span className="eyebrow" style={{ display: 'inline-block', margin: '0 auto' }}>
              Schedule
            </span>

            {/* Heading centered */}
            <h1 style={{ 
              fontSize: 'var(--step-5)', 
              margin: '16px 0', 
              textAlign: 'center',
              width: '100%' 
            }}>
              Upcoming Batches
            </h1>

            {/* Subtext centered */}
            <p className="text-muted" style={{ maxWidth: 600, margin: '0 auto 24px auto', fontSize: 'var(--step-1)', textAlign: 'center' }}>
              Check our schedule and enroll in a batch that fits your academic calendar.
            </p>

            {/* Smart Dynamic Banner with Exact Date */}
            {nextBatch ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(225, 29, 72, 0.04)',
                border: '1px solid rgba(225, 29, 72, 0.2)',
                padding: '12px 20px',
                borderRadius: '16px',
                maxWidth: '90%',
                width: 'fit-content',
                margin: '0 auto'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', color: '#e11d48', fontWeight: '600', fontSize: '0.92rem', textAlign: 'center' }}>
                  <Flame size={18} /> Next Batch Starts On {formatBatchDate(nextBatch.start_date)}!
                </div>
                <BatchCountdown targetDate={nextBatch.start_date} />
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
                background: 'rgba(99, 102, 241, 0.06)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                padding: '12px 24px',
                borderRadius: '16px',
                color: '#4f46e5',
                fontWeight: '600',
                fontSize: '0.95rem',
                textAlign: 'center',
                maxWidth: '90%',
                margin: '0 auto'
              }}>
                <Sparkles size={18} /> All current cohorts filled! New batch announced soon.
              </div>
            )}
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 900 }}>
          {loading ? (
            <div className="batches-grid">
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: '60px 0' }}>
              No upcoming batches scheduled at the moment.
            </div>
          ) : (
            <div className="batches-grid">
              {batches.map((b, i) => {
                const start = new Date(b.start_date);
                const isFuture = start > new Date();
                const statusLower = (b.status || '').toLowerCase();
                const isClosed = statusLower.includes('closed') || statusLower.includes('progress') || statusLower.includes('full');
                
                const isEnrollable = isFuture && !isClosed;

                // Seat calculation from Supabase columns
                const totalSeats = b.total_seats || 100;
                const filledSeats = b.filled_seats || 0;
                const remainingSeats = totalSeats - filledSeats;

                return (
                  <Reveal key={b.id || i} delay={i * 100} className="card batch-card">
                    <div className="batch-date">
                      <div className="batch-month">{start.toLocaleString('default', { month: 'short' })}</div>
                      <div className="batch-day">{start.getDate()}</div>
                    </div>
                    
                    <div className="batch-info">
                      <h3>{b.batch_name || b.name || 'Upcoming Batch'}</h3>
                      <div className="batch-meta">
                        {b.domain && <span><Briefcase size={14} /> {b.domain}</span>}
                        <span><Calendar size={14} /> 6 Weeks Duration</span>
                        <span>
                          <Users size={14} /> {remainingSeats > 0 ? `${remainingSeats} Seats Left` : 'Seats Full'}
                        </span>
                      </div>
                    </div>

                    <div className="batch-action">
                      {isEnrollable ? (
                        <a href={APPLY_FORM_URL} className="btn btn-outline btn-sm">
                          Enroll <ArrowRight size={14} />
                        </a>
                      ) : (
                        <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                          {b.status || 'Closed'}
                        </span>
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
