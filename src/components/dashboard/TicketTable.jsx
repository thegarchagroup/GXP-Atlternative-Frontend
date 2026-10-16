import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import ChecklistProgress from '../checklist/ChecklistProgress';
import { formatDateTime } from '../../utils/dateHelpers';

export default function TicketTable({ tickets, loading, onOpen, showHousekeeper = true, emptyTitle, emptyMessage }) {
  const columns = [
    { key: 'ticket_number', header: 'Ticket', render: (t) => <span className="font-medium text-harbor-700">{t.ticket_number}</span> },
    { key: 'room', header: 'Room', render: (t) => <span className="room-no font-semibold">{t.room_number}</span> },
    { key: 'floor', header: 'Floor' },
    { key: 'priority', header: 'Priority', render: (t) => <StatusBadge status={t.priority} /> },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    { key: 'progress', header: 'Progress', render: (t) => (t.progress ? <ChecklistProgress progress={t.progress} compact /> : <span className="text-xs text-gray-500">Not started</span>) },
  ];
  if (showHousekeeper) columns.push({ key: 'hk', header: 'Housekeeper', render: (t) => t.assigned_housekeeper?.display_name || 'Unassigned' });
  columns.push({ key: 'created_at', header: 'Opened', render: (t) => formatDateTime(t.created_at) });
  return <DataTable columns={columns} rows={tickets} loading={loading} onRowClick={onOpen} caption="Turnover tickets"
    emptyTitle={emptyTitle || 'No tickets'} emptyMessage={emptyMessage} />;
}
