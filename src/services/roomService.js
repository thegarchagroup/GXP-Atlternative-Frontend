import apiClient, { unwrap } from './apiClient';

export const roomService = {
  list: (params) => unwrap(apiClient.get('/rooms', { params })),
  get: (id) => unwrap(apiClient.get(`/rooms/${id}`)),
  create: (body) => unwrap(apiClient.post('/rooms', body)),
  update: (id, body) => unwrap(apiClient.put(`/rooms/${id}`, body)),
  overrideStatus: (id, operationalStatus, reason) =>
    unwrap(apiClient.patch(`/rooms/${id}/status`, { operational_status: operationalStatus, reason })),
  setOccupancy: (id, occupancyStatus, reason) =>
    unwrap(apiClient.patch(`/rooms/${id}/occupancy`, { occupancy_status: occupancyStatus, reason })),
  history: (id) => unwrap(apiClient.get(`/rooms/${id}/history`)),
  types: () => unwrap(apiClient.get('/rooms/types')),
  createType: (body) => unwrap(apiClient.post('/rooms/types', body)),
  updateType: (id, body) => unwrap(apiClient.put(`/rooms/types/${id}`, body)),
};
