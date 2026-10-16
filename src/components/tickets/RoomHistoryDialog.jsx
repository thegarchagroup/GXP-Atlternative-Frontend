import { Link } from 'react-router-dom';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { PageLoader } from '../common/LoadingSpinner';
import { ErrorBanner } from '../common/EmptyState';
import TicketTimeline from './TicketTimeline';
import { useApi } from '../../hooks/useApi';
import { roomService } from '../../services/roomService';
import { formatDateTime } from '../../utils/dateHelpers';

export default function RoomHistoryDialog({ roomId, onClose }) {
  const { data, error, loading, reload } = useApi(() => roomService.history(roomId), [roomId], { enabled: !!roomId });
  return (
    <Modal open={!!roomId} onClose={onClose} size="lg" title={data ? `Room ${data.room.room_number} history` : 'Room history'}>
      {loading ? <PageLoader /> : error ? <ErrorBanner error={error} onRetry={reload} /> : data && (
        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-sm font-semibold">Turnover and repair history</h3>
            {data.tickets.length === 0 ? <p className="text-sm text-gray-500">No turnover tickets yet.</p> : (
              <ul className="divide-y divide-gray-100 rounded-md border border-mist">
                {data.tickets.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                    <Link to={`/frontdesk/tickets/${t.id}`} className="font-medium text-harbor-700 hover:underline" onClick={onClose}>{t.ticket_number}</Link>
                    <span className="text-gray-600">{formatDateTime(t.created_at)}</span>
                    <span className="text-gray-600">{t.open_repairs ? `${t.open_repairs} open repair(s)` : ''}</span>
                    <StatusBadge status={t.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="mb-1 text-sm font-semibold">Audit trail</h3>
            <div className="max-h-80 overflow-y-auto rounded-md border border-mist"><TicketTimeline entries={data.activity} /></div>
          </section>
        </div>
      )}
    </Modal>
  );
}
