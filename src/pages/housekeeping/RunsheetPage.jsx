import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Play } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import EmptyState, { ErrorBanner } from '../../components/common/EmptyState';
import { PageLoader } from '../../components/common/LoadingSpinner';
import ChecklistProgress from '../../components/checklist/ChecklistProgress';
import { ReservationTag, RoomWorkStatus } from '../../components/dashboard/SheetRoomTags';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { dailySheetService } from '../../services/dailySheetService';
import { requestService } from '../../services/requestService';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { POLL_INTERVAL_MS } from '../../utils/constants';
import { formatShortDate, formatTime, hotelToday } from '../../utils/dateHelpers';

/** The room attendant's rooms for today, already in priority order (arrivals first). */
export default function RunsheetPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(() => dailySheetService.runsheet(), [], { interval: POLL_INTERVAL_MS });
  const rooms = data || [];
  const reqs = useApi(() => requestService.list({ status: ['ASSIGNED', 'IN_PROGRESS'] }), [], { interval: POLL_INTERVAL_MS });
  const [finishing, setFinishing] = useState(null);
  const reqAct = async (fn, msg) => { try { await fn(); toast.success(msg); reqs.refresh(); } catch (e) { toast.error(e); reqs.refresh(); } };
  const done = rooms.filter((r) => r.status === 'DONE').length;

  const start = async (r) => {
    try {
      await dailySheetService.start(r.id);
      navigate(`/housekeeping/runsheet/${r.id}`);
    } catch (e) { toast.error(e); reload(); }
  };

  return (
    <>
      <PageHeader title="My runsheet" subtitle={`${user.display_name} | ${formatShortDate(hotelToday())} | ${done} of ${rooms.length} done. Work top to bottom: arrivals first.`} />
      <ErrorBanner error={error} onRetry={reload} />
      {(reqs.data || []).length > 0 && (
        <section className="mb-4" aria-label="Guest requests">
          <h2 className="mb-2 text-sm font-semibold">Guest requests ({reqs.data.length})</h2>
          <ul className="space-y-2">
            {reqs.data.map((q) => (
              <li key={q.id} className="panel flex flex-wrap items-center gap-3 border-l-4 border-l-brass px-4 py-3">
                <p className="room-no min-w-[4rem] text-2xl font-semibold leading-none text-harbor-800">{q.room_number}</p>
                <div className="flex-1">
                  <p className="text-sm font-medium">{q.description}</p>
                  <p className="text-xs text-gray-600">From the front desk | {formatTime(q.created_at)}</p>
                </div>
                <StatusBadge status={q.priority} />
                {q.status === 'ASSIGNED' && <Button variant="secondary" onClick={() => reqAct(() => requestService.start(q.id), 'Request started.')}>Start</Button>}
                <Button onClick={() => setFinishing(q)}>Done</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {loading && !data ? <PageLoader /> : rooms.length === 0 ? (
        <div className="panel"><EmptyState title="No rooms assigned yet" message="Your supervisor assigns today's rooms after uploading the task sheet. They appear here automatically." /></div>
      ) : (
        <ol className="space-y-2">
          {rooms.map((r, i) => (
            <li key={r.id} className={`panel flex flex-wrap items-center gap-3 px-4 py-3 ${r.status === 'DONE' ? 'opacity-70' : ''}`}>
              <span className="w-6 text-right text-sm text-gray-400">{i + 1}</span>
              <div className="min-w-[5rem]">
                <p className="room-no text-2xl font-semibold leading-none text-harbor-800">{r.room_number}</p>
                <p className="text-2xs text-gray-500">{r.room_type_code} | sheet {r.sheet_no}</p>
              </div>
              <div className="flex-1 space-y-1">
                <ReservationTag room={r} />
                <p className="text-xs text-gray-600">
                  {r.departure_date ? `Departs ${formatShortDate(r.departure_date)}` : 'No reservation'}
                  {r.status === 'DONE' && ` | finished ${formatTime(r.finished_at)}`}
                </p>
              </div>
              <div className="w-36">{r.progress && r.status !== 'DONE' ? <ChecklistProgress progress={r.progress} /> : <RoomWorkStatus room={r} />}</div>
              <div>
                {r.status === 'PENDING' && <Button icon={Play} onClick={() => start(r)}>Start</Button>}
                {r.status === 'IN_PROGRESS' && <Button icon={ClipboardCheck} onClick={() => navigate(`/housekeeping/runsheet/${r.id}`)}>Continue</Button>}
                {r.status === 'DONE' && <Button variant="secondary" onClick={() => navigate(`/housekeeping/runsheet/${r.id}`)}>View</Button>}
              </div>
            </li>
          ))}
        </ol>
      )}
      <ConfirmDialog open={!!finishing} title={`Request for room ${finishing?.room_number} done?`} confirmLabel="Mark done"
        message={finishing?.description} onCancel={() => setFinishing(null)}
        onConfirm={async () => { await reqAct(() => requestService.done(finishing.id), 'Request done. The front desk can see it.'); setFinishing(null); }} />
    </>
  );
}
