import { getAdminClient, requireStaffAdmin, sendWelcomeEmail } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();
  const auth = await requireStaffAdmin(req, admin);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

  try {
    const { applicationId, batchOption, newBatchName, newBatchStartDate, newBatchEndDate } = req.body;
    if (!applicationId || !batchOption) return res.status(400).json({ error: 'applicationId and batchOption are required' });

    // 1. Fetch the application
    const { data: app, error: appError } = await admin.from('premium_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !app) return res.status(404).json({ error: 'Application not found' });
    if (app.status !== 'pending') return res.status(400).json({ error: 'Application is not in pending state' });

    let finalBatchName = batchOption;

    // 2. Handle creating a new batch if requested
    if (batchOption === 'create_new') {
      if (!newBatchName || !newBatchStartDate) {
        return res.status(400).json({ error: 'New batch name and start date are required' });
      }
      finalBatchName = newBatchName;
      
      // Insert into batches table
      const { error: batchError } = await admin.from('batches').insert({
        batch_name: newBatchName,
        domain: app.domain,
        start_date: newBatchStartDate,
        status: 'open'
      });
      if (batchError) return res.status(500).json({ error: 'Failed to create new batch: ' + batchError.message });
    }

    // 3. Update the application status
    const { error: updateError } = await admin.from('premium_applications')
      .update({ status: 'approved', batch_name: finalBatchName })
      .eq('id', applicationId);

    if (updateError) return res.status(500).json({ error: 'Failed to update application status: ' + updateError.message });

    // 4. Send the Welcome Email (no credentials yet)
    await sendWelcomeEmail({
      to: app.email,
      name: app.full_name,
      batchName: finalBatchName,
      domain: app.domain
    });

    return res.status(200).json({ success: true, message: 'Application approved successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
}
