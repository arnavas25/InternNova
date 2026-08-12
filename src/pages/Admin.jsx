import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartLine, GraduationCap, Users, BookOpen, ListChecks, Megaphone, CalendarDays, Settings as SettingsIcon, LogOut, Sun, Moon, CreditCard, Menu, X, Package, Mail } from 'lucide-react';
import StudentsTable from '../components/admin/StudentsTable';
import StaffTable from '../components/admin/StaffTable';
import ResourcesTable from '../components/admin/ResourcesTable';
import TasksTable from '../components/admin/TasksTable';
import AnnouncementsTable from '../components/admin/AnnouncementsTable';
import SessionsTable from '../components/admin/SessionsTable';
import EnrollmentsTable from '../components/admin/EnrollmentsTable';
import TeamTable from '../components/admin/TeamTable';
import CertificatesTable from '../components/admin/CertificatesTable';
import CertificateOrdersTable from '../components/admin/CertificateOrdersTable';
import PremiumAppsTable from '../components/admin/PremiumAppsTable';
import PremiumStudentsTable from '../components/admin/PremiumStudentsTable';
import NewsletterTable from '../components/admin/NewsletterTable';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import './admin.css';

const PAGES = [
  ['dashboard', ChartLine, 'Dashboard'],
  ['students', GraduationCap, 'Students'],
  ['staff', Users, 'Staff'],
  ['team', Users, 'Team Members'],
  ['resources', BookOpen, 'Resources'],
  ['tasks', ListChecks, 'Tasks'],
  ['announcements', Megaphone, 'Announcements'],
  ['sessions', CalendarDays, 'Sessions'],
  ['newsletter', Mail, 'Newsletter'],
  ['premium-apps', ListChecks, 'Premium Apps'],
  ['premium-students', GraduationCap, 'Premium Students'],
  ['enrollments', CreditCard, 'Course Students'],
  ['certificates', GraduationCap, 'Certificates'],
  ['cert-orders', Package, 'Cert Orders'],
  ['settings', SettingsIcon, 'Settings'],
];

