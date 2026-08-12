import { Video, Clock, CalendarClock, ArrowRight, FileText, ExternalLink } from 'lucide-react';

function isToday(dateStr) {
  const d = new Date(dateStr);
  const t = new Date();
  return d.toDateString() === t.toDateString();
}

export default function TodayPanel({ student, sessions, tasks }) {
  const todaySession = sessions.find((s) => isToday(s.session_date));
  const upcomingSession = sessions
    .filter((s) => new Date(s.session_date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.session_date) - new Date(b.session_date))[0];

  const dueSoon = tasks
    .filter((t) => !t.is_completed && t.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <section className="today-panel card">
      <div className="today-greeting">
        <span className="eyebrow">Today · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        <h1>{greeting}, {student.name.split(' ')[0]}</h1>
      </div>

      <div className="today-grid">
        <div className="today-class-card">
          {todaySession ? (
            <>
              <span className="today-tag today-tag-live"><Video size={13} /> Live Today</span>
              <h3>{todaySession.title}</h3>
              <p className="text-muted"><Clock size={13} style={{ verticalAlign: -2 }} /> {todaySession.start_time?.slice(0, 5)} · {todaySession.duration_minutes} min</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {todaySession.meet_link && (
                  <a href={todaySession.meet_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                    Join Class <ArrowRight size={14} />
                  </a>
                )}
                {todaySession.resource_file_url && (
                  <a href={todaySession.resource_file_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                    <FileText size={14} /> View File
                  </a>
                )}
                {todaySession.resource_link && (
                  <a href={todaySession.resource_link} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                    <ExternalLink size={14} /> Open Link
                  </a>
                )}
              </div>
            </>
          ) : upcomingSession ? (
            <>
              <span className="today-tag"><CalendarClock size={13} /> Next Class</span>
              <h3>{upcomingSession.title}</h3>
              <p className="text-muted">
                {new Date(upcomingSession.session_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {upcomingSession.start_time?.slice(0, 5)}
              </p>
            </>
          ) : (
            <>
              <span className="today-tag"><CalendarClock size={13} /> Schedule</span>
              <h3>No classes scheduled yet</h3>
              <p className="text-muted">Check back soon, or reach out to your mentor.</p>
            </>
          )}
        </div>

        <div className="today-tasks-card">
          <h4>Due Soon</h4>
          {dueSoon.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Nothing due — you're all caught up 🎉</p>
          ) : (
            <ul className="today-task-list">
              {dueSoon.map((t) => (
                <li key={t.id}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)' }}></span>
                    {t.task_title}
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {new Date(t.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
