import apiClient, { unwrap } from './apiClient';

export const engineeringService = {
  myTickets: (params) => unwrap(apiClient.get('/engineering/my-tickets', { params })),
  createDirect: (body) => unwrap(apiClient.post('/engineering/repairs', body)),
  listAll: (params) => unwrap(apiClient.get('/engineering/repairs', { params, paramsSerializer: { indexes: null } })),
  get: (id) => unwrap(apiClient.get(`/engineering/${id}`)),
  assign: (id, engineerId, reason) => unwrap(apiClient.post(`/engineering/${id}/assign`, { engineer_id: engineerId, reason })),
  start: (id) => unwrap(apiClient.post(`/engineering/${id}/start`)),
  checklist: (id) => unwrap(apiClient.get(`/engineering/${id}/checklist`)),
  save: (id, body) => unwrap(apiClient.put(`/engineering/${id}/checklist`, body)),
  complete: (id, body) => unwrap(apiClient.post(`/engineering/${id}/complete`, body)),
  reopen: (id, reason) => unwrap(apiClient.post(`/engineering/${id}/reopen`, { reason })),
  pendingList: () => unwrap(apiClient.get('/engineering/pending')),
  markPending: (id, body) => unwrap(apiClient.post(`/engineering/${id}/pending`, body)),
  resume: (id) => unwrap(apiClient.post(`/engineering/${id}/resume`)),
  reschedule: (id, expectedDate, note) => unwrap(apiClient.post(`/engineering/${id}/reschedule`, { expected_date: expectedDate || null, note })),
  escalate: (id, note) => unwrap(apiClient.post(`/engineering/${id}/escalate`, { note })),
  cancel: (id, note) => unwrap(apiClient.post(`/engineering/${id}/cancel`, { note })),
};
