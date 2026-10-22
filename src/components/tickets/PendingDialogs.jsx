import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Select from '../common/Select';
import Input, { Checkbox, Textarea } from '../common/Input';
import { ErrorBanner } from '../common/EmptyState';
import { PENDING_REASONS } from '../../utils/constants';

/** Technician: this can't be fixed now. */
export function NotDoableDialog({ open, repair, onClose, onSubmit }) {
  const [form, setForm] = useState({ reason: '', note: '', expected_date: '', room_sellable: true });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setForm({ reason: '', note: '', expected_date: '', room_sellable: true }); setError(null); } }, [open, repair]);
  const submit = async () => {
    if (!form.reason || form.note.trim().length < 2) { setError({ message: 'Choose a reason and say what is needed.' }); return; }
    setBusy(true);
    try { await onSubmit({ ...form, note: form.note.trim(), expected_date: form.expected_date || null }); onClose(); }
    catch (e) { setError(e); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Not doable now" description="The repair moves to the pending list so it can be tracked and followed up."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Move to pending</Button></>}>
      <div className="space-y-3">
        <ErrorBanner error={error} />
        <Select label="Reason" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Choose…"
          options={Object.entries(PENDING_REASONS).map(([value, label]) => ({ value, label }))} />
        <Textarea label="What is needed?" required rows={3} value={form.note} placeholder="e.g. Compressor capacitor ordered from supplier"
          onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <Input label="Expected by" type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })}
          help="Optional. Shown as overdue on the pending list after this date." />
        <Checkbox label="Room can still be sold" checked={form.room_sellable} onChange={(v) => setForm({ ...form, room_sellable: v })}
          help="Untick if guests can't use the room until it's fixed. It then stays off sale." />
      </div>
    </Modal>
  );
}

export function RescheduleDialog({ open, repair, onClose, onSubmit }) {
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { if (open) { setDate(repair?.expected_date || ''); setNote(''); setError(null); } }, [open, repair]);
  const submit = async () => {
    setBusy(true);
    try { await onSubmit(date || null, note.trim() || null); onClose(); } catch (e) { setError(e); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} size="sm" title={`Reschedule ${repair?.repair_number || ''}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Save</Button></>}>
      <div className="space-y-3">
        <ErrorBanner error={error} />
        <Input label="Expected by" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Textarea label="Note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Supplier delayed delivery" />
      </div>
    </Modal>
  );
}
