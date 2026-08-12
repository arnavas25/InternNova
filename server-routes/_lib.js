import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// This client uses the SERVICE ROLE key — it must only ever run here,
// server-side, inside a Vercel serverless function. Never import this
// file or expose SUPABASE_SERVICE_ROLE_KEY in any frontend bundle.
export function getAdminClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Confirms the request actually came from a logged-in staff admin/super_admin,
// not just anyone who found this endpoint's URL.
export async function requireStaffAdmin(req, adminClient) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return { ok: false, status: 401, message: 'Missing auth token' };

  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !userData?.user) return { ok: false, status: 401, message: 'Invalid session' };

  const { data: staffRow, error: staffError } = await adminClient
    .from('staff_users')
    .select('role, status')
    .eq('email', userData.user.email)
    .single();

  if (staffError || !staffRow) {
    return { 
      ok: false, 
      status: 403, 
      message: `Not a staff account (Email: ${userData?.user?.email || 'none'}, Err: ${staffError?.message || 'No row found'})` 
    };
  }
  
  if (!['admin', 'super_admin', 'mentor'].includes(staffRow.role)) return { ok: false, status: 403, message: 'Insufficient permissions' };
  if (staffRow.status !== 'active') return { ok: false, status: 403, message: 'Staff account inactive' };

  return { ok: true, email: userData.user.email, role: staffRow.role };
}

export function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw + '!' + Math.floor(Math.random() * 90 + 10);
}

// Sends via your existing Google Workspace SMTP (same app password you
// already set up for Supabase Auth emails) — no extra service needed.
// Silently no-ops if not configured; the admin panel still shows the
// credentials on-screen either way, so nothing is blocked.
export async function sendCredentialsEmail({ to, name, roleLabel, loginUrl, id, password, isAlias }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return { sent: false, reason: 'GMAIL_USER / GMAIL_APP_PASSWORD not configured' };
  }

  const html = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3EE; padding:40px 0; font-family:Georgia, serif;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#0E1526; border-radius:12px; overflow:hidden;">
        <tr><td style="padding:36px 40px 24px; text-align:center; border-bottom:1px solid #2A3654;">
          <span style="font-family:Arial,sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#CE9C4C;">InternNova</span>
        </td></tr>
        <tr><td style="padding:36px 40px 10px;">
          <h1 style="margin:0 0 16px; font-size:24px; color:#F2F0EA; font-family:Georgia,serif;">Welcome, ${escapeHtml(name)}</h1>
          <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#9FA8BE; font-family:Arial,sans-serif;">
            ${isAlias 
              ? `We see you have enrolled in an additional domain! Your ${escapeHtml(roleLabel)} account has been updated with your new course.`
              : `Your ${escapeHtml(roleLabel)} account has been created. Here are your login details:`}
          </p>
          <table style="width:100%; background:#141D33; border-radius:8px; margin-bottom:20px;">
            <tr><td style="padding:16px 20px; font-family:'Courier New',monospace; font-size:14px; color:#F2F0EA;">
              <strong>ID:</strong> ${escapeHtml(id)}<br>
              <strong>Email:</strong> ${escapeHtml(to)}<br>
              ${isAlias 
                ? `<em>Password:</em> Not required! Just log in using your original email address and original password to access this course!`
                : `<strong>Temporary Password:</strong> ${password}`}
            </td></tr>
          </table>
          ${!isAlias ? `
          <p style="margin:0 0 24px; font-size:13px; color:#6C7690; font-family:Arial,sans-serif;">
            You'll be asked to set your own password the first time you log in.
          </p>
          ` : ''}
        </td></tr>
        <tr><td style="padding:0 40px 32px; text-align:center;">
          <a href="${loginUrl}" style="display:inline-block; background-color:#CE9C4C; color:#14100A; text-decoration:none; font-weight:bold; font-family:Arial,sans-serif; font-size:15px; padding:14px 32px; border-radius:6px;">Log In Now</a>
        </td></tr>
      </table>
    </td></tr>
  </table>`;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER, // e.g. info@internnova.co.in (the account the app password belongs to)
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"InternNova" <${process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER}>`,
      to,
      subject: `Your InternNova ${escapeHtml(roleLabel)} account`,
      html,
    });

    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

