import apiClient, { unwrap } from './apiClient';

export const MAX_UPLOAD_MB = 8;
export const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,application/pdf';

export const uploadService = {
  upload: (file, { ticketId, repairId, caption } = {}) => {
    const form = new FormData();
    form.append('file', file);
    if (ticketId) form.append('ticket_id', ticketId);
    if (repairId) form.append('repair_id', repairId);
    if (caption) form.append('caption', caption);
    return unwrap(apiClient.post('/uploads', form));
  },
};
