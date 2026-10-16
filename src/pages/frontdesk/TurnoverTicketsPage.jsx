import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Pagination } from '../../components/common/DataTable';
import { ErrorBanner } from '../../components/common/EmptyState';
import TicketTable from '../../components/dashboard/TicketTable';
import CreateTicketDialog from '../../components/tickets/CreateTicketDialog';
import { useApi } from '../../hooks/useApi';
import { turnoverService } from '../../services/turnoverService';
import { userService } from '../../services/userService';
import { POLL_INTERVAL_MS, PRIORITIES, TICKET_STATUSES } from '../../utils/constants';
import { statusLabel } from '../../utils/statusHelpers';

const EMPTY = { search: '', status: '', priority: '', housekeeper_id: '', created_from: '', created_to: '', active_only: 'true' };

export default function TurnoverTicketsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const staff = useApi(() => userService.staff('HOUSEKEEPING'), []);
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
  const { data, loading, error, reload } = useApi(() => turnoverService.list({ ...params, page, page_size: 25 }),
    [JSON.stringify(params), page], { interval: POLL_INTERVAL_MS });
  const set = (k) => (e) => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); };

  return (
    <>
      <PageHeader title="Turnover tickets" subtitle="Every checkout from cleaning to release."
        actions={<Button icon={LogOut} onClick={() => setCreating(true)}>Record checkout</Button>} />
      <section className="panel">
        <div className="grid gap-3 border-b border-mist p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Input label="Room or ticket" value={filters.search} onChange={set('search')} placeholder="Search…" />
          <Select label="Status" value={filters.status} onChange={set('status')} placeholder="Any"
            options={TICKET_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))} />
          <Select label="Priority" value={filters.priority} onChange={set('priority')} placeholder="Any"
            options={PRIORITIES.map((p) => ({ value: p, label: statusLabel(p) }))} />
          <Select label="Housekeeper" value={filters.housekeeper_id} onChange={set('housekeeper_id')} placeholder="Anyone"
            options={(staff.data || []).map((u) => ({ value: String(u.id), label: u.display_name }))} />
          <Input label="Opened from" type="date" value={filters.created_from} onChange={set('created_from')} />
          <Input label="Opened to" type="date" value={filters.created_to} onChange={set('created_to')} />
          <Select label="Show" value={filters.active_only} onChange={set('active_only')}
            options={[{ value: 'true', label: 'Open tickets' }, { value: '', label: 'All tickets' }]} />
        </div>
        {error && <div className="p-4"><ErrorBanner error={error} onRetry={reload} /></div>}
        <TicketTable tickets={data?.items || []} loading={loading} onOpen={(t) => navigate(`/frontdesk/tickets/${t.id}`)}
          emptyTitle="No tickets match" emptyMessage="Record a checkout to open a turnover ticket." />
        <Pagination page={page} pageSize={25} total={data?.total || 0} onPage={setPage} />
      </section>
      <CreateTicketDialog open={creating} onClose={() => setCreating(false)} onCreated={(t) => navigate(`/frontdesk/tickets/${t.id}`)} />
    </>
  );
}
