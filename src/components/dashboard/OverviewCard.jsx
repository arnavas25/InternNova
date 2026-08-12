export default function OverviewCard({ student }) {
  const start = new Date(student.batch_start_date);
  const end = new Date(student.batch_end_date);
  const opts = { day: '2-digit', month: 'short', year: 'numeric' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(start); s.setHours(0, 0, 0, 0);
  const e = new Date(end); e.setHours(0, 0, 0, 0);

  const totalDuration = e - s;
  const timeElapsed = today - s;
  let progressPercent = 0, labelText = '';

  if (today < s) {
    progressPercent = 0;
    const daysToStart = Math.ceil((s - today) / 86400000);
    labelText = `Starts in ${daysToStart} days`;
  } else if (today > e) {
    progressPercent = 100;
    labelText = 'Completed';
  } else {
    progressPercent = Math.min(Math.max((timeElapsed / totalDuration) * 100, 0), 100);
    const daysRemaining = Math.ceil((e - today) / 86400000);
    labelText = `${daysRemaining} days remaining`;
  }

  return (
    <section id="overview-section" className="db-card card overview-card grid-col-2">
      <div className="overview-content">
        <h2>Welcome back, {student.name.split(' ')[0]}! 👋</h2>
        <p className="batch-subtitle">
          Batch: <span className="highlight-text">{student.batch_name}</span> | Domain: <span className="highlight-text">{student.domain}</span>
        </p>
        <div className="batch-dates" style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--surface-2)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', width: 'fit-content', border: '1px solid var(--border)', marginTop: 12 }}>
          <div className="date-item" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="date-label" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Start Date</span>
            <span className="date-value" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>{start.toLocaleDateString('en-IN', opts)}</span>
          </div>
          <div className="date-arrow" style={{ color: 'var(--accent)', fontSize: '1rem', padding: '0 4px' }}>→</div>
          <div className="date-item" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="date-label" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>End Date</span>
            <span className="date-value" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>{end.toLocaleDateString('en-IN', opts)}</span>
          </div>
        </div>
        <div className="progress-bar-container" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
          <div className="progress-labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>Duration Progress</span>
            <span>{labelText}</span>
          </div>
          <div className="progress-track" style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div className="progress-fill" style={{ height: '100%', background: 'var(--accent)', borderRadius: 4, width: `${progressPercent}%`, transition: 'width 0.4s var(--ease)' }} />
          </div>
        </div>
      </div>
      <div className="overview-badge-area">
        <span className={`badge status-badge status-${student.status.toLowerCase()}`}>{student.status}</span>
      </div>
    </section>
  );
}
