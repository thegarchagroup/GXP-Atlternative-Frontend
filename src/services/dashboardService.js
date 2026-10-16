import apiClient, { unwrap } from './apiClient';

export const dashboardService = {
  frontdesk: () => unwrap(apiClient.get('/dashboard/frontdesk')),
  housekeeping: () => unwrap(apiClient.get('/dashboard/housekeeping')),
  engineering: () => unwrap(apiClient.get('/dashboard/engineering')),
  notifications: (since, includeOwn = false) => unwrap(apiClient.get('/dashboard/notifications', { params: { ...(since ? { since } : {}), include_own: includeOwn } })),
};
