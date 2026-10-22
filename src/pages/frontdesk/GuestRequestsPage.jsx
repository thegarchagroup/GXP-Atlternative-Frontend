import { useEffect, useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Textarea } from '../../components/common/Input';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { ErrorBanner } from '../../components/common/EmptyState';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { requestService } from '../../services/requestService';
import { roomService } from '../../services/roomService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { POLL_INTERVAL_MS, PRIORITIES } from '../../utils/constants';
import { statusLabel } from '../../utils/statusHelpers';
import { formatDateTime, formatMinutes, formatTime } from '../../utils/dateHelpers';

const OPEN = ['NEW', 'ASSIGNED', 'IN_PROGRESS'];

function NewRequestDialog({ open, onClose, onCreated }) {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ room_id: '', description: '', priority: 'NORMAL' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setForm({ room_id: '', description: '', priority: 'NORMAL' });
    setError(null);
    roomService.list({ page_size: 500 }).then((p) => setRooms(p.items)).catch(setError);
  }, [open]);
  const submit = async () => {
    if (!form.room_id || form.description.trim().length < 2) { setError({ message: 'Choose a room and describe the request.' }); return; }
    setBusy(true);
    try { onCreated(await requestService.create({ ...form, room_id: Number(form.room_id), description: form.description.trim() })); onClose(); }
    catch (e) { setError(e); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New guest request" description="Goes to the housekeeping supervisor, who assigns a room attendant."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Send to housekeeping</Button></>}>
      <div className="space-y-3">
        <ErrorBanner error={error} />
        <Select label="Room" required value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} placeholder="Choose a room…"
          options={rooms.map((r) => ({ value: String(r.id), label: `${r.room_number}${r.occupancy_status === 'OCCUPIED' ? ' (occupied)' : ''}` }))} />
        <Textarea label="Request" required rows={3} value={form.description} placeholder="e.g. Two extra water bottles; baby cot; iron and board"
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
          options={PRIORITIES.map((p) => ({ value: p, label: statusLabel(p) }))} />
      </div>
    </Modal>
  );
}

/** Front desk: raise and follow requests. HK supervisor: assign them to room attendants. */
export default function GuestRequestsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isFrontDesk = user.role === 'ADMIN';
  const [show, setShow] = useState('open');
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [assigning, setAssigning] = useState({});
  const staff = useApi(() => userService.staff('HOUSEKEEPING'), [], { enabled: !isFrontDesk });
  const list = useApi(() => requestService.list(show === 'open' ? { status: OPEN } : {}), [show], { interval: POLL_INTERVAL_MS });

  const assign = async (r, raId) => {
    setAssigning((a) => ({ ...a, [r.id]: true }));
    try { await requestService.assign(r.id, Number(raId)); toast.success(`Request for room ${r.room_number} assigned.`); list.refresh(); }
    catch (e) { toast.error(e); } finally { setAssigning((a) => ({ ...a, [r.id]: false })); }
  };

  const columns = [
    { key: 'room', header: 'Room', render: (r) => <span className="room-no text-base font-semibold">{r.room_number}</span> },
    { key: 'description', header: 'Request', render: (r) => <span className="block max-w-xs whitespace-normal">{r.description}</span> },
    { key: 'priority', header: 'Priority', render: (r) => <StatusBadge status={r.priority} /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'ra', header: 'Room attendant', render: (r) => (!isFrontDesk && ['NEW', 'ASSIGNED'].includes(r.status) ? (
      <select aria-label={`Room attendant for room ${r.room_number}`} className="control py-1 text-xs" value={r.assigned_ra ? String(r.assigned_ra.id) : ''}
        disabled={assigning[r.id]} onChange={(e) => e.target.value && assign(r, e.target.value)}>
        <option value="">Assign…</option>
        {(staff.data || []).map((u) => <option key={u.id} value={String(u.id)}>{u.display_name}</option>)}
      </select>
    ) : (r.assigned_ra?.display_name || <span className="text-gray-400">Not assigned</span>)) },
    { key: 'times', header: 'Timeline', render: (r) => (
      <span className="block text-xs leading-5 text-gray-600">
        Raised {formatDateTime(r.created_at)} by {r.created_by?.display_name}
        {r.assigned_at && <><br />Assigned {formatTime(r.assigned_at)}</>}
        {r.completed_at && <><br />Done {formatTime(r.completed_at)} ({formatMinutes(r.minutes_to_complete)})</>}
        {r.completion_note && <><br />Note: {r.completion_note}</>}
        {r.cancel_reason && <><br />Cancelled: {r.cancel_reason}</>}
      </span>
    ) },
    { key: 'a', header: <span className="sr-only">Actions</span>, className: 'text-right', render: (r) => (OPEN.includes(r.status)
      ? <Button size="sm" variant="ghost" className="text-red-700" onClick={() => setCancelling(r)}>Cancel</Button> : null) },
  ];

  return (
    <>
      <PageHeader title="Guest requests"
        subtitle={isFrontDesk ? 'Requests for rooms, sent to the housekeeping supervisor.' : 'Requests from the front desk. Assign each one to a room attendant.'}
        actions={isFrontDesk && <Button icon={MessageSquarePlus} onClick={() => setCreating(true)}>New request</Button>} />
      <div className="mb-3 flex gap-1 rounded-lg border border-mist bg-white p-1" role="tablist" style={{ width: 'fit-content' }}>
        {[['open', 'Open'], ['all', 'All']].map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={show === k} onClick={() => setShow(k)}
            className={`rounded-md px-3 py-1.5 text-sm ${show === k ? 'bg-harbor-700 font-semibold text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{label}</button>
        ))}
      </div>
      <ErrorBanner error={list.error} onRetry={list.reload} />
      <section className="panel">
        <DataTable columns={columns} rows={list.data || []} loading={list.loading} caption="Guest requests"
          emptyTitle={show === 'open' ? 'No open requests' : 'No requests yet'} />
      </section>
      <NewRequestDialog open={creating} onClose={() => setCreating(false)}
        onCreated={(r) => { toast.success(`Request ${r.request_number} sent to housekeeping.`); list.refresh(); }} />
      <ConfirmDialog open={!!cancelling} title={`Cancel the request for room ${cancelling?.room_number}?`} confirmLabel="Cancel request" variant="danger"
        reasonLabel="Reason" onCancel={() => setCancelling(null)}
        onConfirm={async (reason) => {
          try { await requestService.cancel(cancelling.id, reason); toast.success('Request cancelled.'); list.refresh(); } catch (e) { toast.error(e); }
          setCancelling(null);
        }} />
    </>
  );
}
