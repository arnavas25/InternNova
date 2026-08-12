import { getAdminClient, requireStaffAdmin, generatePassword, sendCredentialsEmail } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();
  const auth = await requireStaffAdmin(req, admin);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

  try {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'No student IDs provided' });
    }

    const results = { successful: 0, failed: 0, errors: [] };

    const CHUNK_SIZE = 25; // Process 25 at a time concurrently

    for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
      const chunk = studentIds.slice(i, i + CHUNK_SIZE);

      await Promise.all(chunk.map(async (id) => {
        try {
          // 1. Fetch student data
          const { data: student, error: fetchError } = await admin
            .from('students')
            .select('id, student_id, email, name, must_change_password')
            .eq('id', id)
            .single();

          if (fetchError || !student) throw new Error('Student not found');
          
          // 2. Generate a new password
          const password = generatePassword();

          // 3. Update Supabase Auth Password
          const { error: authError } = await admin.auth.admin.updateUserById(student.id, {
            password: password
          });
          if (authError) throw new Error(`Failed to update auth password: ${authError.message}`);

          // 4. Ensure must_change_password is true so they are forced to change it
          if (!student.must_change_password) {
            await admin.from('students').update({ must_change_password: true }).eq('id', student.id);
          }

          // 5. Send Email
          const loginUrl = `${req.headers.origin || 'https://internnova.co.in'}/login`;
          const emailResult = await sendCredentialsEmail({
            to: student.email,
            name: student.name,
            roleLabel: 'Student',
            loginUrl,
            id: student.student_id,
            password: password,
            isAlias: false
          });

          if (!emailResult.sent) {
            throw new Error('Email provider failed to send email (likely hit limits)');
          }

          results.successful++;
        } catch (err) {
          results.failed++;
          results.errors.push({ id, error: err.message });
        }
      }));
    }

    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
}
