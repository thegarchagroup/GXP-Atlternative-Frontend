import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import TicketTable from '../../components/dashboard/TicketTable';
import { ErrorBanner } from '../../components/common/EmptyState';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService } from '../../services/dashboardService';
import { housekeepingService } from '../../services/housekeepingService';
import { POLL_INTERVAL_MS } from '../../utils/constants';

const BUCKETS = [
  { key: 'open', stat: 'assigned', label: 'Assigned to me', accent: 'bg-harbor-700' },
  { key: 'pending', stat: 'pending', label: 'Waiting to start', accent: 'bg-sky-400' },
  { key: 'in_progress', stat: 'in_progress', label: 'In progress', accent: 'bg-sky-700' },
  { key: 'engineering', stat: 'submitted_for_engineering', label: 'With engineering', accent: 'bg-orange-600' },
  { key: 'completed', stat: 'completed', label: 'Completed', accent: 'bg-emerald-600' },
];

const EMPTY = {
  open: ['No rooms assigned', 'The front desk assigns rooms after checkout. New ones appear here automatically.'],
  pending: ['Nothing waiting', 'Rooms you have not started yet appear here.'],
  in_progress: ['Nothing in progress', 'Start a room from the waiting list.'],
  engineering: ['No rooms with engineering', 'Rooms with failed items appear here while they are repaired.'],
  completed: ['No completed rooms yet', 'Rooms you have passed appear here.'],
};

export default function HousekeepingDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bucket, setBucket] = useState('open');
  const summary = useApi(dashboardService.housekeeping, [], { interval: POLL_INTERVAL_MS });
  const tickets = useApi(() => housekeepingService.myTickets(bucket), [bucket], { interval: POLL_INTERVAL_MS });
  const [title, message] = EMPTY[bucket];

  return (
    <>
      <PageHeader title="My rooms" subtitle={`Rooms assigned to ${user.display_name}. This list refreshes on its own.`} />
      <ErrorBanner error={summary.error || tickets.error} onRetry={() => { summary.reload(); tickets.reload(); }} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="tablist" aria-label="Filter rooms">
        {BUCKETS.map((b) => (
          <StatCard key={b.key} label={b.label} value={summary.data?.[b.stat]} accent={b.accent}
            active={bucket === b.key} onClick={() => setBucket(b.key)} />
        ))}
      </div>
      <section className="panel mt-4">
        <TicketTable tickets={tickets.data || []} loading={tickets.loading} showHousekeeper={false}
          onOpen={(t) => navigate(`/housekeeping/tickets/${t.id}`)} emptyTitle={title} emptyMessage={message} />
      </section>
    </>
  );
}
