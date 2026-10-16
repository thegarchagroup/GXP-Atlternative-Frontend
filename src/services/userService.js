import apiClient, { unwrap } from './apiClient';

export const userService = {
  list: (params) => unwrap(apiClient.get('/users', { params })),
  get: (id) => unwrap(apiClient.get(`/users/${id}`)),
  create: (body) => unwrap(apiClient.post('/users', body)),
  update: (id, body) => unwrap(apiClient.put(`/users/${id}`, body)),
  setStatus: (id, isActive) => unwrap(apiClient.patch(`/users/${id}/status`, { is_active: isActive })),
  resetPassword: (id, newPassword) => unwrap(apiClient.post(`/users/${id}/reset-password`, { new_password: newPassword })),
  remove: (id) => unwrap(apiClient.delete(`/users/${id}`)),
  staff: (department) => unwrap(apiClient.get('/dashboard/staff', { params: { department } })),
};
