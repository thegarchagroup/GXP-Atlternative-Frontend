import apiClient, { unwrap } from './apiClient';

export const dailySheetService = {
  upload: (file, taskDate) => {
    const form = new FormData();
    form.append('file', file);
    if (taskDate) form.append('task_date', taskDate);
    return unwrap(apiClient.post('/housekeeping/daily-sheets/upload', form, { timeout: 120000 }));
  },
  list: () => unwrap(apiClient.get('/housekeeping/daily-sheets')),
  byDate: (taskDate) => unwrap(apiClient.get(`/housekeeping/daily-sheets/by-date/${taskDate}`)),
  addMissingRooms: (sheetId) => unwrap(apiClient.post(`/housekeeping/daily-sheets/${sheetId}/add-missing-rooms`)),
  assign: (sheetId, body) => unwrap(apiClient.post(`/housekeeping/daily-sheets/${sheetId}/assign`, body)),
  runsheet: (taskDate) => unwrap(apiClient.get('/housekeeping/runsheet', { params: taskDate ? { task_date: taskDate } : {} })),
  entry: (id) => unwrap(apiClient.get(`/housekeeping/runsheet/${id}`)),
  start: (id) => unwrap(apiClient.post(`/housekeeping/runsheet/${id}/start`)),
  save: (id, items) => unwrap(apiClient.put(`/housekeeping/runsheet/${id}/form`, { items })),
  finish: (id, items, notes) => unwrap(apiClient.post(`/housekeeping/runsheet/${id}/finish`, { items, notes })),
};
