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
    </>
  );
}
