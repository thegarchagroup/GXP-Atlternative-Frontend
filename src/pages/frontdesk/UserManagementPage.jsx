import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable, { Pagination } from '../../components/common/DataTable';
import { ErrorBanner } from '../../components/common/EmptyState';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { MANAGEABLE_ROLES, roleLabel } from '../../utils/constants';
import { formatDateTime } from '../../utils/dateHelpers';
import { validatePassword, validateUserId } from '../../utils/validators';

const PAGE_TEXT = {
  ADMIN: { title: 'Supervisors & admins', subtitle: 'Front Desk admins and the Housekeeping and Engineering supervisors.', noun: 'user' },
  HK_SUPERVISOR: { title: 'Room attendants', subtitle: 'Your housekeeping team.', noun: 'room attendant' },
  ENG_SUPERVISOR: { title: 'Technicians', subtitle: 'Your engineering team.', noun: 'technician' },
};

function UserForm({ open, user, onClose, onSaved, roleOptions, noun }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    const only = roleOptions.length === 1 ? roleOptions[0].value : '';
    setForm(user ? { display_name: user.display_name, role: user.role } : { user_id: '', display_name: '', role: only, password: '' });
    setErrors({});
    setApiError(null);
  }, [open, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!user) {
      const idErr = validateUserId(form.user_id?.trim());
      if (idErr) errs.user_id = idErr;
      const pwErr = validatePassword(form.password);
      if (pwErr) errs.password = pwErr;
    }
    if (!form.display_name?.trim()) errs.display_name = 'Display name is required.';
    const role = form.role || (roleOptions.length === 1 ? roleOptions[0].value : '');
    if (!role) errs.role = 'Choose a role.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setApiError(null);
    try {
      const saved = user
        ? await userService.update(user.id, { display_name: form.display_name.trim(), role })
        : await userService.create({ ...form, role, user_id: form.user_id.trim(), display_name: form.display_name.trim() });
      onSaved(saved, !user);
      onClose();
    } catch (err) { setApiError(err); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={user ? `Edit ${user.user_id}` : `Create ${noun}`} footer={(
      <><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="user-form" loading={busy}>{user ? 'Save changes' : `Create ${noun}`}</Button></>
    )}>
      <form id="user-form" onSubmit={submit} className="space-y-3" noValidate>
        <ErrorBanner error={apiError} />
        {!user && <Input label="User ID" required value={form.user_id || ''} error={errors.user_id} help="Used to sign in, e.g. hk.anita"
          onChange={(e) => setForm({ ...form, user_id: e.target.value })} autoComplete="off" />}
        <Input label="Display name" required value={form.display_name || ''} error={errors.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
        {roleOptions.length <= 1 && errors.role && <p className="error-text">{errors.role}</p>}
        {roleOptions.length > 1 && (
          <Select label="Role" required value={form.role || ''} error={errors.role} placeholder="Choose…" options={roleOptions}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            help={user && form.role !== user.role ? 'Changing the role signs the user out.' : 'Supervisors sign in under their department.'} />
        )}
        {!user && <Input label="Initial password" type="password" required value={form.password || ''} error={errors.password} autoComplete="new-password"
          help="They will be asked to choose their own at first sign-in." onChange={(e) => setForm({ ...form, password: e.target.value })} />}
      </form>
    </Modal>
  );
}

function ResetPasswordDialog({ user, onClose }) {
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPw(''); setError(null); }, [user]);
  const submit = async () => {
    const msg = validatePassword(pw);
    if (msg) { setError({ message: msg }); return; }
    setBusy(true);
    try { await userService.resetPassword(user.id, pw); toast.success(`Password reset for ${user.user_id}.`); onClose(); }
    catch (err) { setError(err); } finally { setBusy(false); }
  };
  return (
    <Modal open={!!user} onClose={onClose} size="sm" title={`Reset password for ${user?.user_id}`}
      description="Their current sessions end and they must choose a new password at next sign-in."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Reset password</Button></>}>
      <ErrorBanner error={error} />
      <Input className="mt-2" label="Temporary password" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
    </Modal>
  );
}

