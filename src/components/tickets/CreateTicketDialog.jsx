import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Select from '../common/Select';
import Button from '../common/Button';
import { Textarea } from '../common/Input';
import { ErrorBanner } from '../common/EmptyState';
import { turnoverService } from '../../services/turnoverService';
import { userService } from '../../services/userService';
import { roomService } from '../../services/roomService';
import { PRIORITIES } from '../../utils/constants';
import { statusLabel } from '../../utils/statusHelpers';

/** Record a checkout and open a turnover ticket. */
export default function CreateTicketDialog({ open, room, onClose, onCreated }) {
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ room_id: '', priority: 'NORMAL', assigned_housekeeper_id: '', notes: '' });
  const [duplicate, setDuplicate] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ room_id: room ? String(room.id) : '', priority: 'NORMAL', assigned_housekeeper_id: '', notes: '' });
    setDuplicate(null);
    setReason('');
    setError(null);
    userService.staff('HOUSEKEEPING').then(setStaff).catch(() => setStaff([]));
    if (!room) roomService.list({ page_size: 500 }).then((p) => setRooms(p.items)).catch(setError);
  }, [open, room]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = {
        room_id: Number(form.room_id),
        priority: form.priority,
        notes: form.notes.trim() || null,
        assigned_housekeeper_id: form.assigned_housekeeper_id ? Number(form.assigned_housekeeper_id) : null,
      };
      if (duplicate) Object.assign(body, { allow_duplicate: true, duplicate_reason: reason.trim() });
      const ticket = await turnoverService.create(body);
      onCreated?.(ticket);
      onClose();
    } catch (err) {
      if (err.code === 'DUPLICATE_ACTIVE_TICKET' && !duplicate) setDuplicate(err);
      else setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={room ? `Record checkout for room ${room.room_number}` : 'Record checkout'}
      description="Opens a turnover ticket. The room stays out of the ready pool until housekeeping (and engineering, if needed) sign it off."
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={busy} disabled={!form.room_id || (duplicate && reason.trim().length < 3)}>
            {duplicate ? 'Open additional ticket' : 'Open ticket'}
          </Button>
        </>
      )}>
      <div className="space-y-3">
        <ErrorBanner error={error} />
        {!room && (
          <Select label="Room" required value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} placeholder="Choose a room…"
            options={rooms.map((r) => ({ value: String(r.id), label: `${r.room_number} | floor ${r.floor} | ${statusLabel(r.operational_status)}` }))} />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            options={PRIORITIES.map((p) => ({ value: p, label: statusLabel(p) }))} />
          <Select label="Housekeeper" value={form.assigned_housekeeper_id} placeholder="Assign later"
            onChange={(e) => setForm({ ...form, assigned_housekeeper_id: e.target.value })}
            options={staff.map((s) => ({ value: String(s.id), label: s.display_name }))} />
        </div>
        <Textarea label="Notes for housekeeping" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        {duplicate && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-900">{duplicate.message}</p>
            <p className="mt-1 text-sm text-amber-900">Only open another ticket for an exceptional case. Explain why; it is kept in the audit trail.</p>
            <Textarea className="mt-2" label="Reason for exception" required value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          </div>
        )}
      </div>
    </Modal>
  );
}
