import { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, ListChecks, ExternalLink } from 'lucide-react';
import Modal from '../Modal';

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function ScheduleView({ sessions, tasks }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSession, setSelectedSession] = useState(null);

  const base = startOfWeek(new Date());
  base.setDate(base.getDate() + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return d;
  });

  const itemsForDay = (day) => {
    const dayStr = day.toDateString();
    const daySessions = sessions.filter((s) => new Date(s.session_date).toDateString() === dayStr);
    const dayTasks = tasks.filter((t) => t.due_date && new Date(t.due_date).toDateString() === dayStr);
    return { daySessions, dayTasks };
  };

  const isToday = (d) => d.toDateString() === new Date().toDateString();

  return (
    <section className="schedule-view card">
      <div className="schedule-header">
        <h3>Weekly Schedule</h3>
        <div className="schedule-nav">
          <button className="icon-btn" onClick={() => setWeekOffset((w) => w - 1)}><ChevronLeft size={16} /></button>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            {days[0].toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {days[6].toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </span>
          <button className="icon-btn" onClick={() => setWeekOffset((w) => w + 1)}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="schedule-grid">
        {days.map((day) => {
          const { daySessions, dayTasks } = itemsForDay(day);
          return (
            <div className={`schedule-day ${isToday(day) ? 'is-today' : ''}`} key={day.toISOString()}>
              <div className="schedule-day-head">
                <span className="schedule-day-name">{day.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                <span className="schedule-day-num">{day.getDate()}</span>
              </div>
              <div className="schedule-day-body">
                {daySessions.map((s) => (
                  <div 
                    className="schedule-chip schedule-chip-session" 
                    key={s.id} 
                    title={s.title}
                    onClick={() => setSelectedSession(s)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Video size={11} /> {s.start_time?.slice(0, 5)} {s.title}
                  </div>
                ))}
                {dayTasks.map((t) => (
                  <div className="schedule-chip schedule-chip-task" key={t.id} title={t.task_title}>
                    <ListChecks size={11} /> {t.task_title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!selectedSession} onClose={() => setSelectedSession(null)}>
        {selectedSession && (
          <div>
            <h2>{selectedSession.title}</h2>
            <div style={{ marginTop: 12, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.95rem' }}>
              <div><strong>Date:</strong> {new Date(selectedSession.session_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div><strong>Time:</strong> {selectedSession.start_time?.slice(0, 5)} ({selectedSession.duration_minutes} mins)</div>
              
              {selectedSession.meet_link && (
                <div style={{ marginTop: 16 }}>
                  <a href={selectedSession.meet_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-block">
                    <Video size={14} style={{ marginRight: 6 }} /> Join Live Session
                  </a>
                </div>
              )}

              {(selectedSession.resource_link || selectedSession.resource_file_url) && (
                <div style={{ marginTop: 16, background: 'var(--surface-2)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Session Resources</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedSession.resource_link && (
                      <a href={selectedSession.resource_link} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)' }}>
                        <ExternalLink size={14} /> Reference Link
                      </a>
                    )}
                    {selectedSession.resource_file_url && (
                      <a href={selectedSession.resource_file_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)' }}>
                        <ExternalLink size={14} /> Download File / Document
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
