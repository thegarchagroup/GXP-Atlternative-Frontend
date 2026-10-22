import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import DataTable, { Pagination } from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { ErrorBanner } from '../../components/common/EmptyState';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService } from '../../services/dashboardService';
import { engineeringService } from '../../services/engineeringService';
import { useToast } from '../../context/ToastContext';
import { POLL_INTERVAL_MS } from '../../utils/constants';
import { formatDateTime } from '../../utils/dateHelpers';

const SCOPES = [
  { key: 'new', stat: 'new_requests', label: 'New requests', accent: 'bg-red-600' },
  { key: 'assigned', stat: 'assigned', label: 'Assigned to me', accent: 'bg-amber-500' },
  { key: 'in_progress', stat: 'in_progress', label: 'In progress', accent: 'bg-orange-600' },
  { key: 'awaiting_verification', stat: 'awaiting_verification', label: 'Awaiting verification', accent: 'bg-violet-600' },
  { key: 'completed', stat: 'completed', label: 'Completed', accent: 'bg-emerald-600' },
  { key: 'reopened', stat: 'reopened', label: 'Reopened', accent: 'bg-red-700' },
  { key: 'pending', stat: 'pending', label: 'Pending (not doable now)', accent: 'bg-amber-600' },
];

const EMPTY = {
  new: 'No unassigned repairs. Failed inspections appear here for the team to claim.',
  assigned: 'Nothing assigned to you right now.',
  in_progress: 'You have no repairs in progress.',
  awaiting_verification: 'No finished repairs waiting on re-cleaning or release.',
  completed: 'No completed repairs yet.',
  reopened: 'No reopened repairs.',
  pending: 'Nothing pending. Repairs you mark as not doable now appear here.',
};

export default function EngineeringDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [scope, setScope] = useState('new');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const summary = useApi(dashboardService.engineering, [], { interval: POLL_INTERVAL_MS });
  const list = useApi(() => engineeringService.myTickets({ scope, search: search || undefined, page, page_size: 25 }),
    [scope, search, page], { interval: POLL_INTERVAL_MS });

  const claim = async (r) => {
    try {
      await engineeringService.assign(r.id, user.id);
      toast.success(`You took ${r.repair_number}.`);
      navigate(`/engineering/repairs/${r.id}`);
    } catch (e) { toast.error(e); list.refresh(); }
  };

  const columns = [
    { key: 'repair_number', header: 'Repair', render: (r) => <span className="font-medium text-harbor-700">{r.repair_number}</span> },
    { key: 'ticket_number', header: 'Source', render: (r) => (r.ticket_number || 'Front desk') },
    { key: 'room', header: 'Room', render: (r) => <span><span className="room-no font-semibold">{r.room_number}</span> <span className="text-xs text-gray-500">fl. {r.floor}</span>{r.room_occupancy === 'OCCUPIED' && <span className="ml-1 text-xs font-medium text-harbor-700">guest in room</span>}</span> },
    { key: 'defect', header: 'Reported defect', render: (r) => <span title={r.reported_defect} className="block max-w-[18rem] truncate">{r.reported_defect}</span> },
    { key: 'priority', header: 'Priority', render: (r) => <StatusBadge status={r.priority} /> },
    { key: 'eng', header: 'Engineer', render: (r) => r.assigned_engineer?.display_name || 'Unassigned' },
    { key: 'created_at', header: 'Raised', render: (r) => formatDateTime(r.created_at) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'a', header: <span className="sr-only">Actions</span>, className: 'text-right',
      render: (r) => (!r.assigned_engineer ? <Button size="sm" onClick={(e) => { e.stopPropagation(); claim(r); }}>Take it</Button> : null) },
  ];

  return (
    <>
      <PageHeader title="Repair board" subtitle="Repairs raised from housekeeping inspections. Refreshes on its own." />
      <ErrorBanner error={summary.error || list.error} onRetry={() => { summary.reload(); list.reload(); }} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {SCOPES.map((s) => <StatCard key={s.key} label={s.label} value={summary.data?.[s.stat]} accent={s.accent}
          active={scope === s.key} onClick={() => { setScope(s.key); setPage(1); }} />)}
      </div>
      <section className="panel mt-4">
        <div className="border-b border-mist p-4 sm:max-w-xs">
          <Input label="Room or repair" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search…" />
        </div>
        <DataTable columns={columns} rows={list.data?.items || []} loading={list.loading} caption="Repairs"
          onRowClick={(r) => navigate(`/engineering/repairs/${r.id}`)} emptyTitle="Nothing here" emptyMessage={EMPTY[scope]} />
        <Pagination page={page} pageSize={25} total={list.data?.total || 0} onPage={setPage} />
      </section>
    </>
  );
}
