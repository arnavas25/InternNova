import { Gauge, CalendarDays, ListChecks, BookOpenText, FileText, CircleHelp, LogOut, Sun, Moon, Flame, Menu, X, User, Users } from 'lucide-react';
import { useState } from 'react';

const TABS = [
  ['today', Gauge, 'Today'],
  ['schedule', CalendarDays, 'Schedule'],
  ['tasks', ListChecks, 'Tasks'],
  ['resources', BookOpenText, 'Resources'],
  ['documents', FileText, 'Certificates'],
  ['support', CircleHelp, 'Support'],
];

export default function TopNav({ student, isPremium, activeTab, setActiveTab, streak, theme, toggleTheme, onLogout, notifBell, availableProfiles, onSwitchProfile }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = student?.name ? student.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'IN';

  return (
    <>
      <header className="db-topnav">
        <div className="db-topnav-row">
          <div className="db-topnav-brand">
            <img src="/logo.png" alt="InternNova" />
          </div>

          <nav className="db-tabs db-tabs-desktop">
            {TABS.map(([key, Icon, label]) => (
              <button key={key} className={`db-tab-btn ${activeTab === key ? 'is-active' : ''}`} onClick={() => setActiveTab(key)} title={label}>
                <Icon size={15} /> <span className="db-tab-label">{label}</span>
              </button>
            ))}
          </nav>

          <div className="db-topnav-actions">

            {notifBell}
            {availableProfiles?.length > 1 && (
              <button className="icon-btn" onClick={onSwitchProfile} title="Switch Profile"><Users size={16} /></button>
            )}
            <button className="icon-btn" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <div className="db-profile-chip" onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer' }} title="View Profile">
              <div className="avatar-fallback avatar-fallback-sm">{initials}</div>
              <div className="db-profile-chip-text">
                <strong>{student?.name?.split(' ')[0]}</strong>
                {isPremium && <span className="premium-badge">⭐</span>}
              </div>
            </div>
            <button className="icon-btn desktop-only" onClick={onLogout} title="Logout"><LogOut size={16} /></button>
            <button className="icon-btn db-mobile-menu-btn" onClick={() => setMobileOpen((v) => !v)}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <nav className="db-tabs db-tabs-mobile">
          {TABS.map(([key, Icon, label]) => (
            <button key={key} className={`db-tab-btn ${activeTab === key ? 'is-active' : ''}`} onClick={() => { setActiveTab(key); setMobileOpen(false); }}>
              <Icon size={16} /> {label}
            </button>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>
          <button className={`db-tab-btn ${activeTab === 'profile' ? 'is-active' : ''}`} onClick={() => { setActiveTab('profile'); setMobileOpen(false); }}>
            <User size={16} /> Profile
          </button>
          <button className="db-tab-btn" onClick={onLogout} style={{ color: 'var(--err-500)' }}>
            <LogOut size={16} /> Logout
          </button>
        </nav>
      )}
    </>
  );
}
