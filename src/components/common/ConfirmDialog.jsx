import { useState } from 'react';
import Button from './Button';
import Modal from './Modal';
import { Textarea } from './Input';

/** Confirmation for important or destructive actions. If `reasonLabel` is set, a reason is collected and required. */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', variant = 'primary', onConfirm, onCancel, reasonLabel, children }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const needsReason = !!reasonLabel;

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(needsReason ? reason.trim() : undefined);
      setReason('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={busy ? undefined : onCancel} title={title} size="sm" footer={(
      <>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button variant={variant} onClick={confirm} loading={busy} disabled={needsReason && reason.trim().length < 3}>{confirmLabel}</Button>
      </>
    )}>
      {message && <p className="text-sm text-gray-700">{message}</p>}
      {children}
      {needsReason && (
        <Textarea className="mt-3" label={reasonLabel} required value={reason} onChange={(e) => setReason(e.target.value)} help="Recorded in the audit trail." />
      )}
    </Modal>
  );
}
