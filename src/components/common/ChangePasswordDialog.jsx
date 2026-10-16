import { useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { ErrorBanner } from './EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { validatePassword } from '../../utils/validators';

export default function ChangePasswordDialog({ open, forced, onClose }) {
  const { changePassword, logout } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ current: '', next: '', repeat: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.current) errs.current = 'Enter your current password.';
    const pwErr = validatePassword(form.next);
    if (pwErr) errs.next = pwErr;
    if (form.next !== form.repeat) errs.repeat = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setApiError(null);
    try {
      await changePassword(form.current, form.next);
      toast.success('Password changed.');
      setForm({ current: '', next: '', repeat: '' });
      onClose?.();
    } catch (err) {
      setApiError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={forced ? undefined : onClose} size="sm"
      title={forced ? 'Set a new password' : 'Change password'}
      description={forced ? 'Your password was set by an administrator. Choose your own before continuing.' : undefined}
      footer={(
        <>
          {forced ? <Button variant="secondary" onClick={logout}>Sign out</Button> : <Button variant="secondary" onClick={onClose}>Cancel</Button>}
          <Button type="submit" form="change-password-form" loading={busy}>Save password</Button>
        </>
      )}>
      <form id="change-password-form" onSubmit={submit} className="space-y-3" noValidate>
        <ErrorBanner error={apiError} />
        <Input label="Current password" type="password" autoComplete="current-password" value={form.current} error={errors.current}
          onChange={(e) => setForm({ ...form, current: e.target.value })} required />
        <Input label="New password" type="password" autoComplete="new-password" value={form.next} error={errors.next}
          help="At least 8 characters with a letter and a number." onChange={(e) => setForm({ ...form, next: e.target.value })} required />
        <Input label="Repeat new password" type="password" autoComplete="new-password" value={form.repeat} error={errors.repeat}
          onChange={(e) => setForm({ ...form, repeat: e.target.value })} required />
      </form>
    </Modal>
  );
}
