import apiClient, { unwrap } from './apiClient';

const paramsSerializer = { indexes: null }; // status=A&status=B

export const turnoverService = {
  list: (params) => unwrap(apiClient.get('/turnover', { params, paramsSerializer })),
  get: (id) => unwrap(apiClient.get(`/turnover/${id}`)),
  create: (body) => unwrap(apiClient.post('/turnover', body)),
  assign: (id, housekeeperId, reason) => unwrap(apiClient.post(`/turnover/${id}/assign`, { housekeeper_id: housekeeperId, reason })),
  start: (id) => unwrap(apiClient.post(`/turnover/${id}/start`)),
  timeline: (id) => unwrap(apiClient.get(`/turnover/${id}/timeline`)),
  readiness: (id) => unwrap(apiClient.get(`/turnover/${id}/readiness`)),
  release: (id, notes) => unwrap(apiClient.post(`/turnover/${id}/release`, { notes })),
  cancel: (id, reason, roomStatus) => unwrap(apiClient.post(`/turnover/${id}/cancel`, { reason, room_status: roomStatus })),
  setPriority: (id, priority) => unwrap(apiClient.patch(`/turnover/${id}/priority`, { priority })),
};
