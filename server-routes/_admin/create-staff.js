import { getAdminClient, requireStaffAdmin, generatePassword, sendCredentialsEmail } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();
  const auth = await requireStaffAdmin(req, admin);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

  try {
    const { fullName, email, phone, department, role, domain, batchName } = req.body;
    if (!fullName || !email || !role) return res.status(400).json({ error: 'fullName, email, and role are required' });
    if (!['mentor', 'admin', 'super_admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    
    // Only super_admin can create admin or super_admin
    if (auth.role === 'admin' && role !== 'mentor') {
      return res.status(403).json({ error: 'Admins can only create mentor accounts' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const password = generatePassword();

    const prefix = role === 'mentor' ? 'INTN-MTR-' : 'INTN-CT-';

    const { data: lastStaff } = await admin.from('staff_users')
      .select('staff_id')
      .like('staff_id', `${prefix}%`)
      .order('staff_id', { ascending: false })
      .limit(1)
      .single();

    let nextNum = 1;
    if (lastStaff && lastStaff.staff_id) {
      const parsed = parseInt(lastStaff.staff_id.replace(prefix, ''), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }
    
    const staffId = `${prefix}${String(nextNum).padStart(3, '0')}`;

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, staff_id: staffId },
    });
    if (authError) return res.status(500).json({ error: authError.message });

    const { error: dbError } = await admin.from('staff_users').insert({
      auth_user_id: authData.user.id,
      staff_id: staffId,
      full_name: fullName,
      email: cleanEmail,
      phone: phone || null,
      department: department || null,
      role,
      domain: role === 'mentor' ? (domain || null) : null,
      batch_name: role === 'mentor' ? (batchName || null) : null,
      status: 'active',
      approved: true,
      is_registered: true,
      must_change_password: true,
    });
    if (dbError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: dbError.message });
    }

    const roleLabels = { admin: 'Admin', super_admin: 'Super Admin', mentor: 'Mentor' };
    const loginUrl = `${req.headers.origin || 'https://internnova.co.in'}/staff-login`;
    const emailResult = await sendCredentialsEmail({
      to: cleanEmail, name: fullName, roleLabel: roleLabels[role], loginUrl, id: staffId, password,
    });

    return res.status(200).json({ staffId, email: cleanEmail, password, emailSent: emailResult.sent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
}