export async function sendApplicationReceivedEmail({ to, name }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return { sent: false, reason: 'Not configured' };

  const html = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3EE; padding:40px 0; font-family:Georgia, serif;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#0E1526; border-radius:12px; overflow:hidden;">
        <tr><td style="padding:36px 40px 24px; text-align:center; border-bottom:1px solid #2A3654;">
          <span style="font-family:Arial,sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#CE9C4C;">InternNova</span>
        </td></tr>
        <tr><td style="padding:36px 40px 32px;">
          <h1 style="margin:0 0 16px; font-size:24px; color:#F2F0EA; font-family:Georgia,serif;">Thank You, ${escapeHtml(name)}</h1>
          <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#9FA8BE; font-family:Arial,sans-serif;">
            We have successfully received your Premium Internship application and payment (₹499).
          </p>
          <p style="margin:0 0 0; font-size:15px; line-height:1.6; color:#9FA8BE; font-family:Arial,sans-serif;">
            Your application is currently under review by our team. We will notify you once it is approved, and you will receive your Student Dashboard login credentials shortly after.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>`;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"InternNova" <${process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER}>`,
      to, subject: `Application Received - InternNova Premium Internship`, html,
    });
    return { sent: true };
  } catch (err) { return { sent: false, reason: err.message }; }
}

export async function sendNewsletterEmail({ bcc, subject, html }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return { sent: false, reason: 'Not configured' };

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    
    // We send to our own address, and put everyone else in BCC to hide emails from each other
    await transporter.sendMail({
      from: `"InternNova Updates" <${process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER,
      bcc, 
      subject, 
      html,
    });
    
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

export async function sendWelcomeEmail({ to, name, batchName, domain }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return { sent: false, reason: 'Not configured' };

  const html = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3EE; padding:40px 0; font-family:Georgia, serif;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#0E1526; border-radius:12px; overflow:hidden;">
        <tr><td style="padding:36px 40px 24px; text-align:center; border-bottom:1px solid #2A3654;">
          <span style="font-family:Arial,sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#CE9C4C;">InternNova</span>
        </td></tr>
        <tr><td style="padding:36px 40px 32px;">
          <h1 style="margin:0 0 16px; font-size:24px; color:#F2F0EA; font-family:Georgia,serif;">Congratulations, ${escapeHtml(name)}!</h1>
          <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#9FA8BE; font-family:Arial,sans-serif;">
            Your Premium Internship application for <strong>${escapeHtml(domain)}</strong> has been approved!
          </p>
          <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#9FA8BE; font-family:Arial,sans-serif;">
            You have been assigned to <strong>${escapeHtml(batchName)}</strong>.
          </p>
          <p style="margin:0 0 0; font-size:15px; line-height:1.6; color:#9FA8BE; font-family:Arial,sans-serif;">
            Please wait while we set up your workspace. You will receive a separate email containing your Student ID and login credentials soon.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>`;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"InternNova" <${process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER}>`,
      to, subject: `Application Approved! Welcome to InternNova`, html,
    });
    return { sent: true };
  } catch (err) { return { sent: false, reason: err.message }; }
}

export async function sendRejectionEmail({ to, name }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return { sent: false, reason: 'Not configured' };

  const html = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3EE; padding:40px 0; font-family:Georgia, serif;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#0E1526; border-radius:12px; overflow:hidden;">
        <tr><td style="padding:36px 40px 24px; text-align:center; border-bottom:1px solid #2A3654;">
          <span style="font-family:Arial,sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#CE9C4C;">InternNova</span>
        </td></tr>
        <tr><td style="padding:36px 40px 32px;">
          <h1 style="margin:0 0 16px; font-size:24px; color:#F2F0EA; font-family:Georgia,serif;">Update on your application</h1>
          <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#9FA8BE; font-family:Arial,sans-serif;">
            Dear ${escapeHtml(name)},<br><br>We regret to inform you that your Premium Internship application has not been approved at this time.
          </p>
          <p style="margin:0 0 0; font-size:15px; line-height:1.6; color:#9FA8BE; font-family:Arial,sans-serif;">
            A full refund for your application fee (₹499) has been initiated and will reflect in your account shortly. We wish you the best in your future endeavors.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>`;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"InternNova" <${process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER}>`,
      to, subject: `Update on your InternNova Application`, html,
    });
    return { sent: true };
  } catch (err) { return { sent: false, reason: err.message }; }
}
