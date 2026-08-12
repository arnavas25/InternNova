import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationBell({ announcements, batchName }) {
  const [open, setOpen] = useState(false);
  const [lastRead, setLastRead] = useState(() => parseInt(localStorage.getItem(`last_read_announcement_${batchName}`) || '0'));
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('click', onClickOutside);
    return () => window.removeEventListener('click', onClickOutside);
  }, []);

  const unreadCount = announcements.filter((a) => new Date(a.created_at).getTime() > lastRead).length;

  const markAllRead = () => {
    if (announcements.length === 0) return;
    const newest = new Date(announcements[0].created_at).getTime();
    localStorage.setItem(`last_read_announcement_${batchName}`, String(newest));
    setLastRead(newest);
  };

  return (
    <div className="noti-container" ref={ref}>
      <button className="icon-btn noti-bell" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); if (!open) markAllRead(); }}>
        <Bell size={17} />
        {unreadCount > 0 && <span className="noti-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="noti-dropdown card" onClick={(e) => e.stopPropagation()}>
          <div className="noti-header">
            <h3>Announcements</h3>
            <button className="noti-mark-read" onClick={markAllRead}>Mark all read</button>
          </div>
          <div className="noti-list">
            {announcements.length === 0 ? (
              <p className="text-muted" style={{ padding: '14px 0', textAlign: 'center' }}>No announcements found for {batchName}.</p>
            ) : announcements.map((ann) => (
              <div className={`noti-item ${new Date(ann.created_at).getTime() > lastRead ? 'is-unread' : ''}`} key={ann.id || ann.created_at}>
                <p>{ann.message}</p>
                <span className="noti-time">{new Date(ann.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
