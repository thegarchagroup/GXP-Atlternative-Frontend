import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import DataTable, { Pagination } from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { ErrorBanner } from '../../components/common/EmptyState';
import AssignmentDialog from '../../components/tickets/AssignmentDialog';
import CreateRepairDialog from '../../components/tickets/CreateRepairDialog';
import { Hammer } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { engineeringService } from '../../services/engineeringService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { POLL_INTERVAL_MS, REPAIR_STATUSES } from '../../utils/constants';
import { statusLabel } from '../../utils/statusHelpers';
import { formatDateTime } from '../../utils/dateHelpers';

const OPEN = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'];

export default function RepairsPage() {
  const toast = useToast();
  const [status, setStatus] = useState('open');
  const [engineer, setEngineer] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assigning, setAssigning] = useState(null);
  const [raising, setRaising] = useState(false);
  const engineers = useApi(() => userService.staff('ENGINEERING'), []);
  const statuses = status === 'open' ? OPEN : status ? [status] : undefined;
  const { data, loading, error, reload, refresh } = useApi(
    () => engineeringService.listAll({ status: statuses, engineer_id: engineer || undefined, search: search || undefined, page, page_size: 25 }),
    [status, engineer, search, page], { interval: POLL_INTERVAL_MS });

  const columns = [
    { key: 'repair_number', header: 'Repair', render: (r) => <span className="font-medium">{r.repair_number}</span> },
    { key: 'ticket', header: 'Ticket', render: (r) => (r.ticket_id
      ? <Link className="text-harbor-700 hover:underline" to={`/frontdesk/tickets/${r.ticket_id}`}>{r.ticket_number}</Link>
      : <span className="text-gray-500">None</span>) },
    { key: 'origin', header: 'Raised by', render: (r) => (r.origin === 'FRONT_DESK' ? 'Front desk' : 'Housekeeping') },
    { key: 'room', header: 'Room', render: (r) => <span className="room-no font-semibold">{r.room_number}</span> },
    { key: 'defect', header: 'Reported defect', render: (r) => <span title={r.reported_defect} className="block max-w-[18rem] truncate">{r.reported_defect}</span> },
    { key: 'priority', header: 'Priority', render: (r) => <StatusBadge status={r.priority} /> },
    { key: 'eng', header: 'Engineer', render: (r) => r.assigned_engineer?.display_name || 'Unassigned' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: 'Raised', render: (r) => formatDateTime(r.created_at) },
    { key: 'a', header: <span className="sr-only">Actions</span>, className: 'text-right', render: (r) => (OPEN.includes(r.status)
      ? <Button size="sm" variant="secondary" onClick={() => setAssigning(r)}>{r.assigned_engineer ? 'Reassign' : 'Assign'}</Button> : null) },
  ];

  return (
    <>
      <PageHeader title="Repairs" subtitle="Engineering requests from failed inspections and from the front desk."
        actions={<Button icon={Hammer} onClick={() => setRaising(true)}>Raise repair</Button>} />
      <section className="panel">
        <div className="grid gap-3 border-b border-mist p-4 sm:grid-cols-3">
          <Input label="Room or repair" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search…" />
          <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={[{ value: 'open', label: 'Open repairs' }, { value: '', label: 'All' }, ...REPAIR_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))]} />
          <Select label="Engineer" value={engineer} onChange={(e) => { setEngineer(e.target.value); setPage(1); }} placeholder="Anyone"
            options={(engineers.data || []).map((u) => ({ value: String(u.id), label: u.display_name }))} />
        </div>
        {error && <div className="p-4"><ErrorBanner error={error} onRetry={reload} /></div>}
        <DataTable columns={columns} rows={data?.items || []} loading={loading} emptyTitle="No repairs" caption="Repair requests" />
        <Pagination page={page} pageSize={25} total={data?.total || 0} onPage={setPage} />
      </section>
      <CreateRepairDialog open={raising} onClose={() => setRaising(false)}
        onCreated={(r) => { toast.success(`Repair ${r.repair_number} sent to engineering.`); refresh(); }} />
      <AssignmentDialog open={!!assigning} title={`Engineer for ${assigning?.repair_number}`} department="ENGINEERING"
        currentId={assigning?.assigned_engineer?.id} onClose={() => setAssigning(null)}
        onAssign={async (id, reason) => { await engineeringService.assign(assigning.id, id, reason); toast.success('Engineer assigned.'); refresh(); }} />
    </>
  );
}
