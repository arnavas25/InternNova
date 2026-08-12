import { getAdminClient } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();

  // Verify the request comes from an authenticated user
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid session' });

  const { profileEmail } = req.query;
  if (!profileEmail) return res.status(400).json({ error: 'Missing profileEmail' });

  const cleanProfileEmail = profileEmail.toLowerCase().trim();
  const authEmail = userData.user.email.toLowerCase();

  // Security: only allow fetching data for profiles that belong to this user
  const [authName] = authEmail.split('@');
  if (!cleanProfileEmail.startsWith(authName)) {
    return res.status(403).json({ error: 'Forbidden: profile does not belong to this user' });
  }

  try {
    // Fetch the student profile
    const { data: student } = await admin.from('students').select('*').eq('email', cleanProfileEmail).maybeSingle();
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const domain = student.domain;
    const batchName = student.batch_name;

    // Batch 1: Fast, user-specific data
    const pTasks = admin.from('tasks').select('*').eq('student_email', cleanProfileEmail).order('week_number', { ascending: true }).order('created_at', { ascending: true });
    const pResources = student.status !== 'Inactive' ? admin.from('resources').select('*').or(`domain.eq."${domain}",domain.eq.All`).or(`batch_name.eq."${batchName}",batch_name.is.null,batch_name.eq.`) : Promise.resolve({ data: [] });
    const pAnnouncements = student.status !== 'Inactive' ? admin.from('announcements').select('*').or(`target.eq.All,target.eq."${domain}"`).or(`batch_name.eq."${batchName}",batch_name.is.null,batch_name.eq.,batch_name.eq.All`).order('created_at', { ascending: false }).limit(10) : Promise.resolve({ data: [] });
    const pSessions = student.status !== 'Inactive' ? admin.from('live_sessions').select('*').eq('batch_name', batchName).order('session_date', { ascending: true }) : Promise.resolve({ data: [] });
    const pEnrollment = admin.from('enrollments').select('plan').eq('email', cleanProfileEmail).eq('plan', 'premium').maybeSingle();
    const pStreakRow = admin.from('login_streaks').select('*').eq('student_email', cleanProfileEmail).maybeSingle();
    const pCertOrder = admin.from('certificate_orders').select('*').eq('student_email', cleanProfileEmail).eq('domain', domain).eq('batch_name', batchName).maybeSingle();

    const [
      { data: tasks, error: e1 },
      { data: resData, error: e2 },
      { data: annData, error: e3 },
      { data: sessDataRaw, error: e4 },
      { data: enrollment, error: e5 },
      { data: streakRow, error: e6 },
      { data: certOrder, error: e7 }
    ] = await Promise.all([pTasks, pResources, pAnnouncements, pSessions, pEnrollment, pStreakRow, pCertOrder]);

    if (e1) console.error('Tasks fetch error:', e1);
    if (e2) console.error('Resources fetch error:', e2);
    if (e3) console.error('Announcements fetch error:', e3);
    
    let resources = resData || [];
    let announcements = annData || [];
    let sessions = (sessDataRaw || []).filter(s => !s.domain || s.domain === 'All' || s.domain === domain);

    // Batch 2: Heavy leaderboard data (with 1000+ limit bypass)
    const taskPromises = [];
    const studentPromises = [];
    for (let i = 0; i < 5; i++) { // Up to 5,000 per domain/batch is plenty
      taskPromises.push(admin.from('tasks').select('student_email, marks_obtained, marks').eq('batch_name', batchName).ilike('domain', domain).range(i * 1000, (i + 1) * 1000 - 1));
      studentPromises.push(admin.from('students').select('email, name, student_id').eq('batch_name', batchName).ilike('domain', domain).not('email', 'like', '%+%').range(i * 1000, (i + 1) * 1000 - 1));
    }

    const [taskPages, studentPages] = await Promise.all([
      Promise.all(taskPromises),
      Promise.all(studentPromises)
    ]);
    
    const allTasks = taskPages.flatMap(p => p.data || []);
    const remaining = studentPages.flatMap(p => p.data || []);

    // 6. Login streak (Fire-and-forget updates)
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let streak = 1;
    if (!streakRow) {
      admin.from('login_streaks').insert({ student_email: cleanProfileEmail, current_streak: 1, last_login_date: todayStr }).then();
    } else if (streakRow.last_login_date === todayStr) {
      streak = streakRow.current_streak;
    } else if (streakRow.last_login_date === yesterdayStr) {
      streak = streakRow.current_streak + 1;
      admin.from('login_streaks').update({ current_streak: streak, last_login_date: todayStr }).eq('student_email', cleanProfileEmail).then();
    } else {
      admin.from('login_streaks').update({ current_streak: 1, last_login_date: todayStr }).eq('student_email', cleanProfileEmail).then();
    }

    // 7. Leaderboard — ✅ 100% REAL TIME DYNAMIC LOGIC
    // Step A: Calculate marks dynamically from ALL tasks
    const studentMarks = {};
    (allTasks || []).forEach(t => {
        const email = (t.student_email || '').toLowerCase();
        if (!studentMarks[email]) studentMarks[email] = { obtained: 0, full: 0 };
        studentMarks[email].obtained += (Number(t.marks_obtained) || 0);
        studentMarks[email].full += (Number(t.marks) || 100);
    });

    // Step B: Calculate percentages for all students
    let combinedLeaderboard = (remaining || [])
      .map(s => {
        const m = studentMarks[(s.email || '').toLowerCase()];
        const percentage = m && m.full > 0 ? (m.obtained / m.full) * 100 : 0;
        return { 
          email: s.student_id || s.email, 
          name: s.name, 
          percentage: Number(percentage).toFixed(1) 
        };
      })
      // Step C: Sort descending and assign ranks
      .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
      .map((student, index) => ({
        ...student,
        rank: index + 1
      }))
      .slice(0, 10);

    // Remove certificate link if inactive (prevents downloading certificate or offer letter)
    if (student.status === 'Inactive') {
      student.certificate_link = null;
    }

    return res.status(200).json({
      tasks: tasks || [],
      resources: resources || [],
      announcements: announcements || [],
      sessions: sessions,
      isPremium: !!enrollment,
      streak,
      certificateOrder: certOrder || null,
      leaderboard: combinedLeaderboard
    });
  } catch (err) {
    console.error('get-student-data error:', err);
    return res.status(500).json({ error: err.message });
  }
}
