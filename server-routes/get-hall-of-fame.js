import { getAdminClient } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();

  try {
    // 1. Fetch ALL students and ALL tasks using Promise.all pagination to bypass the 1000 row limit
    const studentPromises = [];
    const taskPromises = [];
    for (let i = 0; i < 15; i++) { // Up to 15,000 students and tasks
      studentPromises.push(admin.from('students').select('name, email, student_id, domain, batch_name').range(i * 1000, (i + 1) * 1000 - 1));
      taskPromises.push(admin.from('tasks').select('student_email, marks_obtained, marks').range(i * 1000, (i + 1) * 1000 - 1));
    }
    
    const [studentPages, taskPages] = await Promise.all([
      Promise.all(studentPromises),
      Promise.all(taskPromises)
    ]);
    
    const allStudents = studentPages.flatMap(p => p.data || []);
    const allTasks = taskPages.flatMap(p => p.data || []);

    if (allStudents.length === 0) return res.status(200).json([]);

    // 2. Calculate scores for ALL students
    const studentMarks = {};
    allTasks.forEach(t => {
      const email = (t.student_email || '').toLowerCase();
      if (!studentMarks[email]) studentMarks[email] = { obtained: 0, full: 0 };
      studentMarks[email].obtained += (Number(t.marks_obtained) || 0);
      studentMarks[email].full += (Number(t.marks) || 100);
    });

    // 3. Attach calculated percentage and group by batch/domain
    const domainGroups = {};
    allStudents.forEach(student => {
      const email = (student.email || '').toLowerCase();
      const marks = studentMarks[email];
      
      let finalScore = 0;
      if (marks && marks.full > 0) {
        finalScore = (marks.obtained / marks.full) * 100;
      }
      
      // Only consider students with a score > 0 for the Hall of Fame
      if (finalScore > 0) {
        const enriched = {
          ...student,
          calculated_score: parseFloat(finalScore.toFixed(1))
        };
        
        const key = `${student.batch_name}_${student.domain}`;
        if (!domainGroups[key]) domainGroups[key] = [];
        domainGroups[key].push(enriched);
      }
    });

    // 4. Sort and pick Top 3 for each domain/batch
    const finalHallOfFame = [];
    Object.values(domainGroups).forEach(group => {
      // Sort descending by calculated score
      group.sort((a, b) => b.calculated_score - a.calculated_score);
      // Pick top 3
      const top3 = group.slice(0, 3);
      top3.forEach((student, index) => {
        student.rank = index + 1;
        finalHallOfFame.push(student);
      });
    });

    return res.status(200).json(finalHallOfFame);
  } catch (err) {
    console.error('get-hall-of-fame error:', err);
    return res.status(500).json({ error: err.message });
  }
}
