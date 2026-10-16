import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

/**
 * Single HTTP client. Authentication uses the httpOnly session cookie set by the
 * API (the token is never readable by JavaScript). X-Requested-With satisfies the
 * API's CSRF check for cookie-authenticated writes.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

let onUnauthorized = null;
let onForbidden = null;
export function setAuthHandlers({ unauthorized, forbidden }) {
  onUnauthorized = unauthorized;
  onForbidden = forbidden;
}

export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function normalizeError(error) {
  if (error instanceof ApiError) return error;
  if (error.response) {
    const body = error.response.data?.error;
    return new ApiError({
      status: error.response.status,
      code: body?.code || 'HTTP_ERROR',
      message: body?.message || `Request failed (${error.response.status}).`,
      details: body?.details,
    });
  }
  if (error.code === 'ECONNABORTED') {
    return new ApiError({ status: 0, code: 'TIMEOUT', message: 'The server took too long to respond. Try again.' });
  }
  return new ApiError({ status: 0, code: 'NETWORK', message: 'Cannot reach the server. Check your connection.' });
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const err = normalizeError(error);
    const url = error.config?.url || '';
    const isAuthProbe = url.includes('/auth/login') || url.includes('/auth/me');
    if (err.status === 401 && !isAuthProbe && onUnauthorized) onUnauthorized(err);
    if (err.status === 403 && onForbidden) onForbidden(err);
    return Promise.reject(err);
  },
);

export const unwrap = (p) => p.then((r) => r.data);

/** Absolute URL for a file served by the API (e.g. /api/v1/uploads/12). */
export function fileUrl(path) {
  const base = new URL(API_BASE_URL, window.location.origin);
  return `${base.origin}${path}`;
}

export default apiClient;
