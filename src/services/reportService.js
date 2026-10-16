import apiClient, { unwrap } from './apiClient';

export const reportService = {
  roomTurnover: (params) => unwrap(apiClient.get('/reports/room-turnover', { params })),
  maintenance: (params) => unwrap(apiClient.get('/reports/maintenance', { params })),
};
