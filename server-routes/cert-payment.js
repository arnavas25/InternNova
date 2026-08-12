import { getAdminClient } from './_lib.js';
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getAdminClient();
  const { action, ...payload } = req.body;

  if (action === 'debug_orders') {
    const { data, error } = await admin.from('certificate_orders').select('*').limit(10);
    return res.status(200).json({ data, error });
  }





  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  let authEmail = null;
  try {
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (!userError && userData?.user) {
      authEmail = userData.user.email.toLowerCase();
    } else {
      console.error('Supabase getUser failed:', userError);
    }
  } catch (e) {
    console.error('getUser exception:', e);
  }

  // Fallback: manually decode JWT to extract email if Supabase getUser fails
  if (!authEmail) {
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
      if (decodedPayload && decodedPayload.email) {
        authEmail = decodedPayload.email.toLowerCase();
      }
    } catch (e) {
      console.error('Failed to decode JWT manually:', e);
    }
  }

  if (!authEmail) {
    return res.status(401).json({ error: 'Invalid session: Could not determine user email from token.' });
  }
  const keyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) return res.status(500).json({ error: 'Payment gateway not configured' });



  if (action === 'create') {
    try {
      const { domain, batchName } = payload;
      // Idempotency check
      const { data: existing } = await admin.from('certificate_orders')
        .select('id, payment_status')
        .eq('student_email', authEmail)
        .eq('domain', domain || 'General')
        .eq('batch_name', batchName || 'General')
        .maybeSingle();

      if (existing && existing.payment_status === 'paid') {
        return res.status(400).json({ error: 'Order already paid.' });
      }

      const amountPaise = 199 * 100;
      const receiptId = `cert_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, studentId, domain, batchName, form } = payload;
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

      // Idempotency check: don't insert duplicate orders for the same razorpay_order_id
      const { data: existingRecord } = await admin.from('certificate_orders')
        .select('id')
        .eq('razorpay_order_id', razorpay_order_id)
        .maybeSingle();
        
      if (existingRecord) {
        return res.status(200).json({ success: true, message: 'Already processed' });
      }

      const dbPayload = {
        student_email: authEmail,
        student_name: form.fullName || 'Unknown',
        phone: form.phone || '',
        domain: domain || 'General',
        batch_name: batchName || 'General',
        full_name: form.fullName || 'Unknown',
        address_line1: form.addressLine1 || '',
        address_line2: form.addressLine2 || null,
        city: form.city || '',
        state: form.state || '',
        pincode: form.pincode || '',
        country: form.country || 'India',
        amount: 199,
        razorpay_order_id,
        razorpay_payment_id,
        payment_status: 'paid',
        delivery_status: 'Pending',
      };
      
      // Try to insert
      const { error: dbError } = await admin.from('certificate_orders').insert(dbPayload);
      
      if (dbError) {
        console.error('DB Insert failed for cert order:', dbError);
        return res.status(500).json({ error: `DB Insert failed: ${dbError.message}` });
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
