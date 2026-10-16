import { formatDateTime } from '../../utils/dateHelpers';
import { statusLabel } from '../../utils/statusHelpers';

export default function TicketTimeline({ entries = [] }) {
  if (!entries.length) return <p className="px-4 py-6 text-sm text-gray-500">No activity recorded yet.</p>;
  return (
    <ol className="relative space-y-4 px-4 py-4 before:absolute before:bottom-4 before:left-[1.4rem] before:top-5 before:w-px before:bg-mist">
      {entries.map((e) => (
        <li key={e.id} className="relative pl-7">
          <span className="absolute left-0.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-harbor-600 ring-1 ring-harbor-600" aria-hidden />
          <p className="text-sm">{e.message}</p>
          <p className="text-xs text-gray-500">
            {formatDateTime(e.created_at)} | {e.actor?.display_name || 'System'}
            {e.to_status && e.from_status !== e.to_status ? ` | ${statusLabel(e.from_status) || 'start'} to ${statusLabel(e.to_status)}` : ''}
          </p>
          {e.details?.reason && <p className="mt-0.5 text-xs text-gray-700">Reason: {e.details.reason}</p>}
        </li>
      ))}
    </ol>
  );
}
