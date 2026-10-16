import apiClient, { unwrap } from './apiClient';

export const checklistService = {
  list: (params) => unwrap(apiClient.get('/checklists', { params })),
  get: (id) => unwrap(apiClient.get(`/checklists/${id}`)),
  create: (body) => unwrap(apiClient.post('/checklists', body)),
  update: (id, body) => unwrap(apiClient.put(`/checklists/${id}`, body)),
  remove: (id) => unwrap(apiClient.delete(`/checklists/${id}`)),
  addItem: (id, body) => unwrap(apiClient.post(`/checklists/${id}/items`, body)),
  updateItem: (itemId, body) => unwrap(apiClient.put(`/checklists/items/${itemId}`, body)),
  removeItem: (itemId) => unwrap(apiClient.delete(`/checklists/items/${itemId}`)),
};
