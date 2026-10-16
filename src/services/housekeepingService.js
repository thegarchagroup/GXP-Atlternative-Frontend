import apiClient, { unwrap } from './apiClient';

export const housekeepingService = {
  myTickets: (bucket = 'all') => unwrap(apiClient.get('/housekeeping/my-tickets', { params: { bucket } })),
  start: (ticketId) => unwrap(apiClient.post(`/housekeeping/${ticketId}/start`)),
  checklist: (ticketId) => unwrap(apiClient.get(`/housekeeping/${ticketId}/checklist`)),
  save: (ticketId, items) => unwrap(apiClient.put(`/housekeeping/${ticketId}/checklist`, { items })),
  submit: (ticketId, items, notes) => unwrap(apiClient.post(`/housekeeping/${ticketId}/submit`, { items, notes })),
};
