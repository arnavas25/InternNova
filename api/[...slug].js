import adminRoute from '../server-routes/admin.js';
import certPaymentRoute from '../server-routes/cert-payment.js';
import coursePaymentRoute from '../server-routes/course-payment.js';
import getHallOfFameRoute from '../server-routes/get-hall-of-fame.js';
import getProfilesRoute from '../server-routes/get-profiles.js';
import getStaffEmailRoute from '../server-routes/get-staff-email.js';
import getStudentDataRoute from '../server-routes/get-student-data.js';
import premiumApplicationRoute from '../server-routes/premium-application.js';
import resetPasswordEmailRoute from '../server-routes/reset-password-email.js';
import updateTaskRoute from '../server-routes/update-task.js';

import createOrderRoute from '../server-routes/payment/create-order.js';
import verifyRoute from '../server-routes/payment/verify.js';

import generateResumeRoute from '../server-routes/resume/generate.js';

import adminResourcesRoute from '../server-routes/_admin/admin-resources.js';
import adminTasksRoute from '../server-routes/_admin/admin-tasks.js';
import approvePremiumRoute from '../server-routes/_admin/approve-premium.js';
import clearPasswordFlagRoute from '../server-routes/_admin/clear-password-flag.js';
import createStaffRoute from '../server-routes/_admin/create-staff.js';
import createStudentRoute from '../server-routes/_admin/create-student.js';
import deleteSubscriberRoute from '../server-routes/_admin/delete-subscriber.js';
import evaluateTaskRoute from '../server-routes/_admin/evaluate-task.js';
import getSubscribersRoute from '../server-routes/_admin/get-subscribers.js';
import rejectPremiumRoute from '../server-routes/_admin/reject-premium.js';
import resendCredentialsRoute from '../server-routes/_admin/resend-credentials.js';
import sendCredentialsRoute from '../server-routes/_admin/send-credentials.js';
import sendNewsletterRoute from '../server-routes/_admin/send-newsletter.js';

const routeMap = {
  'admin': adminRoute,
  'cert-payment': certPaymentRoute,
  'course-payment': coursePaymentRoute,
  'get-hall-of-fame': getHallOfFameRoute,
  'get-profiles': getProfilesRoute,
  'get-staff-email': getStaffEmailRoute,
  'get-student-data': getStudentDataRoute,
  'premium-application': premiumApplicationRoute,
  'reset-password-email': resetPasswordEmailRoute,
  'update-task': updateTaskRoute,
  
  'payment/create-order': createOrderRoute,
  'payment/verify': verifyRoute,
  
  'resume/generate': generateResumeRoute,
  
  '_admin/admin-resources': adminResourcesRoute,
  '_admin/admin-tasks': adminTasksRoute,
  '_admin/approve-premium': approvePremiumRoute,
  '_admin/clear-password-flag': clearPasswordFlagRoute,
  '_admin/create-staff': createStaffRoute,
  '_admin/create-student': createStudentRoute,
  '_admin/delete-subscriber': deleteSubscriberRoute,
  '_admin/evaluate-task': evaluateTaskRoute,
  '_admin/get-subscribers': getSubscribersRoute,
  '_admin/reject-premium': rejectPremiumRoute,
  '_admin/resend-credentials': resendCredentialsRoute,
  '_admin/send-credentials': sendCredentialsRoute,
  '_admin/send-newsletter': sendNewsletterRoute
};

export default async function handler(req, res) {
  try {
    let routePath = '';

    // First try to get the route path from req.url (Most reliable)
    // req.url looks like "/api/get-hall-of-fame?foo=bar" or "/api/admin"
    if (req.url && req.url.startsWith('/api/')) {
      const urlWithoutQuery = req.url.split('?')[0]; // "/api/get-hall-of-fame"
      routePath = urlWithoutQuery.replace(/^\/api\//, '').replace(/\/$/, '');
    } 
    // Fallback to Vercel's magic slug if req.url is weird
    else if (req.query && req.query.slug) {
      routePath = Array.isArray(req.query.slug) ? req.query.slug.join('/') : req.query.slug;
    }

    if (!routePath) {
      return res.status(404).json({ error: 'Route not specified', url: req.url });
    }
    
    const routeHandler = routeMap[routePath];
    
    if (!routeHandler) {
      return res.status(404).json({ error: `Route not found: /api/${routePath}` });
    }

    if (typeof routeHandler !== 'function') {
      return res.status(500).json({ error: 'Route handler is not a function' });
    }

    return await routeHandler(req, res);
  } catch (err) {
    console.error('Catch-All Router Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
