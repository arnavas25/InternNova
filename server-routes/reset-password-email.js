import { getAdminClient } from './_lib.js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const cleanEmail = email.trim().toLowerCase();

  // Verify this email exists as a student
  const { data: student } = await admin.from('students').select('id, name').eq('email', cleanEmail).maybeSingle();
  if (!student) {
    // Don't reveal whether the email exists — show success anyway
    return res.status(200).json({ success: true });
  }

  try {
    // Generate a password recovery link using the admin API
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo: `${req.headers.origin || 'https://internnova.co.in'}/reset-password`,
      },
    });

    if (linkError) {
      console.error('generateLink error:', linkError);
      return res.status(500).json({ error: 'Failed to generate reset link. Please try again.' });
    }

    // The generated link contains the token. We need to extract and rebuild for our domain.
    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      return res.status(500).json({ error: 'Failed to generate reset link.' });
    }

    // Send the reset email through our own SMTP
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ error: 'Email service not configured.' });
    }

    const html = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3EE; padding:40px 0; font-family:Georgia, serif;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#0E1526; border-radius:12px; overflow:hidden;">
          <tr><td style="padding:36px 40px 24px; text-align:center; border-bottom:1px solid #2A3654;">
            <span style="font-family:Arial,sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#CE9C4C;">InternNova</span>
          </td></tr>
          <tr><td style="padding:36px 40px 10px;">
            <h1 style="margin:0 0 16px; font-size:24px; color:#F2F0EA; font-family:Georgia,serif;">Reset your password</h1>
            <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#9FA8BE; font-family:Arial,sans-serif;">
              We received a request to reset the password for your InternNova account. Click the button below to set a new password.
            </p>
          </td></tr>
          <tr><td style="padding:0 40px 24px; text-align:center;">
            <a href="${actionLink}" style="display:inline-block; background-color:#CE9C4C; color:#14100A; text-decoration:none; font-weight:bold; font-family:Arial,sans-serif; font-size:15px; padding:14px 32px; border-radius:6px;">Reset Password</a>
          </td></tr>
          <tr><td style="padding:0 40px 32px;">
            <p style="margin:0; font-size:13px; line-height:1.6; color:#6C7690; font-family:Arial,sans-serif;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"InternNova" <${process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER}>`,
      to: cleanEmail,
      subject: 'Reset your InternNova password',
      html,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('reset-password-email error:', err);
    return res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
  }
}