export default function Admin() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('adminTheme') || 'dark');
  const [counts, setCounts] = useState({ students: 0, staff: 0, tasks: 0, resources: 0, sessions: 0, enrollments: 0 });

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  useEffect(() => {
    (async () => {
      try {
        if (!isSupabaseConfigured()) { setChecking(false); return; }
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) { 
          // Do not alert here, just normal redirect if no session
          navigate('/staff-login'); 
          return; 
        }

        const { data: staffRow, error: staffError } = await supabase.from('staff_users').select('*').eq('email', session.user.email).single();
        if (staffError || !staffRow) {
          console.error("Staff lookup failed:", staffError);
          alert("Error loading staff profile: " + (staffError?.message || "Not found"));
          await supabase.auth.signOut();
          navigate('/staff-login');
          return;
        }
        if (!['super_admin', 'admin', 'mentor'].includes(staffRow.role)) {
          alert('Access Denied: You do not have admin permissions.');
          await supabase.auth.signOut();
          navigate('/staff-login');
          return;
        }
        setStaff(staffRow);
      } catch (err) {
        console.error("Admin check failed", err);
        alert("Unexpected error: " + err.message);
        navigate('/staff-login');
      } finally {
        setChecking(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCounts = async () => {
    if (!isSupabaseConfigured()) return;
    const [students, staffCount, tasksData, resources, liveSessions, enrollmentsCount] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('staff_users').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('task_title, domain, batch_name, week_number'),
      supabase.from('resources').select('*', { count: 'exact', head: true }),
      supabase.from('live_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    ]);

    const uniqueTasksCount = tasksData.data ? new Set(tasksData.data.map(t => `${t.task_title}|${t.domain}|${t.batch_name}|${t.week_number}`)).size : 0;

    setCounts({
      students: students.count || 0, staff: staffCount.count || 0,
      tasks: uniqueTasksCount, resources: resources.count || 0,
      sessions: liveSessions.count || 0, enrollments: enrollmentsCount.count || 0
    });
  };

  useEffect(() => {
    if (checking || !staff) return;
    loadCounts();
    const id = setInterval(loadCounts, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, staff]);

  const handleLogout = async () => {
    if (!confirm('Logout from Admin Panel?')) return;
    await supabase.auth.signOut();
    navigate('/staff-login');
  };

  const toggleTheme = () => setTheme((t) => { const next = t === 'dark' ? 'light' : 'dark'; localStorage.setItem('adminTheme', next); return next; });

  if (checking) return <div className="admin-loading">Checking access…</div>;
  if (!staff) return <div className="admin-loading">Admin database not connected.</div>;

  return (
    <div className="admin-container">
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-row">
          <div className="admin-sidebar-head">
            <img src="/logo.png" alt="InternNova" className="admin-sidebar-logo" />
            <span className="admin-role-tag">{staff.role === 'super_admin' ? 'Super Admin' : staff.role === 'mentor' ? 'Mentor' : 'Admin'}</span>
          </div>
          <button className="admin-mobile-toggle" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <ul className="admin-menu">
          {PAGES.map(([key, Icon, label]) => {
            if (staff.role === 'mentor' && ['staff', 'settings', 'newsletter'].includes(key)) return null;
            
            const superAdminOnly = ['team', 'premium-apps', 'premium-students', 'enrollments', 'certificates', 'cert-orders'];
            if (superAdminOnly.includes(key) && staff.role !== 'super_admin') return null;

            return (
              <li key={key} className={`admin-menu-item ${page === key ? 'is-active' : ''}`} onClick={() => { setPage(key); setMobileOpen(false); }}>
                <Icon size={16} /> <span>{label}</span>
              </li>
            );
          })}
        </ul>
        <button className="admin-logout-btn" onClick={handleLogout}><LogOut size={15} /> Logout</button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Welcome, <span>{staff.full_name}</span> 👋</h1>
            <p className="text-muted">InternNova Administration Panel</p>
          </div>
          <button className="icon-btn" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
        </header>

        {page === 'dashboard' && (
          <section className="admin-section">
            <div className="admin-cards">
              <div className="admin-card"><h2>{counts.students}</h2><p>Total Students</p></div>
              {staff.role !== 'mentor' && <div className="admin-card"><h2>{counts.staff}</h2><p>Total Staff</p></div>}
              <div className="admin-card"><h2>{counts.tasks}</h2><p>Total Tasks</p></div>
              <div className="admin-card"><h2>{counts.resources}</h2><p>Total Resources</p></div>
              <div className="admin-card"><h2>{counts.sessions}</h2><p>Live Sessions</p></div>
              {staff.role !== 'mentor' && <div className="admin-card"><h2>{counts.enrollments}</h2><p>Course Students</p></div>}
            </div>
            <div className="admin-welcome card">
              <h2>Welcome Back 👋</h2>
              <p className="text-muted">Manage students, {staff.role !== 'mentor' && 'staff, '}internship domains, tasks, announcements and resources from one place.</p>
            </div>
          </section>
        )}

        {page === 'students' && <StudentsTable onChange={loadCounts} currentUser={staff} />}
        {page === 'staff' && <StaffTable onChange={loadCounts} currentUser={staff} />}
        {page === 'team' && <TeamTable />}
        {page === 'resources' && <ResourcesTable onChange={loadCounts} currentUser={staff} />}
        {page === 'tasks' && <TasksTable onChange={loadCounts} currentUser={staff} />}
        {page === 'announcements' && <AnnouncementsTable currentUser={staff} />}
        {page === 'sessions' && <SessionsTable onChange={loadCounts} />}
        {page === 'newsletter' && <NewsletterTable currentUser={staff} />}
        {page === 'premium-apps' && <PremiumAppsTable currentUser={staff} />}
        {page === 'premium-students' && <PremiumStudentsTable currentUser={staff} onChange={loadCounts} />}
        {page === 'enrollments' && <EnrollmentsTable onChange={loadCounts} />}
        {page === 'certificates' && <CertificatesTable />}
        {page === 'cert-orders' && <CertificateOrdersTable />}

        {page === 'settings' && (
          <section className="admin-section">
            <div className="admin-section-head">
              <h2>System Settings</h2>
            </div>
            <div className="settings-grid">
              <div className="setting-card card">
                <h3>System</h3>
                <p className="text-muted">InternNova Administration Panel</p>
              </div>
              <div className="setting-card card">
                <h3>Current User</h3>
                <p className="text-muted">{staff.full_name}</p>
              </div>
              <div className="setting-card card">
                <h3>Theme</h3>
                <button className="btn btn-primary btn-sm" onClick={toggleTheme}>Toggle Theme</button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
