import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import Modal from '../common/Modal';
import Select from '../common/Select';
import Button from '../common/Button';
import { Textarea } from '../common/Input';
import { ErrorBanner } from '../common/EmptyState';
import { engineeringService } from '../../services/engineeringService';
import { userService } from '../../services/userService';
import { roomService } from '../../services/roomService';
import { PRIORITIES } from '../../utils/constants';
import { statusLabel } from '../../utils/statusHelpers';

/** What raising a repair will do to this room, mirroring the API rules. */
export function repairEffect(room) {
  if (!room) return null;
  if (room.active_ticket_id) return `Added to the open turnover ${room.active_ticket_number}. The room can't be released until it's fixed.`;
  if (room.occupancy_status === 'OCCUPIED') return 'The guest stays in the room. Engineering will see that the room is occupied.';
  if (room.operational_status === 'READY_FOR_GUEST') return 'The room is taken off sale until engineering completes the repair, then it is ready again.';
  return `The room stays ${statusLabel(room.operational_status).toLowerCase()}; the repair is tracked against it.`;
}

/** Front desk raises an engineering repair directly (guest complaint, planned maintenance). */
export default function CreateRepairDialog({ open, room, onClose, onCreated }) {
  const [rooms, setRooms] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [form, setForm] = useState({ room_id: '', reported_defect: '', priority: 'NORMAL', engineer_id: '' });
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ room_id: room ? String(room.id) : '', reported_defect: '', priority: 'NORMAL', engineer_id: '' });
    setError(null);
    setTouched(false);
    userService.staff('ENGINEERING').then(setEngineers).catch(() => setEngineers([]));
    if (!room) roomService.list({ page_size: 500 }).then((p) => setRooms(p.items)).catch(setError);
  }, [open, room]);

  const selected = room || rooms.find((r) => String(r.id) === form.room_id);
  const defectError = touched && form.reported_defect.trim().length < 3 ? 'Describe the problem.' : undefined;

  const submit = async () => {
    setTouched(true);
    if (!form.room_id || form.reported_defect.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      const repair = await engineeringService.createDirect({
        room_id: Number(form.room_id),
        reported_defect: form.reported_defect.trim(),
        priority: form.priority,
        engineer_id: form.engineer_id ? Number(form.engineer_id) : null,
      });
      onCreated?.(repair);
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={room ? `Raise a repair for room ${room.room_number}` : 'Raise a repair'}
      description="Sends a job straight to engineering, for example a guest complaint or planned maintenance."
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={busy} disabled={!form.room_id}>Send to engineering</Button>
        </>
      )}>
      <div className="space-y-3">
        <ErrorBanner error={error} />
        {!room && (
          <Select label="Room" required value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} placeholder="Choose a room…"
            options={rooms.map((r) => ({ value: String(r.id), label: `${r.room_number} | floor ${r.floor} | ${r.occupancy_status === 'OCCUPIED' ? 'Occupied' : statusLabel(r.operational_status)}` }))} />
        )}
        <Textarea label="What's wrong?" required rows={3} value={form.reported_defect} error={defectError}
          placeholder="e.g. Guest reports AC not cooling; bathroom tap dripping"
          onChange={(e) => setForm({ ...form, reported_defect: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            options={PRIORITIES.map((p) => ({ value: p, label: statusLabel(p) }))} />
          <Select label="Engineer" value={form.engineer_id} placeholder="Let the team pick it up"
            onChange={(e) => setForm({ ...form, engineer_id: e.target.value })}
            options={engineers.map((u) => ({ value: String(u.id), label: u.display_name }))} />
        </div>
        {selected && (
          <p className="flex items-start gap-2 rounded-md bg-harbor-50 px-3 py-2 text-sm text-harbor-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{repairEffect(selected)}
          </p>
        )}
      </div>
    </Modal>
  );
}
