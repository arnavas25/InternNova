import { getAdminClient, requireStaffAdmin } from '../_lib.js';

export default async function handler(req, res) {
  const admin = getAdminClient();
  const auth = await requireStaffAdmin(req, admin);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.message });

  const { method } = req;
  const isMentor = auth.role === 'mentor';
  
  // Get mentor specifics if needed
  let mentorName = null;
  let allowedDomains = [];
  
  if (isMentor) {
    const { data: staffData } = await admin.from('staff_users').select('full_name').eq('email', auth.email).single();
    mentorName = staffData?.full_name || 'UNASSIGNED_MENTOR';

    // Fetch students assigned to this mentor to figure out what domains they teach
    const { data: assignedStudents } = await admin.from('students').select('domain').eq('mentor_name', mentorName);
    allowedDomains = [...new Set((assignedStudents || []).map(s => s.domain).filter(Boolean))];
  }

  try {
    if (method === 'GET') {
      let q = admin.from('resources').select('*');
      
      if (isMentor) {
        if (allowedDomains.length === 0) return res.status(200).json([]);
        q = q.in('domain', allowedDomains);
      } else {
        const { filterDomain, filterBatch } = req.query;
        if (filterDomain) q = q.eq('domain', filterDomain);
        if (filterBatch) q = q.eq('batch_name', filterBatch);
      }
      
      const { data, error } = await q.order('week', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    
    if (method === 'POST') {
      const form = req.body;
      if (!form.domain) return res.status(400).json({ error: 'Domain is required' });
      
      if (isMentor) {
        if (!allowedDomains.includes(form.domain)) {
          return res.status(403).json({ error: 'Mentors can only add resources to domains where their assigned students belong' });
        }
      }

      const payload = { ...form, batch_name: form.batch_name || null, uploaded_by: mentorName || 'Admin', created_at: new Date() };

      const { error } = await admin.from('resources').insert(payload);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }
    
    if (method === 'PUT') {
      const { id, ...form } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing resource ID' });

      if (isMentor) {
         const { data: checkRes, error: checkErr } = await admin.from('resources').select('domain').eq('id', id).single();
         if (checkErr) throw checkErr;
         if (!allowedDomains.includes(checkRes.domain)) {
           return res.status(403).json({ error: 'Cannot edit resources outside your allowed domains' });
         }
         if (form.domain && !allowedDomains.includes(form.domain)) {
           return res.status(403).json({ error: 'Cannot reassign resource to a domain outside your allowed domains' });
         }
      }

      const { error } = await admin.from('resources').update({ ...form, batch_name: form.batch_name || null }).eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }
    
    if (method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing resource ID' });

      if (isMentor) {
         const { data: checkRes, error: checkErr } = await admin.from('resources').select('domain').eq('id', id).single();
         if (checkErr) throw checkErr;
         if (!allowedDomains.includes(checkRes.domain)) {
           return res.status(403).json({ error: 'Cannot delete resources outside your allowed domains' });
         }
      }

      const { error } = await admin.from('resources').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin-resources error:', err);
    return res.status(500).json({ error: err.message });
  }
}
