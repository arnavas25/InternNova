import { getAdminClient, requireStaffAdmin, sendRejectionEmail } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();
  const auth = await requireStaffAdmin(req, admin);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

  try {
    const { applicationId } = req.body;
    if (!applicationId) return res.status(400).json({ error: 'applicationId is required' });

    // 1. Fetch the application
    const { data: app, error: appError } = await admin.from('premium_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !app) return res.status(404).json({ error: 'Application not found' });
    if (app.status !== 'pending') return res.status(400).json({ error: 'Application is not in pending state' });

    // 2. Update the application status
    const { error: updateError } = await admin.from('premium_applications')
      .update({ status: 'rejected' })
      .eq('id', applicationId);

    if (updateError) return res.status(500).json({ error: 'Failed to update application status: ' + updateError.message });

    // 3. Send the Rejection Email
    await sendRejectionEmail({
      to: app.email,
      name: app.full_name
    });

    return res.status(200).json({ success: true, message: 'Application rejected successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
}
