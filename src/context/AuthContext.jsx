import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { setAuthHandlers } from '../services/apiClient';
import { setHotelTimezone } from '../utils/dateHelpers';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | anonymous
  const [sessionMessage, setSessionMessage] = useState('');

  const applySession = useCallback((data) => {
    setHotelTimezone(data.hotel_timezone);
    setUser(data.user);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback((message = '') => {
    setUser(null);
    setStatus('anonymous');
    setSessionMessage(message);
  }, []);

  useEffect(() => {
    setAuthHandlers({
      unauthorized: (err) => clearSession(err?.message || 'Your session has ended. Please sign in again.'),
      forbidden: () => {},
    });
    let alive = true;
    authService.me()
      .then((data) => alive && applySession(data))
      .catch(() => alive && clearSession());
    return () => { alive = false; };
  }, [applySession, clearSession]);

  const login = useCallback(async (department, userId, password) => {
    const data = await authService.login(department, userId, password);
    setSessionMessage('');
    applySession(data);
    return data.user;
  }, [applySession]);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* session may already be gone */ }
    clearSession('You have signed out.');
  }, [clearSession]);

  const changePassword = useCallback(async (current, next) => {
    const data = await authService.changePassword(current, next);
    applySession(data);
  }, [applySession]);

  const value = useMemo(() => ({
    user, status, sessionMessage, login, logout, changePassword,
    isAdmin: user?.department === 'FRONT_DESK',
  }), [user, status, sessionMessage, login, logout, changePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
