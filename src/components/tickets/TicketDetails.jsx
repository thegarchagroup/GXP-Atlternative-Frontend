import StatusBadge from '../common/StatusBadge';
import { formatDateTime } from '../../utils/dateHelpers';

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-slate-ink">{children || '—'}</dd>
    </div>
  );
}

export default function TicketDetails({ ticket }) {
  return (
    <section className="panel p-4" aria-label="Ticket summary">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">Room</p>
          <p className="room-no text-4xl font-semibold leading-none text-harbor-800">{ticket.room_number}</p>
          <p className="mt-1 text-sm text-gray-600">Floor {ticket.floor} | {ticket.room_type}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={ticket.status} />
          <StatusBadge status={ticket.priority} />
        </div>
      </div>
      <dl className="mt-4 divide-y divide-gray-100 border-t border-mist">
        <Row label="Ticket">{ticket.ticket_number}{ticket.is_exception ? ' (exception)' : ''}</Row>
        <Row label="Housekeeper">{ticket.assigned_housekeeper?.display_name || 'Unassigned'}</Row>
        <Row label="Opened">{formatDateTime(ticket.created_at)} by {ticket.created_by?.display_name}</Row>
        <Row label="Housekeeping started">{ticket.housekeeping_started_at && formatDateTime(ticket.housekeeping_started_at)}</Row>
        <Row label="Housekeeping passed">{ticket.housekeeping_completed_at && formatDateTime(ticket.housekeeping_completed_at)}</Row>
        {ticket.released_at && <Row label="Released">{formatDateTime(ticket.released_at)} by {ticket.released_by?.display_name}</Row>}
        {ticket.cancelled_at && <Row label="Cancelled">{formatDateTime(ticket.cancelled_at)}</Row>}
      </dl>
      {ticket.notes && <p className="mt-3 rounded bg-gray-50 px-3 py-2 text-sm text-gray-700">{ticket.notes}</p>}
      {ticket.cancel_reason && <p className="mt-3 rounded bg-gray-50 px-3 py-2 text-sm text-gray-700">Cancelled: {ticket.cancel_reason}</p>}
    </section>
  );
}
