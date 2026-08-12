import { Star, ShieldHalf, Trophy, Crown } from 'lucide-react';

const MILESTONES = [[25, Star], [50, ShieldHalf], [75, Trophy], [100, Crown]];
const RADIUS = 50;
const CIRC = 2 * Math.PI * RADIUS;

export default function ProgressRing({ completed, total }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const offset = CIRC - (percentage / 100) * CIRC;

  return (
    <section className="db-card card progress-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Overall Progress</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', width: '100%' }}>
        {/* Circle Progress Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative' }}>
          <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }} viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke="var(--surface-2)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="8"
                strokeDasharray={`${CIRC} ${CIRC}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.35s' }}
              />
            </svg>
            <div style={{ position: 'absolute', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
              {percentage}%
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {completed} / {total} Tasks Completed
          </span>
        </div>

        {/* Milestones Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, width: '100%' }}>
          {MILESTONES.map(([pct, Icon]) => {
            const unlocked = percentage >= pct;
            return (
              <div
                key={pct}
                title={`Completed ${pct}% of tasks`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 4px',
                  borderRadius: 'var(--radius-sm)',
                  background: unlocked ? 'var(--accent-tint)' : 'var(--surface-2)',
                  border: `1px solid ${unlocked ? 'var(--accent)' : 'var(--border)'}`,
                  opacity: unlocked ? 1 : 0.45,
                  transition: 'all 0.2s var(--ease)'
                }}
              >
                <div style={{ color: unlocked ? 'var(--accent)' : 'var(--text-faint)' }}>
                  <Icon size={16} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
