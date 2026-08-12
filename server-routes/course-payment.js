import { getAdminClient } from './_lib.js';
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

const PREMIUM_AMOUNT_PAISE = 49900; // ₹499.00

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, ...payload } = req.body;
  
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) return res.status(500).json({ error: 'Razorpay is not configured on the server yet.' });

  if (action === 'create') {
    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const receipt = `intern_${Date.now()}`;

      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: PREMIUM_AMOUNT_PAISE, currency: 'INR', receipt }),
      });

      const data = await response.json();
      if (!response.ok) return res.status(500).json({ error: data.error?.description || 'Failed to create order' });

      return res.status(200).json({ orderId: data.id, amount: PREMIUM_AMOUNT_PAISE, keyId });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message || 'Unexpected server error' });
    }
  }

  if (action === 'verify') {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, name, email, phone, domain, college, branch, year } = payload;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment verification fields' });
      }

      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment verification failed — signature mismatch.' });
      }

      const admin = getAdminClient();
      const { error: dbError } = await admin.from('enrollments').insert({
        name, email, phone, domain, plan: 'premium',
        razorpay_payment_id, amount: 499, enrolled_at: new Date().toISOString(),
        college: college || null,
        branch: branch || null,
        year: year || null,
      });
      if (dbError) return res.status(500).json({ error: dbError.message });

      return res.status(200).json({ verified: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message || 'Unexpected server error' });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
