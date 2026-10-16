import { useEffect, useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Pagination } from '../../components/common/DataTable';
import DataTable from '../../components/common/DataTable';
import { ErrorBanner } from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import RoomStatusTable from '../../components/dashboard/RoomStatusTable';
import RoomActionsDialog from '../../components/tickets/RoomActionsDialog';
import RoomFormDialog from '../../components/tickets/RoomFormDialog';
import { useApi } from '../../hooks/useApi';
import { roomService } from '../../services/roomService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { OPERATIONAL_STATUSES, POLL_INTERVAL_MS } from '../../utils/constants';
import { statusLabel } from '../../utils/statusHelpers';

const EMPTY = { search: '', floor: '', operational_status: '', occupancy_status: '', assigned_user_id: '', ticket_created_from: '', ticket_created_to: '' };

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

function RoomTypesDialog({ open, onClose }) {
  const toast = useToast();
  const types = useApi(roomService.types, [open], { enabled: open });
  const [form, setForm] = useState({ name: '', category: '' });
  const [busy, setBusy] = useState(false);
  const add = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      await roomService.createType({ name: form.name.trim(), category: form.category.trim() || null });
      setForm({ name: '', category: '' });
      toast.success('Room type added.');
      types.refresh();
    } catch (err) { toast.error(err); } finally { setBusy(false); }
  };
  const toggle = async (t) => {
    try { await roomService.updateType(t.id, { is_active: !t.is_active }); types.refresh(); } catch (err) { toast.error(err); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Room types and categories" size="lg">
      <form onSubmit={add} className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Suite" />
        <Button type="submit" loading={busy} icon={Plus}>Add type</Button>
      </form>
      <DataTable rows={types.data || []} loading={types.loading} columns={[
        { key: 'name', header: 'Name' },
        { key: 'category', header: 'Category' },
        { key: 'is_active', header: 'Status', render: (t) => (t.is_active ? 'Active' : 'Inactive') },
        { key: 'a', header: <span className="sr-only">Actions</span>, className: 'text-right',
          render: (t) => <Button size="sm" variant="secondary" onClick={() => toggle(t)}>{t.is_active ? 'Deactivate' : 'Activate'}</Button> },
      ]} />
    </Modal>
  );
}

export default function RoomsPage() {
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: 'room_number', order: 'asc' });
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [typesOpen, setTypesOpen] = useState(false);
  const [staff, setStaff] = useState([]);
  const search = useDebounced(filters.search);
  const pageSize = 25;

  useEffect(() => {
    Promise.all([userService.staff('HOUSEKEEPING'), userService.staff('ENGINEERING')])
      .then(([a, b]) => setStaff([...a, ...b])).catch(() => {});
  }, []);

  const params = Object.fromEntries(Object.entries({ ...filters, search }).filter(([, v]) => v !== ''));
  const { data, loading, error, reload, refresh } = useApi(
    () => roomService.list({ ...params, sort: sort.key, order: sort.order, page, page_size: pageSize }),
    [JSON.stringify(params), sort.key, sort.order, page], { interval: POLL_INTERVAL_MS },
  );
  const set = (k) => (e) => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); };
  const onSort = (key) => setSort((s) => ({ key, order: s.key === key && s.order === 'asc' ? 'desc' : 'asc' }));

  return (
    <>
      <PageHeader title="Rooms" subtitle="Inventory, live status and per-room actions."
        actions={(
          <>
            <Button variant="secondary" onClick={() => setTypesOpen(true)}>Room types</Button>
            <Button icon={Plus} onClick={() => setAdding(true)}>Add room</Button>
          </>
        )} />
      <section className="panel">
        <div className="grid gap-3 border-b border-mist p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Input label="Room number" value={filters.search} onChange={set('search')} placeholder="Search…" />
          <Input label="Floor" type="number" value={filters.floor} onChange={set('floor')} />
          <Select label="Status" value={filters.operational_status} onChange={set('operational_status')} placeholder="Any"
            options={OPERATIONAL_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))} />
          <Select label="Occupancy" value={filters.occupancy_status} onChange={set('occupancy_status')} placeholder="Any"
            options={[{ value: 'OCCUPIED', label: 'Occupied' }, { value: 'VACANT', label: 'Vacant' }]} />
          <Select label="Assigned to" value={filters.assigned_user_id} onChange={set('assigned_user_id')} placeholder="Anyone"
            options={staff.map((u) => ({ value: String(u.id), label: u.display_name }))} />
          <Input label="Ticket opened from" type="date" value={filters.ticket_created_from} onChange={set('ticket_created_from')} />
          <Input label="Ticket opened to" type="date" value={filters.ticket_created_to} onChange={set('ticket_created_to')} />
        </div>
        {Object.values(filters).some(Boolean) && (
          <div className="border-b border-mist px-4 py-2"><button type="button" className="text-sm text-harbor-700 underline" onClick={() => { setFilters(EMPTY); setPage(1); }}>Clear filters</button></div>
        )}
        {error && <div className="p-4"><ErrorBanner error={error} onRetry={reload} /></div>}
        <RoomStatusTable rooms={data?.items || []} loading={loading} sort={sort} onSort={onSort}
          renderActions={(r) => (
            <Button size="sm" variant="secondary" icon={MoreHorizontal} onClick={() => setSelected(r)} aria-label={`Actions for room ${r.room_number}`}>
              Actions
            </Button>
          )} />
        <Pagination page={page} pageSize={pageSize} total={data?.total || 0} onPage={setPage} />
      </section>
      <RoomActionsDialog room={selected} onClose={() => setSelected(null)} onChanged={refresh} />
      <RoomFormDialog open={adding} onClose={() => setAdding(false)} onSaved={refresh} />
      <RoomTypesDialog open={typesOpen} onClose={() => setTypesOpen(false)} />
    </>
  );
}
