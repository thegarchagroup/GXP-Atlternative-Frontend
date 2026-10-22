import apiClient, { unwrap } from './apiClient';

export const reportService = {
  roomTurnover: (params) => unwrap(apiClient.get('/reports/room-turnover', { params })),
  maintenance: (params) => unwrap(apiClient.get('/reports/maintenance', { params })),
  get: (report, params) => unwrap(apiClient.get(`/reports/export/${report}`, { params: { ...params, format: 'json' } })),
  /** Download an export (xlsx or csv) and save it with the server's file name. */
  download: async (report, params, format) => {
    const res = await apiClient.get(`/reports/export/${report}`, { params: { ...params, format }, responseType: 'blob', timeout: 120000 });
    const match = /filename="([^"]+)"/.exec(res.headers['content-disposition'] || '');
    const url = URL.createObjectURL(res.data);
    const a = Object.assign(document.createElement('a'), { href: url, download: match ? match[1] : `${report}.${format}` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
