import { getAdminClient, sendApplicationReceivedEmail } from './_lib.js';
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();
  const { action, ...payload } = req.body;

  const keyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) return res.status(500).json({ error: 'Payment gateway not configured' });

  if (action === 'create') {
    try {
      const amountPaise = 499 * 100;
      const receiptId = `prem_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
        },
        body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: receiptId }),
      });

      if (!rzpRes.ok) return res.status(500).json({ error: 'Failed to create payment order' });
      const orderData = await rzpRes.json();
      return res.status(200).json({ orderId: orderData.id, amount: amountPaise, keyId });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (action === 'verify') {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, form } = payload;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !form) {
      return res.status(400).json({ error: 'Missing payment or form details' });
    }

    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    if (hmac.digest('hex') !== razorpay_signature) return res.status(400).json({ error: 'Payment signature verification failed' });

    try {
      // Verify payment from Razorpay
      const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
        headers: { 'Authorization': 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64') }
      });
      const paymentInfo = await rzpRes.json();
      if (paymentInfo.status !== 'captured' && paymentInfo.status !== 'authorized') {
        return res.status(400).json({ error: 'Payment not captured yet.' });
      }

      // Idempotency check: don't insert duplicate applications for the same razorpay_order_id
      const { data: existingRecord } = await admin.from('premium_applications')
        .select('id')
        .eq('razorpay_order_id', razorpay_order_id)
        .maybeSingle();
        
      if (existingRecord) {
        return res.status(200).json({ success: true, message: 'Already processed' });
      }

      const dbPayload = {
        full_name: form.fullName,
        email: form.email.toLowerCase(),
        phone: form.phone,
        college: form.college,
        degree: form.degree,
        branch: form.branch,
        current_year: form.currentYear,
        graduation_year: form.graduationYear,
        domain: form.domain,
        duration: form.duration,
        start_date: form.startDate,
        resume_url: form.resumeUrl,
        linkedin_url: form.linkedinUrl || null,
        github_url: form.githubUrl || null,
        referral_code: form.referralCode || null,
        aicte_id: form.aicteId || null,
        amount: 499,
        razorpay_order_id,
        razorpay_payment_id,
        payment_status: 'paid',
        status: 'pending',
      };
      
      const { error: dbError } = await admin.from('premium_applications').insert(dbPayload);
      
      if (dbError) {
        console.error('DB Insert failed for premium application:', dbError);
        return res.status(500).json({ error: `DB Insert failed: ${dbError.message}` });
      }
      
      // Send under review email
      await sendApplicationReceivedEmail({ to: form.email, name: form.fullName });
      
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
