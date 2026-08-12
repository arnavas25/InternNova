import { supabase } from './supabase';

export async function callAdminApi(endpoint, body) {
  // First try getSession, if the token is expired, force a refresh
  let { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Try refreshing
    const refreshResult = await supabase.auth.refreshSession();
    session = refreshResult.data?.session;
  }
  
  if (!session) throw new Error('Not logged in');

  const res = await fetch(`/api/admin?action=${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
