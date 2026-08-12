import { useEffect, useState } from 'react';
import ProfileEdit from '../components/dashboard/ProfileEdit';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import TopNav from '../components/dashboard/TopNav';
import TodayPanel from '../components/dashboard/TodayPanel';
import ScheduleView from '../components/dashboard/ScheduleView';
import OverviewCard from '../components/dashboard/OverviewCard';
import ProgressRing from '../components/dashboard/ProgressRing';
import Leaderboard from '../components/dashboard/Leaderboard';
import TasksSection from '../components/dashboard/TasksSection';
import { ResourcesSection, DocumentsSection } from '../components/dashboard/ResourcesDocuments';
import SupportSection from '../components/dashboard/SupportSection';
import NotificationBell from '../components/dashboard/NotificationBell';
import ForcePasswordChange from '../components/ForcePasswordChange';
import ForcePhoneModal from '../components/ForcePhoneModal';
import './dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [streak, setStreak] = useState(1);
  const [isPremium, setIsPremium] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [forcePhone, setForcePhone] = useState(false);
  const [certificateOrder, setCertificateOrder] = useState(null);
  
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [showProfileSelector, setShowProfileSelector] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  useEffect(() => {
    if (student) {
      const isAlias = student.email && student.email.includes('+');
      if (!student.phone && !isAlias) {
        setForcePhone(true);
      }
    }
  }, [student]);

  // ✅ FIXED: Directly uses API's accurate 10-student Leaderboard data
  const loadDashboardData = async (stud, email) => {
    setLeaderboardLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const resp = await fetch(`/api/get-student-data?profileEmail=${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${currentSession?.access_token}` }
      });
      const dashData = await resp.json();
      
      if (resp.ok) {
        setTasks(dashData.tasks || []);
        setResources(dashData.resources || []);
        setAnnouncements(dashData.announcements || []);
        setSessions(dashData.sessions || []);
        setIsPremium(dashData.isPremium || false);
        setStreak(dashData.streak || 1);
        setCertificateOrder(dashData.certificateOrder || null);
        
        // ✅ Sets the unified Top 10 combined leaderboard directly from backend API
        setLeaderboard(dashData.leaderboard || []);
      } else {
        console.error('Failed to fetch dashboard data:', dashData.error);
      }
    } catch (e) { 
      console.error('Dashboard data fetch error:', e); 
    } finally {
      setLeaderboardLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    let authSub;
    (async () => {
      if (!isSupabaseConfigured()) { setLoading(false); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const email = session.user.email.toLowerCase();
      
      try {
        const res = await fetch(`/api/get-profiles?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        const studRows = data.profiles || [];

        if (!res.ok || studRows.length === 0) { 
          await supabase.auth.signOut(); navigate('/login'); return; 
        }

        if (studRows.length === 1) {
          setStudent(studRows[0]);
          loadDashboardData(studRows[0], studRows[0].email);
        } else {
          setAvailableProfiles(studRows);
          setShowProfileSelector(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch profiles:', err);
        await supabase.auth.signOut(); navigate('/login'); return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
          navigate('/login');
        }
      });
      authSub = subscription;
    })();
    return () => { authSub?.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectProfile = (profile) => {
    setShowProfileSelector(false);
    setLoading(true);
    setStudent(profile);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadDashboardData(profile, profile.email);
      }
    });
  };

  const callUpdateTask = async (body) => {
    const { data: { session: s } } = await supabase.auth.getSession();
    return fetch('/api/update-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s?.access_token}` },
      body: JSON.stringify({ ...body, studentEmail: student.email })
    });
  };

  const handleToggleTask = async (taskId, isCompleted) => {
    try {
      const resp = await callUpdateTask({ taskId, isCompleted });
      if (!resp.ok) { const d = await resp.json(); console.error(d.error); return; }
      const updated = tasks.map((t) => (t.id === taskId ? { ...t, is_completed: isCompleted } : t));
      setTasks(updated);
    } catch (e) { console.error(e); }
  };

  const handleSubmitTask = async (taskId, link) => {
    try {
      const resp = await callUpdateTask({ taskId, submissionLink: link });
      if (!resp.ok) { const d = await resp.json(); alert(d.error || 'Submission failed.'); return; }
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, submission_link: link, is_completed: true } : t)));
    } catch (e) {
      console.error(e);
      alert('Submission failed. Please try again.');
    }
  };

  const handleDeleteSubmission = async (taskId) => {
    try {
      const resp = await callUpdateTask({ taskId, clearSubmission: true });
      if (!resp.ok) { const d = await resp.json(); alert(d.error || 'Failed to delete submission.'); return; }
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, submission_link: null, is_completed: false } : t)));
    } catch (e) {
      console.error(e);
      alert('Failed to delete submission. Please try again.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const toggleTheme = () => setTheme((t) => { const next = t === 'dark' ? 'light' : 'dark'; localStorage.setItem('theme', next); return next; });

  if (loading) return <div className="dashboard-loading">Loading dashboard…</div>;

  if (showProfileSelector) {
    return (
      <div className="dashboard-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="card" style={{ padding: '40px', maxWidth: '600px', width: '90%', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--step-3)', marginBottom: '10px' }}>Select Your Profile</h2>
          <p className="text-muted" style={{ marginBottom: '30px' }}>It looks like you are enrolled in multiple domains. Which one would you like to access today?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {availableProfiles.map((p) => (
              <button 
                key={p.id} 
                className="btn btn-outline" 
                style={{ justifyContent: 'flex-start', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'left' }}
                onClick={() => handleSelectProfile(p)}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', color: 'var(--text)' }}>{p.domain}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.batch_name} • {p.full_name}</p>
                </div>
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" style={{ marginTop: '30px' }} onClick={handleLogout}>Log Out</button>
        </div>
      </div>
    );
  }

  if (!student) return null;

  const isAlias = student.email.includes('+');

  if (student.must_change_password && !isAlias) {
    return (
      <ForcePasswordChange
        open={true}
        table="students"
        rowId={student.id}
        onDone={() => setStudent((s) => ({ ...s, must_change_password: false }))}
      />
    );
  }

  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
    <div className="dashboard-body">
      <TopNav
        student={student} isPremium={isPremium} activeTab={activeTab} setActiveTab={setActiveTab}
        streak={streak} theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout}
        notifBell={<NotificationBell announcements={announcements} batchName={student.batch_name} />}
        availableProfiles={availableProfiles}
        onSwitchProfile={() => setShowProfileSelector(true)}
      />

      <main className="db-tab-content">
        {student.status === 'Inactive' && (
          <div style={{ background: 'var(--err-tint)', color: 'var(--err-500)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--err-500)' }}>
            <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ Account Suspended</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Your internship account has been marked as Inactive. You can no longer submit tasks, download certificates, or view new updates. If you believe this is a mistake, please contact support.</p>
          </div>
        )}
        {activeTab === 'today' && (
          <>
            <TodayPanel student={student} sessions={sessions} tasks={tasks} />
            <div className="db-content-grid">
              <OverviewCard student={student} />
              <ProgressRing completed={completedCount} total={tasks.length} />
            </div>
            <Leaderboard rows={leaderboard} loading={leaderboardLoading} currentEmail={student.email} />
          </>
        )}
        {activeTab === 'schedule' && <ScheduleView sessions={sessions} tasks={tasks} />}
        {activeTab === 'tasks' && <TasksSection tasks={tasks} onToggle={handleToggleTask} onSubmit={handleSubmitTask} onDeleteSubmission={handleDeleteSubmission} />}
        {activeTab === 'resources' && <ResourcesSection resources={resources} />}
        {activeTab === 'documents' && <DocumentsSection student={student} certificateOrder={certificateOrder} />}
        {activeTab === 'support' && <SupportSection student={student} />}
        {activeTab === 'profile' && <ProfileEdit student={student} onUpdate={(s) => setStudent(s)} />}
      </main>
      
      <ForcePhoneModal 
        open={forcePhone} 
        studentEmail={student.email} 
        onDone={(newPhone) => {
          setStudent(prev => ({ ...prev, phone: newPhone }));
          setForcePhone(false);
        }} 
      />
    </div>
  );
}
