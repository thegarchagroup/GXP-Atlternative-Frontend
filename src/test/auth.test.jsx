import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import LoginPage from '../pages/LoginPage';
import ProtectedRoute from '../routes/ProtectedRoute';
import DepartmentRoute from '../routes/DepartmentRoute';
import { authService } from '../services/authService';
import { ApiError } from '../services/apiClient';

vi.mock('../services/authService', () => ({ authService: { me: vi.fn(), login: vi.fn(), logout: vi.fn(), changePassword: vi.fn() } }));

const hk = { id: 2, user_id: 'hk.anita', display_name: 'Anita', department: 'HOUSEKEEPING', must_change_password: false };

function app(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider><AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DepartmentRoute allow={['FRONT_DESK']} />}><Route path="/frontdesk" element={<p>front desk area</p>} /></Route>
            <Route element={<DepartmentRoute allow={['HOUSEKEEPING']} />}><Route path="/housekeeping" element={<p>housekeeping area</p>} /></Route>
            <Route path="/unauthorized" element={<p>not allowed</p>} />
          </Route>
        </Routes>
      </AuthProvider></ToastProvider>
    </MemoryRouter>,
  );
}

describe('authentication and route protection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('redirects anonymous users to sign in', async () => {
    authService.me.mockRejectedValue(new ApiError({ status: 401, code: 'UNAUTHORIZED', message: 'no' }));
    app('/frontdesk');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('requires a department before signing in', async () => {
    authService.me.mockRejectedValue(new ApiError({ status: 401, code: 'UNAUTHORIZED', message: 'no' }));
    app('/login');
    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Choose your department.')).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('shows the server message for a wrong department and lands on the right dashboard on success', async () => {
    authService.me.mockRejectedValue(new ApiError({ status: 401, code: 'UNAUTHORIZED', message: 'no' }));
    authService.login
      .mockRejectedValueOnce(new ApiError({ status: 401, code: 'WRONG_DEPARTMENT', message: 'This account does not belong to the selected department.' }))
      .mockResolvedValueOnce({ user: hk, hotel_timezone: 'Asia/Kolkata' });
    app('/login');
    await userEvent.click(await screen.findByText('Engineering'));
    await userEvent.type(screen.getByLabelText(/User ID/), 'hk.anita');
    await userEvent.type(screen.getByLabelText(/^Password/), 'Passw0rd123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText(/does not belong to the selected department/)).toBeInTheDocument();
    await userEvent.click(screen.getByText('Housekeeping'));
    await userEvent.type(screen.getByLabelText(/^Password/), 'Passw0rd123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByText('housekeeping area')).toBeInTheDocument());
    expect(authService.login).toHaveBeenLastCalledWith('HOUSEKEEPING', 'hk.anita', 'Passw0rd123');
  });

  it("blocks another department's pages typed into the URL", async () => {
    authService.me.mockResolvedValue({ user: hk, hotel_timezone: 'UTC' });
    app('/frontdesk');
    expect(await screen.findByText('not allowed')).toBeInTheDocument();
    expect(screen.queryByText('front desk area')).not.toBeInTheDocument();
  });
});
