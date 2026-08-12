import approvePremium from './_admin/approve-premium.js';
import rejectPremium from './_admin/reject-premium.js';
import sendCredentials from './_admin/send-credentials.js';
import resendCredentials from './_admin/resend-credentials.js';
import createStudent from './_admin/create-student.js';
import createStaff from './_admin/create-staff.js';
import clearPasswordFlag from './_admin/clear-password-flag.js';
import adminTasks from './_admin/admin-tasks.js';
import adminResources from './_admin/admin-resources.js';
import evaluateTask from './_admin/evaluate-task.js';
import sendNewsletter from './_admin/send-newsletter.js';
import deleteSubscriber from './_admin/delete-subscriber.js';
import getSubscribers from './_admin/get-subscribers.js';
import cleanupDuplicates from './_admin/cleanup-duplicates.js';
import fixTasks from './_admin/fix-tasks.js';

const routes = {
  'approve-premium': approvePremium,
  'reject-premium': rejectPremium,
  'send-credentials': sendCredentials,
  'resend-credentials': resendCredentials,
  'create-student': createStudent,
  'create-staff': createStaff,
  'clear-password-flag': clearPasswordFlag,
  'admin-tasks': adminTasks,
  'admin-resources': adminResources,
  'evaluate-task': evaluateTask,
  'send-newsletter': sendNewsletter,
  'delete-subscriber': deleteSubscriber,
  'get-subscribers': getSubscribers,
  'cleanup-duplicates': cleanupDuplicates,
  'fix-tasks': fixTasks,
};

export default async function handler(req, res) {
  const { action } = req.query;
  
  if (routes[action]) {
    return routes[action](req, res);
  }
  
  return res.status(404).json({ error: 'Admin action not found' });
}
