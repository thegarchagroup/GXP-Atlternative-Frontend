import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StatCard from '../../components/dashboard/StatCard';
import RoomRack, { RackLegend } from '../../components/dashboard/RoomRack';
import EmptyState, { ErrorBanner } from '../../components/common/EmptyState';
import { PageLoader } from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import RoomActionsDialog from '../../components/tickets/RoomActionsDialog';
import CreateTicketDialog from '../../components/tickets/CreateTicketDialog';
import { useApi } from '../../hooks/useApi';
import { dashboardService } from '../../services/dashboardService';
import { roomService } from '../../services/roomService';
import { turnoverService } from '../../services/turnoverService';
import { POLL_INTERVAL_MS } from '../../utils/constants';
import { RACK_BAR } from '../../utils/statusHelpers';
import { timeAgo } from '../../utils/dateHelpers';

const CARDS = [
  { key: 'total_rooms', label: 'Total rooms', accent: 'bg-harbor-700' },
  { key: 'occupied', label: 'Occupied', accent: 'bg-harbor-600', filter: { occupancy: 'OCCUPIED' } },
  { key: 'vacant', label: 'Vacant', accent: 'bg-gray-400', filter: { occupancy: 'VACANT' } },
  { key: 'ready_for_guest', label: 'Ready for guest (vacant)', status: 'READY_FOR_GUEST', filter: { status: 'READY_FOR_GUEST', occupancy: 'VACANT' } },
  { key: 'awaiting_housekeeping', label: 'Awaiting housekeeping', status: 'AWAITING_HOUSEKEEPING' },
  { key: 'housekeeping_in_progress', label: 'Housekeeping in progress', status: 'HOUSEKEEPING_IN_PROGRESS' },
  { key: 'engineering_required', label: 'Engineering required', status: 'ENGINEERING_REQUIRED' },
  { key: 'engineering_in_progress', label: 'Engineering in progress', status: 'ENGINEERING_IN_PROGRESS' },
  { key: 'awaiting_final_verification', label: 'Awaiting final check', status: 'AWAITING_FINAL_VERIFICATION' },
  { key: 'out_of_service', label: 'Out of service', status: 'OUT_OF_SERVICE' },
];

export default function FrontDeskDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState(null);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const summary = useApi(dashboardService.frontdesk, [], { interval: POLL_INTERVAL_MS });
  const rooms = useApi(() => roomService.list({ page_size: 500 }), [], { interval: POLL_INTERVAL_MS });
  const attention = useApi(() => turnoverService.list({ status: ['AWAITING_FINAL_VERIFICATION', 'AWAITING_HOUSEKEEPING', 'ENGINEERING_REQUIRED'], page_size: 8 }),
    [], { interval: POLL_INTERVAL_MS });
  const notifications = useApi(() => dashboardService.notifications(undefined, true), [], { interval: POLL_INTERVAL_MS });

  const refresh = () => { summary.refresh(); rooms.refresh(); attention.refresh(); };
  const visibleRooms = useMemo(() => {
    const list = rooms.data?.items || [];
    if (!filter) return list;
    if (filter.status === 'HOUSEKEEPING_IN_PROGRESS') return list.filter((r) => ['HOUSEKEEPING_ASSIGNED', 'HOUSEKEEPING_IN_PROGRESS'].includes(r.operational_status));
    if (filter.status === 'ENGINEERING_IN_PROGRESS') return list.filter((r) => ['ENGINEERING_ASSIGNED', 'ENGINEERING_IN_PROGRESS'].includes(r.operational_status));
    return list.filter((r) => (!filter.status || r.operational_status === filter.status)
      && (!filter.occupancy || r.occupancy_status === filter.occupancy));
  }, [rooms.data, filter]);

  if (summary.loading && !summary.data) return <PageLoader />;
  const s = summary.data || {};
  const counts = { ...s, housekeeping_in_progress: (s.housekeeping_in_progress || 0) + (s.housekeeping_assigned || 0),
    engineering_in_progress: (s.engineering_in_progress || 0) + (s.engineering_assigned || 0) };

  return (
    <>
      <PageHeader title="Front desk" subtitle="Live room status. Updates every few seconds."
        actions={<Button icon={LogOut} onClick={() => setCreating(true)}>Record checkout</Button>} />
      <ErrorBanner error={summary.error || rooms.error} onRetry={refresh} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {CARDS.map((c) => {
          const f = c.filter || (c.status ? { status: c.status } : null);
          const active = f && filter && JSON.stringify(f) === JSON.stringify(filter);
          return (
            <StatCard key={c.key} label={c.label} value={counts[c.key]} accent={c.accent || RACK_BAR[c.status]} active={active}
              onClick={f ? () => setFilter(active ? null : f) : () => setFilter(null)} />
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_22rem]">
        <section className="panel" aria-labelledby="rack-title">
          <div className="panel-header">
            <h2 id="rack-title" className="text-base font-semibold">Room rack {filter && <span className="text-sm font-normal text-gray-500">(filtered, {visibleRooms.length} rooms)</span>}</h2>
            {filter && <button type="button" className="text-sm text-harbor-700 underline" onClick={() => setFilter(null)}>Show all</button>}
          </div>
          <div className="p-4">
            <RackLegend />
            <div className="mt-4">
              {rooms.data && visibleRooms.length === 0 ? (
                <EmptyState title={rooms.data.items.length ? 'No rooms in this state' : 'No rooms yet'}
                  message={rooms.data.items.length ? undefined : 'Add your room inventory to start tracking turnovers.'}
                  action={!rooms.data.items.length && <Link to="/frontdesk/rooms" className="text-sm font-medium text-harbor-700 underline">Add rooms</Link>} />
              ) : <RoomRack rooms={visibleRooms} onSelect={setSelected} selectedId={selected?.id} />}
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <section className="panel" aria-labelledby="attention-title">
            <div className="panel-header"><h2 id="attention-title" className="text-base font-semibold">Needs attention</h2>
              <Link to="/frontdesk/tickets" className="text-sm text-harbor-700 hover:underline">All tickets</Link></div>
            <ul className="divide-y divide-gray-100">
              {(attention.data?.items || []).length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-500">Nothing waiting on you.</li>}
              {(attention.data?.items || []).map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => navigate(`/frontdesk/tickets/${t.id}`)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-harbor-50/60">
                    <span><span className="room-no text-base font-semibold">{t.room_number}</span>
                      <span className="block text-xs text-gray-500">{t.status === 'AWAITING_HOUSEKEEPING' ? 'Needs a housekeeper' : t.status === 'ENGINEERING_REQUIRED' ? 'Needs an engineer' : 'Ready to release'}</span></span>
                    <StatusBadge status={t.status} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel" aria-labelledby="activity-title">
            <div className="panel-header"><h2 id="activity-title" className="text-base font-semibold">Latest activity</h2></div>
            <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
              {(notifications.data || []).length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-500">No activity yet.</li>}
              {(notifications.data || []).slice(0, 15).map((n) => (
                <li key={n.id} className="px-4 py-2.5">
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-gray-500">{n.actor?.display_name} | {timeAgo(n.created_at)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <RoomActionsDialog room={selected} onClose={() => setSelected(null)} onChanged={refresh} />
      <CreateTicketDialog open={creating} onClose={() => setCreating(false)} onCreated={(t) => navigate(`/frontdesk/tickets/${t.id}`)} />
    </>
  );
}
