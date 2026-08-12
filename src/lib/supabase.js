import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const DEFAULT_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const DEFAULT_RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
const DEFAULT_EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
const DEFAULT_EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const DEFAULT_EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';

const LS = {
  url: 'INTERNNOVA_SUPABASE_URL',
  key: 'INTERNNOVA_SUPABASE_ANON_KEY',
  rzp: 'INTERNNOVA_RAZORPAY_KEY_ID',
  emPub: 'INTERNNOVA_EMAILJS_PUBLIC_KEY',
  emServ: 'INTERNNOVA_EMAILJS_SERVICE_ID',
  emTpl: 'INTERNNOVA_EMAILJS_TEMPLATE_ID',
};

export function getConfig() {
  return {
    supabaseUrl: localStorage.getItem(LS.url) || DEFAULT_SUPABASE_URL,
    supabaseKey: localStorage.getItem(LS.key) || DEFAULT_SUPABASE_ANON_KEY,
    razorpayKeyId: localStorage.getItem(LS.rzp) || DEFAULT_RAZORPAY_KEY_ID,
    emailjsPublicKey: localStorage.getItem(LS.emPub) || DEFAULT_EMAILJS_PUBLIC_KEY,
    emailjsServiceId: localStorage.getItem(LS.emServ) || DEFAULT_EMAILJS_SERVICE_ID,
    emailjsTemplateId: localStorage.getItem(LS.emTpl) || DEFAULT_EMAILJS_TEMPLATE_ID,
  };
}

export function saveConfig({ url, key, rzpKey, emPub, emServ, emTpl }) {
  if (url) localStorage.setItem(LS.url, url);
  if (key) localStorage.setItem(LS.key, key);
  if (rzpKey) localStorage.setItem(LS.rzp, rzpKey);
  if (emPub) localStorage.setItem(LS.emPub, emPub);
  if (emServ) localStorage.setItem(LS.emServ, emServ);
  if (emTpl) localStorage.setItem(LS.emTpl, emTpl);
}

export function clearConfig() {
  Object.values(LS).forEach((k) => localStorage.removeItem(k));
}

export function hasStoredKeys() {
  return !!(localStorage.getItem(LS.url) || localStorage.getItem(LS.key));
}

const isValidCreds = (url, key) =>
  url && url !== 'YOUR_SUPABASE_URL' && url.trim() !== '' &&
  key && key !== 'YOUR_SUPABASE_ANON_KEY' && key.trim() !== '';

const { supabaseUrl, supabaseKey } = getConfig();

export const supabase = isValidCreds(supabaseUrl, supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export function isSupabaseConfigured() {
  return supabase !== null;
}
