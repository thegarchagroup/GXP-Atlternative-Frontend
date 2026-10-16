import { useState } from 'react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';

/** Shows what still blocks Ready for Guest, and the release action when allowed. */
export default function ReadinessPanel({ readiness, ticket, onRelease }) {
  const [confirm, setConfirm] = useState(false);
  if (!readiness || ['CLOSED', 'CANCELLED'].includes(ticket.status)) return null;
  return (
    <section className={`rounded-[10px] border p-4 ${readiness.ready ? 'border-emerald-300 bg-emerald-50' : 'border-mist bg-white'}`} aria-label="Release checks">
      {readiness.ready ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-900"><CheckCircle2 className="h-5 w-5" />All checks have passed. The room can be released.</p>
          {readiness.can_release
            ? <Button variant="success" onClick={() => setConfirm(true)}>Mark ready for guest</Button>
            : <p className="text-xs text-emerald-900">The front desk or assigned staff can release it.</p>}
        </div>
      ) : (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold"><CircleAlert className="h-4 w-4 text-amber-600" />Before this room can be released</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-6 text-sm text-gray-700">
            {readiness.blockers.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </>
      )}
      <ConfirmDialog open={confirm} title={`Release room ${ticket.room_number}?`}
        message="The room will show as Ready for Guest and the ticket will close. This is recorded with your name."
        confirmLabel="Mark ready for guest" variant="success" onCancel={() => setConfirm(false)}
        onConfirm={async () => { await onRelease(); setConfirm(false); }} />
    </section>
  );
}
