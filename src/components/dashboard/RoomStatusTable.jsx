import { Link } from 'react-router-dom';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import { formatDateTime } from '../../utils/dateHelpers';

export default function RoomStatusTable({ rooms, loading, sort, onSort, renderActions }) {
  const columns = [
    { key: 'room_number', header: 'Room', sortable: true, render: (r) => <span className="room-no font-semibold text-harbor-800">{r.room_number}</span> },
    { key: 'floor', header: 'Floor', sortable: true },
    { key: 'room_type', header: 'Type', render: (r) => r.room_type?.name },
    { key: 'occupancy_status', header: 'Occupancy', render: (r) => <StatusBadge status={r.occupancy_status} /> },
    { key: 'operational_status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.operational_status} /> },
    { key: 'ticket', header: 'Active ticket', render: (r) => (r.active_ticket_id
      ? r.active_ticket_number
      : '—') },
    { key: 'hk', header: 'Housekeeper', render: (r) => r.assigned_housekeeper?.display_name || '—' },
    { key: 'eng', header: 'Engineer', render: (r) => r.assigned_engineer?.display_name || '—' },
    { key: 'updated_at', header: 'Last updated', sortable: true, render: (r) => formatDateTime(r.updated_at) },
  ];
  if (renderActions) columns.push({ key: 'actions', header: <span className="sr-only">Actions</span>, render: renderActions, className: 'text-right' });
  return <DataTable columns={columns} rows={rooms} loading={loading} sort={sort} onSort={onSort} caption="Rooms"
    emptyTitle="No rooms match" emptyMessage="Change the filters or add a room." />;
}
