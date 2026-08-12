import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const PLANS = {
  Basic: 3000, // ₹30
  Premium: 5000, // ₹50
  Lifetime: 9900 // ₹99
};

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, plan, resumeType, profileData } = req.body;

  if (!email || !plan || !PLANS[plan]) {
    return res.status(400).json({ error: 'Invalid plan or missing email' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    let orderId = `dummy_order_${Date.now()}`;
    const amount = PLANS[plan];

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay is not configured on the server.' });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const options = {
      amount,
      currency: 'INR',
      receipt: `rcptid_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    orderId = order.id;

    // Save initial payment attempt to DB
    await supabase.from('payments').insert({
      razorpay_order_id: orderId,
      plan,
      amount: amount / 100, // Save in INR
      currency: 'INR',
      status: 'created',
      email: cleanEmail
    });

    res.status(200).json({
      orderId: orderId,
      amount: amount,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
