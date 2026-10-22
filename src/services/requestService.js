import apiClient, { unwrap } from './apiClient';

export const requestService = {
  list: (params) => unwrap(apiClient.get('/requests', { params, paramsSerializer: { indexes: null } })),
  create: (body) => unwrap(apiClient.post('/requests', body)),
  assign: (id, raId) => unwrap(apiClient.post(`/requests/${id}/assign`, { ra_id: raId })),
  start: (id) => unwrap(apiClient.post(`/requests/${id}/start`)),
  done: (id, note) => unwrap(apiClient.post(`/requests/${id}/done`, { note })),
  cancel: (id, reason) => unwrap(apiClient.post(`/requests/${id}/cancel`, { reason })),
};
