import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateResumeId() {
  const segment1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const segment2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `INR-${segment1}-${segment2}`;
}

function generateAccessToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, name, phone, plan } = req.body;

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return res.status(500).json({ error: 'Razorpay is not configured on the server.' });
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !email || !plan) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify the order exists and matches the server-created order.
    const { data: existingPayment, error: paymentLookupError } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle();

    if (paymentLookupError || !existingPayment) {
      return res.status(404).json({ error: 'Payment order not found.' });
    }

    if (existingPayment.email !== cleanEmail || existingPayment.plan !== plan) {
      return res.status(400).json({ error: 'Payment details do not match the original order.' });
    }

    if (existingPayment.status === 'paid' && existingPayment.resume_id) {
      const { data: existingResume } = await supabase
        .from('resumes')
        .select('resume_id, access_token')
        .eq('resume_id', existingPayment.resume_id)
        .single();

      if (existingResume) {
        return res.status(200).json({
          success: true,
          resumeId: existingResume.resume_id,
          accessToken: existingResume.access_token
        });
      }
    }

    // 2. Grant Entitlement
    const resumeId = generateResumeId();
    const accessToken = generateAccessToken();
    
    // For Lifetime, set an expiry far in the future
    let expiresAt = new Date();
    if (plan === 'Lifetime') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 100);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days for Basic/Premium
    }

    // 2. Create Empty Resume Stub (Do this FIRST because entitlements references resumes)
    const { error: resumeError } = await supabase
      .from('resumes')
      .insert([
        {
          resume_id: resumeId,
          access_token: accessToken,
          email: cleanEmail,
          plan: plan,
          mode: plan === 'Basic' ? 'Standard' : 'Professional',
          profile_data: { name: name || '', phone: phone || '' },
          resume_type: 'General'
        }
      ]);

    if (resumeError) {
      console.error('Resume Error:', resumeError);
      return res.status(500).json({ error: 'Payment verified, but failed to create resume record.', details: resumeError });
    }

    // 3. Grant Entitlement
    const { error: entError } = await supabase
      .from('entitlements')
      .insert([
        { 
          resume_id: resumeId, 
          plan: plan, 
          expires_at: expiresAt.toISOString(), 
          features: { downloads_allowed: true, ai_tools_allowed: plan !== 'Basic' },
          active: true 
        }
      ]);

    if (entError) {
      console.error('Entitlement Error:', entError);
      return res.status(500).json({ error: 'Payment verified, but failed to grant entitlement.', details: entError });
    }

    // 4. Update Payment Record
    await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'paid',
        resume_id: resumeId
      })
      .eq('razorpay_order_id', razorpay_order_id);

    res.status(200).json({ success: true, resumeId, accessToken });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