export default function UserManagementPage() {
  const { user: me } = useAuth();
  const text = PAGE_TEXT[me.role] || PAGE_TEXT.ADMIN;
  const roleOptions = useMemo(() => (MANAGEABLE_ROLES[me.role] || []).map((r) => ({ value: r, label: roleLabel(r) })), [me.role]);
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', role: '', is_active: '' });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
  const { data, loading, error, reload, refresh } = useApi(() => userService.list({ ...params, page, page_size: 25 }), [JSON.stringify(params), page]);
  const set = (k) => (e) => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); };

  const columns = [
    { key: 'user_id', header: 'User ID', render: (u) => <span className="font-medium">{u.user_id}</span> },
    { key: 'display_name', header: 'Name' },
    { key: 'role', header: 'Role', render: (u) => roleLabel(u.role) },
    { key: 'is_active', header: 'Status', render: (u) => (u.is_active ? <span className="text-emerald-800">Active</span> : <span className="text-gray-500">Inactive</span>) },
    { key: 'last_login_at', header: 'Last sign-in', render: (u) => formatDateTime(u.last_login_at) },
    { key: 'a', header: <span className="sr-only">Actions</span>, className: 'text-right', render: (u) => (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(u)}>Edit</Button>
        <Button size="sm" variant="ghost" onClick={() => setResetting(u)}>Reset password</Button>
        {u.id !== me.id && <Button size="sm" variant="ghost" onClick={() => setConfirm({ type: 'status', user: u })}>{u.is_active ? 'Deactivate' : 'Activate'}</Button>}
        {u.id !== me.id && <Button size="sm" variant="ghost" className="text-red-700" onClick={() => setConfirm({ type: 'delete', user: u })}>Delete</Button>}
      </div>
    ) },
  ];

  const runConfirm = async () => {
    const { type, user } = confirm;
    try {
      if (type === 'status') { await userService.setStatus(user.id, !user.is_active); toast.success(`${user.user_id} ${user.is_active ? 'deactivated' : 'activated'}.`); }
      else { const r = await userService.remove(user.id); toast.success(r.message); }
      refresh();
    } catch (err) { toast.error(err); }
    setConfirm(null);
  };

  return (
    <>
      <PageHeader title={text.title} subtitle={text.subtitle} actions={<Button icon={Plus} onClick={() => setEditing('new')}>Create {text.noun}</Button>} />
      <section className="panel">
        <div className="grid gap-3 border-b border-mist p-4 sm:grid-cols-3">
          <Input label="Search" value={filters.search} onChange={set('search')} placeholder="Name or user ID" />
          {roleOptions.length > 1 ? <Select label="Role" value={filters.role} onChange={set('role')} placeholder="All" options={roleOptions} /> : <div />}
          <Select label="Status" value={filters.is_active} onChange={set('is_active')} placeholder="All"
            options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} />
        </div>
        {error && <div className="p-4"><ErrorBanner error={error} onRetry={reload} /></div>}
        <DataTable columns={columns} rows={data?.items || []} loading={loading} caption="Users" emptyTitle="No users match" />
        <Pagination page={page} pageSize={25} total={data?.total || 0} onPage={setPage} />
      </section>
      <UserForm open={!!editing} user={editing === 'new' ? null : editing} onClose={() => setEditing(null)} roleOptions={roleOptions} noun={text.noun}
        onSaved={(u, created) => { toast.success(created ? `User ${u.user_id} created.` : 'User updated.'); refresh(); }} />
      <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />
      <ConfirmDialog open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={runConfirm}
        variant={confirm?.type === 'delete' || confirm?.user?.is_active ? 'danger' : 'primary'}
        title={confirm?.type === 'delete' ? `Delete ${confirm?.user?.user_id}?` : `${confirm?.user?.is_active ? 'Deactivate' : 'Activate'} ${confirm?.user?.user_id}?`}
        confirmLabel={confirm?.type === 'delete' ? 'Delete user' : confirm?.user?.is_active ? 'Deactivate' : 'Activate'}
        message={confirm?.type === 'delete'
          ? 'Users with ticket or audit history are archived (deactivated) instead of erased, so records stay intact.'
          : confirm?.user?.is_active ? 'They are signed out immediately and cannot sign in until reactivated.' : undefined} />
    </>
  );
}
