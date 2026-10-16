import apiClient, { unwrap } from './apiClient';

export const authService = {
  login: (department, userId, password) => unwrap(apiClient.post('/auth/login', { department, user_id: userId, password })),
  logout: () => unwrap(apiClient.post('/auth/logout')),
  me: () => unwrap(apiClient.get('/auth/me')),
  changePassword: (currentPassword, newPassword) =>
    unwrap(apiClient.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword })),
};
