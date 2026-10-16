import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Play } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/EmptyState';
import TicketDetails from '../../components/tickets/TicketDetails';
import ReadinessPanel from '../../components/tickets/ReadinessPanel';
import RepairCard from '../../components/tickets/RepairCard';
import InspectionResults from '../../components/tickets/InspectionResults';
import { useApi, useAction } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { turnoverService } from '../../services/turnoverService';
import { housekeepingService } from '../../services/housekeepingService';
import { useToast } from '../../context/ToastContext';
import { POLL_INTERVAL_MS } from '../../utils/constants';

const NEXT_STEP = {
  HOUSEKEEPING_ASSIGNED: 'Start when you enter the room. The checklist opens straight away.',
  RECLEAN_REQUIRED: 'Engineering finished a repair here. Clean the room again and repeat the inspection.',
  HOUSEKEEPING_IN_PROGRESS: 'Your checklist is in progress.',
  ENGINEERING_REQUIRED: 'Waiting for an engineer to take the repair.',
  ENGINEERING_ASSIGNED: 'An engineer is assigned and will start soon.',
  ENGINEERING_IN_PROGRESS: 'An engineer is repairing the room.',
  AWAITING_FINAL_VERIFICATION: 'All checks passed. The room can be released.',
  CLOSED: 'This room has been released to guests.',
  CANCELLED: 'The front desk cancelled this ticket.',
};

export default function HousekeepingTicketPage() {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const ticket = useApi(() => turnoverService.get(ticketId), [ticketId], { interval: POLL_INTERVAL_MS });
  const [start, starting] = useAction(async () => {
    try {
      await housekeepingService.start(ticketId);
      navigate(`/housekeeping/tickets/${ticketId}/inspection`);
    } catch (e) { toast.error(e); ticket.refresh(); }
  });

  if (ticket.loading && !ticket.data) return <PageLoader />;
  if (ticket.error && !ticket.data) return <ErrorBanner error={ticket.error} onRetry={ticket.reload} />;
  const t = ticket.data;
  const mine = t.assigned_housekeeper?.id === user.id;
  const canStart = mine && ['HOUSEKEEPING_ASSIGNED', 'RECLEAN_REQUIRED'].includes(t.status);
  const inProgress = mine && t.status === 'HOUSEKEEPING_IN_PROGRESS';
  const hkSessions = t.sessions.filter((s) => s.kind === 'HOUSEKEEPING' && s.status !== 'SUPERSEDED');

  return (
    <>
      <PageHeader title={`Room ${t.room_number}`} subtitle={NEXT_STEP[t.status]}
        back={<Link to="/housekeeping" className="mb-1 inline-flex items-center gap-1 text-sm text-harbor-700 hover:underline"><ArrowLeft className="h-4 w-4" />My rooms</Link>}
        actions={(
          <>
            {canStart && <Button size="lg" icon={Play} loading={starting} onClick={start}>{t.status === 'RECLEAN_REQUIRED' ? 'Start re-cleaning' : 'Start work'}</Button>}
            {inProgress && <Button size="lg" icon={ClipboardCheck} onClick={() => navigate(`/housekeeping/tickets/${t.id}/inspection`)}>Continue checklist</Button>}
          </>
        )} />
      {!mine && <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">This room is now assigned to someone else. You can view it but not change it.</p>}
      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <TicketDetails ticket={t} />
        <div className="space-y-4">
          <ReadinessPanel readiness={t.readiness} ticket={t} onRelease={async () => {
            try { ticket.setData(await turnoverService.release(t.id)); toast.success(`Room ${t.room_number} is ready for guests.`); } catch (e) { toast.error(e); }
          }} />
          {t.repairs.length > 0 && (
            <section className="panel p-4">
              <h2 className="mb-3 text-base font-semibold">Engineering</h2>
              <div className="space-y-3">{t.repairs.map((r) => <RepairCard key={r.id} repair={r} />)}</div>
            </section>
          )}
          {hkSessions.length > 0 && (
            <section className="panel p-4">
              <h2 className="mb-3 text-base font-semibold">Inspection history</h2>
              <div className="space-y-6">{[...hkSessions].reverse().map((s) => (
                <InspectionResults key={s.id} session={s} onlyFailed={s.status === 'SUBMITTED'} />
              ))}</div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
