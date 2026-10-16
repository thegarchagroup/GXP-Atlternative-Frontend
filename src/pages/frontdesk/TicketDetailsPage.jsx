import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { PageLoader } from '../../components/common/LoadingSpinner';
import EmptyState, { ErrorBanner } from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TicketDetails from '../../components/tickets/TicketDetails';
import TicketTimeline from '../../components/tickets/TicketTimeline';
import AssignmentDialog from '../../components/tickets/AssignmentDialog';
import InspectionResults from '../../components/tickets/InspectionResults';
import ReadinessPanel from '../../components/tickets/ReadinessPanel';
import RepairCard from '../../components/tickets/RepairCard';
import { useApi } from '../../hooks/useApi';
import { turnoverService } from '../../services/turnoverService';
import { engineeringService } from '../../services/engineeringService';
import { useToast } from '../../context/ToastContext';
import { POLL_INTERVAL_MS, PRIORITIES } from '../../utils/constants';
import { formatDateTime } from '../../utils/dateHelpers';
import { departmentLabel, statusLabel } from '../../utils/statusHelpers';

const TABS = ['Inspections', 'Repairs', 'Assignments', 'Timeline'];
const HK_ASSIGNABLE = ['AWAITING_HOUSEKEEPING', 'HOUSEKEEPING_ASSIGNED', 'HOUSEKEEPING_IN_PROGRESS', 'RECLEAN_REQUIRED'];

