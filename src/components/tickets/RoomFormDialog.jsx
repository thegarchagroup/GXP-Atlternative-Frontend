import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Input, { Textarea } from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { ErrorBanner } from '../common/EmptyState';
import { roomService } from '../../services/roomService';
import { validateRoomNumber } from '../../utils/validators';

export default function RoomFormDialog({ open, room, onClose, onSaved }) {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ room_number: '', floor: '', room_type_id: '', notes: '', is_active: true });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    roomService.types().then(setTypes).catch(setApiError);
    setForm(room ? { room_number: room.room_number, floor: String(room.floor), room_type_id: String(room.room_type.id), notes: room.notes || '', is_active: room.is_active }
      : { room_number: '', floor: '', room_type_id: '', notes: '', is_active: true });
    setErrors({});
    setApiError(null);
  }, [open, room]);

  const submit = async (e) => {
    e?.preventDefault();
    const errs = {};
    const rn = validateRoomNumber(form.room_number.trim());
    if (rn) errs.room_number = rn;
    if (form.floor === '' || Number.isNaN(Number(form.floor))) errs.floor = 'Floor is required.';
    if (!form.room_type_id) errs.room_type_id = 'Choose a room type.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setApiError(null);
    try {
      const body = { room_number: form.room_number.trim(), floor: Number(form.floor), room_type_id: Number(form.room_type_id), notes: form.notes || null };
      const saved = room ? await roomService.update(room.id, { ...body, is_active: form.is_active }) : await roomService.create(body);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setApiError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={room ? `Edit room ${room.room_number}` : 'Add room'} footer={(
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="room-form" loading={busy}>{room ? 'Save changes' : 'Add room'}</Button>
      </>
    )}>
      <form id="room-form" onSubmit={submit} className="space-y-3" noValidate>
        <ErrorBanner error={apiError} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Room number" required value={form.room_number} error={errors.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
          <Input label="Floor" type="number" required value={form.floor} error={errors.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
        </div>
        <Select label="Room type" required value={form.room_type_id} error={errors.room_type_id} placeholder="Choose…"
          onChange={(e) => setForm({ ...form, room_type_id: e.target.value })}
          options={types.filter((t) => t.is_active || String(t.id) === form.room_type_id).map((t) => ({ value: String(t.id), label: t.name }))} />
        <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        {room && (
          <Select label="Availability" value={form.is_active ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'yes' })}
            options={[{ value: 'yes', label: 'Active (in inventory)' }, { value: 'no', label: 'Inactive (removed from inventory)' }]} />
        )}
      </form>
    </Modal>
  );
}
