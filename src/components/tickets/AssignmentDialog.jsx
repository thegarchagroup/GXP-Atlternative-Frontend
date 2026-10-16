import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Select from '../common/Select';
import Button from '../common/Button';
import { Textarea } from '../common/Input';
import { ErrorBanner } from '../common/EmptyState';
import { userService } from '../../services/userService';

export default function AssignmentDialog({ open, title, department, currentId, onAssign, onClose }) {
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(currentId ? String(currentId) : '');
    setReason('');
    setError(null);
    userService.staff(department).then(setStaff).catch(setError);
  }, [open, department, currentId]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onAssign(Number(selected), reason.trim() || null);
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" footer={(
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={busy} disabled={!selected || Number(selected) === currentId}>Assign</Button>
      </>
    )}>
      <div className="space-y-3">
        <ErrorBanner error={error} />
        <Select label="Staff member" required value={selected} onChange={(e) => setSelected(e.target.value)} placeholder="Choose…"
          options={staff.map((s) => ({ value: String(s.id), label: `${s.display_name} (${s.user_id})` }))}
          help={staff.length === 0 ? 'No active staff in this department. Add users first.' : undefined} />
        {currentId && <Textarea label="Reason for reassignment" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />}
      </div>
    </Modal>
  );
}