export default function TicketDetailsPage() {
  const { ticketId } = useParams();
  const toast = useToast();
  const [tab, setTab] = useState('Inspections');
  const [dialog, setDialog] = useState(null);
  const ticket = useApi(() => turnoverService.get(ticketId), [ticketId], { interval: POLL_INTERVAL_MS });
  const timeline = useApi(() => turnoverService.timeline(ticketId), [ticketId, tab === 'Timeline'], { enabled: tab === 'Timeline' });

  if (ticket.loading && !ticket.data) return <PageLoader />;
  if (ticket.error && !ticket.data) return <ErrorBanner error={ticket.error} onRetry={ticket.reload} />;
  const t = ticket.data;
  const open = !['CLOSED', 'CANCELLED'].includes(t.status);
  const act = async (fn, msg) => {
    try { const r = await fn(); if (r && 'assignments' in r) ticket.setData(r); else ticket.refresh(); toast.success(msg); } catch (e) { toast.error(e); }
  };

  return (
    <>
      <PageHeader title={`Ticket ${t.ticket_number}`} subtitle={`Room ${t.room_number} | ${statusLabel(t.status)}`}
        back={<Link to="/frontdesk/tickets" className="mb-1 inline-flex items-center gap-1 text-sm text-harbor-700 hover:underline"><ArrowLeft className="h-4 w-4" />Tickets</Link>}
        actions={open && (
          <>
            {HK_ASSIGNABLE.includes(t.status) && (
              <Button variant="secondary" onClick={() => setDialog('assign')}>{t.assigned_housekeeper ? 'Reassign housekeeper' : 'Assign housekeeper'}</Button>
            )}
            <Button variant="danger" onClick={() => setDialog('cancel')}>Cancel ticket</Button>
          </>
        )} />

      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-4">
          <TicketDetails ticket={t} />
          {open && (
            <div className="panel p-4">
              <Select label="Priority" value={t.priority} options={PRIORITIES.map((p) => ({ value: p, label: statusLabel(p) }))}
                onChange={(e) => act(() => turnoverService.setPriority(t.id, e.target.value), 'Priority updated.')} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <ReadinessPanel readiness={t.readiness} ticket={t} onRelease={() => act(() => turnoverService.release(t.id), `Room ${t.room_number} is ready for guests.`)} />
          <section className="panel">
            <div className="flex gap-1 overflow-x-auto border-b border-mist px-2" role="tablist">
              {TABS.map((name) => (
                <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => setTab(name)}
                  className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm ${tab === name ? 'border-brass font-semibold text-harbor-800' : 'border-transparent text-gray-600 hover:text-harbor-700'}`}>
                  {name}{name === 'Repairs' && t.repairs.length ? ` (${t.repairs.length})` : ''}
                </button>
              ))}
            </div>
            <div className="p-4" role="tabpanel">
              {tab === 'Inspections' && (t.sessions.length === 0
                ? <EmptyState title="No inspections yet" message="Housekeeping results appear here once work starts." />
                : <div className="space-y-6">{[...t.sessions].reverse().map((s) => <InspectionResults key={s.id} session={s} />)}</div>)}
              {tab === 'Repairs' && (t.repairs.length === 0
                ? <EmptyState title="No repairs" message="A repair request is raised automatically when an inspection item fails." />
                : <div className="space-y-3">{t.repairs.map((r) => (
                  <RepairCard key={r.id} repair={r} actions={(
                    <>
                      {['NEW', 'ASSIGNED', 'REOPENED', 'IN_PROGRESS'].includes(r.status) && open && (
                        <Button size="sm" variant="secondary" onClick={() => setDialog({ type: 'eng', repair: r })}>
                          {r.assigned_engineer ? 'Reassign engineer' : 'Assign engineer'}
                        </Button>
                      )}
                      {r.status === 'COMPLETED' && open && (
                        <Button size="sm" variant="secondary" onClick={() => setDialog({ type: 'reopen', repair: r })}>Reopen repair</Button>
                      )}
                    </>
                  )} />
                ))}</div>)}
              {tab === 'Assignments' && (
                <ul className="divide-y divide-gray-100">
                  {t.assignments.length === 0 && <li className="py-4 text-sm text-gray-500">No assignments yet.</li>}
                  {t.assignments.map((a) => (
                    <li key={a.id} className="py-2.5 text-sm">
                      <p><span className="font-medium">{a.assignee?.display_name}</span> ({departmentLabel(a.department)}{a.repair_id ? ', repair' : ''})
                        {a.previous_assignee && <span className="text-gray-600"> replacing {a.previous_assignee.display_name}</span>}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(a.assigned_at)} by {a.assigned_by?.display_name}{a.reason ? ` | ${a.reason}` : ''}</p>
                    </li>
                  ))}
                </ul>
              )}
              {tab === 'Timeline' && (timeline.loading ? <PageLoader /> : <TicketTimeline entries={timeline.data || []} />)}
            </div>
          </section>
        </div>
      </div>

      <AssignmentDialog open={dialog === 'assign'} title="Assign housekeeper" department="HOUSEKEEPING" currentId={t.assigned_housekeeper?.id}
        onClose={() => setDialog(null)}
        onAssign={async (id, reason) => { ticket.setData(await turnoverService.assign(t.id, id, reason)); toast.success('Housekeeper assigned.'); }} />
      <AssignmentDialog open={dialog?.type === 'eng'} title="Assign engineer" department="ENGINEERING" currentId={dialog?.repair?.assigned_engineer?.id}
        onClose={() => setDialog(null)}
        onAssign={async (id, reason) => { await engineeringService.assign(dialog.repair.id, id, reason); ticket.refresh(); toast.success('Engineer assigned.'); }} />
      <ConfirmDialog open={dialog?.type === 'reopen'} title={`Reopen ${dialog?.repair?.repair_number}?`} confirmLabel="Reopen repair" variant="danger"
        message="The room goes back to engineering and cannot be released until the repair is completed again."
        reasonLabel="What is still wrong?" onCancel={() => setDialog(null)}
        onConfirm={async (reason) => { await act(() => engineeringService.reopen(dialog.repair.id, reason), 'Repair reopened.'); setDialog(null); }} />
      <ConfirmDialog open={dialog === 'cancel'} title="Cancel this ticket?" confirmLabel="Cancel ticket" variant="danger"
        message="Use this only for exceptional cases. Open repairs are cancelled too, and the room is taken out of service."
        reasonLabel="Reason" onCancel={() => setDialog(null)}
        onConfirm={async (reason) => { await act(() => turnoverService.cancel(t.id, reason, 'OUT_OF_SERVICE'), 'Ticket cancelled.'); setDialog(null); }} />
    </>
  );
}
