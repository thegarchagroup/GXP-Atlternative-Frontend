import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { ErrorBanner } from '../../components/common/EmptyState';
import StatCard from '../../components/dashboard/StatCard';
import AssignmentDialog from '../../components/tickets/AssignmentDialog';
import { RescheduleDialog } from '../../components/tickets/PendingDialogs';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { engineeringService } from '../../services/engineeringService';
import { useToast } from '../../context/ToastContext';
import { PENDING_REASONS, POLL_INTERVAL_MS } from '../../utils/constants';
import { formatShortDate } from '../../utils/dateHelpers';

/** Repairs that couldn't be done straight away: track, follow up, act. */
export default function PendingRepairsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [dialog, setDialog] = useState(null);
  const list = useApi(engineeringService.pendingList, [], { interval: POLL_INTERVAL_MS });
  const all = list.data || [];
  const rows = all.filter((r) => (!reason || r.pending_reason === reason) && (!onlyOverdue || r.overdue));
  const act = async (fn, msg) => { try { await fn(); toast.success(msg); list.refresh(); } catch (e) { toast.error(e); } };
  const repairLink = (r) => (user.role === 'ENG_SUPERVISOR' ? <Link className="font-medium text-harbor-700 hover:underline" to={`/engineering/repairs/${r.id}`}>{r.repair_number}</Link>
    : <span className="font-medium">{r.repair_number}</span>);

  const columns = [
    { key: 'room', header: 'Room / repair', render: (r) => (
      <span className="block"><span className="room-no text-base font-semibold">{r.room_number}</span>
        <span className="block text-2xs">{repairLink(r)}{r.escalated && <span className="ml-1 font-semibold text-red-700">escalated</span>}</span>
        <span className="block text-2xs text-gray-500">{r.room_sellable ? 'Can be sold' : 'Off sale'}{r.room_occupancy === 'OCCUPIED' ? ' | occupied' : ''}</span></span>
    ) },
    { key: 'defect', header: 'Problem', className: 'whitespace-normal', render: (r) => <span className="block min-w-[9rem] max-w-[12rem] whitespace-normal" title={r.reported_defect}>{r.reported_defect}</span> },
    { key: 'reason', header: 'Waiting for', className: 'whitespace-normal', render: (r) => <span className="block min-w-[11rem] max-w-[15rem] whitespace-normal text-sm"><span className="font-medium">{PENDING_REASONS[r.pending_reason]}</span>
      <span className="block whitespace-pre-line text-xs text-gray-600">{r.pending_note}</span></span> },
    { key: 'tech', header: 'Technician', render: (r) => r.assigned_engineer?.display_name || '—' },
    { key: 'when', header: 'Since / due', render: (r) => (
      <span className="block text-sm">{r.days_pending === 0 ? 'Since today' : `${r.days_pending} day${r.days_pending === 1 ? '' : 's'}`}
        <span className="block text-xs">{r.expected_date
          ? <span className={r.overdue ? 'inline-flex items-center gap-1 font-semibold text-red-700' : 'text-gray-600'}>{r.overdue && <AlertTriangle className="h-3.5 w-3.5" />}by {formatShortDate(r.expected_date)}{r.overdue ? ' (overdue)' : ''}</span>
          : <span className="text-gray-400">no date set</span>}</span></span>
    ) },
    { key: 'priority', header: 'Priority', render: (r) => <StatusBadge status={r.priority} /> },
    { key: 'a', header: <span className="sr-only">Actions</span>, className: 'text-right', render: (r) => (
      <div className="ml-auto flex w-max flex-col items-end">
        <Button size="sm" variant="ghost" onClick={() => setDialog({ type: 'assign', r })}>Reassign</Button>
        <Button size="sm" variant="ghost" onClick={() => setDialog({ type: 'reschedule', r })}>Reschedule</Button>
        {r.escalated ? <span /> : <Button size="sm" variant="ghost" onClick={() => setDialog({ type: 'escalate', r })}>Escalate</Button>}
        <Button size="sm" variant="ghost" className="text-red-700" onClick={() => setDialog({ type: 'cancel', r })}>Cancel</Button>
      </div>
    ) },
  ];
  const r = dialog?.r;

  return (
    <>
      <PageHeader title="Pending repairs" subtitle="Repairs that couldn't be done straight away. Oldest first." />
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Pending" value={all.length} accent="bg-amber-500" />
        <StatCard label="Overdue" value={all.filter((x) => x.overdue).length} accent="bg-red-600" active={onlyOverdue} onClick={() => setOnlyOverdue((v) => !v)} />
        <StatCard label="Rooms off sale" value={all.filter((x) => !x.room_sellable).length} accent="bg-gray-500" />
        <StatCard label="Escalated" value={all.filter((x) => x.escalated).length} accent="bg-red-700" />
      </div>
      <ErrorBanner error={list.error} onRetry={list.reload} />
      <section className="panel">
        <div className="border-b border-mist p-4 sm:max-w-xs">
          <Select label="Waiting for" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Any reason"
            options={Object.entries(PENDING_REASONS).map(([value, label]) => ({ value, label }))} />
        </div>
        <DataTable columns={columns} rows={rows} loading={list.loading} caption="Pending repairs" emptyTitle="Nothing pending"
          emptyMessage="Repairs a technician marks as not doable now appear here." />
      </section>
      <AssignmentDialog open={dialog?.type === 'assign'} title={`Technician for ${r?.repair_number || ''}`} department="ENGINEERING"
        currentId={r?.assigned_engineer?.id} onClose={() => setDialog(null)}
        onAssign={async (id, why) => { await engineeringService.assign(r.id, id, why); toast.success('Technician changed. They resume it when ready.'); list.refresh(); }} />
      <RescheduleDialog open={dialog?.type === 'reschedule'} repair={r} onClose={() => setDialog(null)}
        onSubmit={async (d, note) => { await engineeringService.reschedule(r.id, d, note); toast.success('Expected date updated.'); list.refresh(); }} />
      <ConfirmDialog open={dialog?.type === 'escalate'} title={`Escalate ${r?.repair_number || ''}?`} confirmLabel="Escalate to urgent" variant="danger"
        message="The repair becomes urgent for the engineering team." reasonLabel="Why is it urgent?" onCancel={() => setDialog(null)}
        onConfirm={async (note) => { await act(() => engineeringService.escalate(r.id, note), 'Escalated to urgent.'); setDialog(null); }} />
      <ConfirmDialog open={dialog?.type === 'cancel'} title={`Cancel ${r?.repair_number || ''}?`} confirmLabel="Cancel repair" variant="danger"
        message="Use this when the repair is no longer needed. If the room was off sale for it, it becomes available again." reasonLabel="Reason"
        onCancel={() => setDialog(null)}
        onConfirm={async (note) => { await act(() => engineeringService.cancel(r.id, note), 'Repair cancelled.'); setDialog(null); }} />
    </>
  );
}
