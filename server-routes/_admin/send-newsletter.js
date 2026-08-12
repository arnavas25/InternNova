import { getAdminClient, requireStaffAdmin, sendNewsletterEmail } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();
  const auth = await requireStaffAdmin(req, admin);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });
  if (auth.role === 'mentor') return res.status(403).json({ error: 'Mentors cannot access the newsletter system.' });

  try {
    const { subject, html } = req.body;
    if (!subject || !html) {
      return res.status(400).json({ error: 'Subject and HTML content are required' });
    }

    // Fetch all subscribers
    const { data: subscribers, error } = await admin.from('newsletter_subscribers').select('email');
    if (error) throw error;
    if (!subscribers || subscribers.length === 0) {
      return res.status(400).json({ error: 'No subscribers found.' });
    }

    // Dispatch emails sequentially or in chunks.
    // Nodemailer should ideally be used in chunks to avoid rate limits, but for a simple implementation we can just loop.
    let sentCount = 0;
    const errors = [];

    // Map all emails
    const bccList = subscribers.map(s => s.email).join(', ');

    // We can either send 1 email with everyone in BCC, or separate emails.
    // To protect privacy and prevent "Too many recipients" errors on standard SMTP, chunking is best.
    const chunkSize = 50;
    const emails = subscribers.map(s => s.email);
    
    for (let i = 0; i < emails.length; i += chunkSize) {
      const chunk = emails.slice(i, i + chunkSize);
      const bccStr = chunk.join(', ');
      
      const emailRes = await sendNewsletterEmail({
        bcc: bccStr,
        subject,
        html
      });
      
      if (emailRes.sent) {
        sentCount += chunk.length;
      } else {
        errors.push(emailRes.reason);
      }
    }

    return res.status(200).json({ success: true, sentCount, errors: errors.length > 0 ? errors : undefined });

  } catch (err) {
    console.error('Newsletter Error:', err);
    return res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
}
