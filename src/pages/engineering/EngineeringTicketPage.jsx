import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Hand, Play } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/EmptyState';
import RepairCard from '../../components/tickets/RepairCard';
import { NotDoableDialog } from '../../components/tickets/PendingDialogs';
import InspectionResults from '../../components/tickets/InspectionResults';
import ReadinessPanel from '../../components/tickets/ReadinessPanel';
import ChecklistSection, { groupResults } from '../../components/checklist/ChecklistSection';
import { useApi, useAction } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { engineeringService } from '../../services/engineeringService';
import { turnoverService } from '../../services/turnoverService';
import { useToast } from '../../context/ToastContext';
import { POLL_INTERVAL_MS } from '../../utils/constants';
import { formatDateTime, formatShortDate } from '../../utils/dateHelpers';
import { PENDING_REASONS } from '../../utils/constants';

export default function EngineeringTicketPage() {
  const { repairId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [reopening, setReopening] = useState(false);
  const [notDoable, setNotDoable] = useState(false);
  const repair = useApi(() => engineeringService.get(repairId), [repairId], { interval: POLL_INTERVAL_MS });
  const r = repair.data;
  const ticket = useApi(() => turnoverService.get(r.ticket_id), [r?.ticket_id, r?.status], { enabled: !!r?.ticket_id });

  const run = async (fn, msg, after) => {
    try { const res = await fn(); if (res?.failed_items) repair.setData(res); toast.success(msg); ticket.refresh(); after?.(); }
    catch (e) { toast.error(e); repair.refresh(); }
  };
  const [claim, claiming] = useAction(() => run(() => engineeringService.assign(repairId, user.id), 'Repair assigned to you.'));
  const [start, starting] = useAction(() => run(() => engineeringService.start(repairId), 'Repair started.',
    () => navigate(`/engineering/repairs/${repairId}/inspection`)));

  if (repair.loading && !r) return <PageLoader />;
  if (repair.error && !r) return <ErrorBanner error={repair.error} onRetry={repair.reload} />;
  const mine = r.assigned_engineer?.id === user.id;
  const t = ticket.data;
  const ticketOpen = r.ticket_id ? t && !['CLOSED', 'CANCELLED'].includes(t.status) : true;
  const fromFrontDesk = r.origin === 'FRONT_DESK';

  return (
    <>
      <PageHeader title={`Room ${r.room_number} repair`} subtitle={`${r.repair_number} | ${r.ticket_number ? `ticket ${r.ticket_number}` : 'front desk request'} | floor ${r.floor}`}
        back={<Link to="/engineering" className="mb-1 inline-flex items-center gap-1 text-sm text-harbor-700 hover:underline"><ArrowLeft className="h-4 w-4" />Repair board</Link>}
        actions={(
          <>
            {!r.assigned_engineer && ['NEW', 'REOPENED'].includes(r.status) && <Button icon={Hand} loading={claiming} onClick={claim}>Take this repair</Button>}
            {mine && ['ASSIGNED', 'REOPENED'].includes(r.status) && <Button size="lg" icon={Play} loading={starting} onClick={start}>Start repair</Button>}
            {mine && r.status === 'IN_PROGRESS' && <Button size="lg" icon={ClipboardCheck} onClick={() => navigate(`/engineering/repairs/${r.id}/inspection`)}>Continue repair</Button>}
            {mine && ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(r.status) && <Button variant="secondary" onClick={() => setNotDoable(true)}>Not doable now</Button>}
            {mine && r.status === 'PENDING' && <Button size="lg" icon={Play} onClick={() => run(() => engineeringService.resume(repairId), 'Repair resumed.', () => navigate(`/engineering/repairs/${repairId}/inspection`))}>Resume repair</Button>}
            {mine && r.status === 'COMPLETED' && ticketOpen && <Button variant="secondary" onClick={() => setReopening(true)}>Reopen</Button>}
          </>
        )} />
      {r.assigned_engineer && !mine && <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">Assigned to {r.assigned_engineer.display_name}. You can view it but not work on it.</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {t && <ReadinessPanel readiness={t.readiness} ticket={t} onRelease={async () => {
            try { ticket.setData(await turnoverService.release(t.id)); toast.success(`Room ${t.room_number} is ready for guests.`); } catch (e) { toast.error(e); }
          }} />}
          {r.status === 'PENDING' && (
            <section className={`rounded-[10px] border p-4 text-sm ${r.overdue ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'}`}>
              <p className="font-semibold">Not doable now: {PENDING_REASONS[r.pending_reason]}</p>
              <p className="mt-1 whitespace-pre-line">{r.pending_note}</p>
              <p className="mt-1 text-xs text-gray-700">Pending {r.days_pending === 0 ? 'since today' : `for ${r.days_pending} day(s)`}
                {r.expected_date ? ` | expected by ${formatShortDate(r.expected_date)}${r.overdue ? ' (overdue)' : ''}` : ''} | {r.room_sellable ? 'room can be sold' : 'room is off sale'}</p>
            </section>
          )}
          <RepairCard repair={r} />
          <section className="panel p-4">
            <h2 className="text-base font-semibold">{fromFrontDesk ? 'Reported by the front desk' : 'What housekeeping found'}</h2>
            {r.room_occupancy === 'OCCUPIED' && <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">A guest is staying in this room. Arrange access with the front desk.</p>}
            {fromFrontDesk && <p className="mt-2 whitespace-pre-line text-sm text-gray-800">{r.reported_defect}</p>}
            {r.housekeeping_notes && <p className="mt-2 rounded bg-gray-50 px-3 py-2 text-sm">{r.housekeeping_notes}</p>}
            <div className="mt-3 space-y-3">
              {fromFrontDesk ? null : r.failed_items.length === 0 ? <p className="text-sm text-gray-500">No itemised failures recorded.</p>
                : groupResults(r.failed_items).map((g) => <ChecklistSection key={g.title} title={g.title} items={g.items} readOnly onItemChange={() => {}} />)}
            </div>
          </section>
          {r.sessions.filter((s) => s.status === 'SUBMITTED').length > 0 && (
            <section className="panel p-4">
              <h2 className="mb-3 text-base font-semibold">Engineering checks</h2>
              <div className="space-y-6">{[...r.sessions].filter((s) => s.status === 'SUBMITTED').reverse().map((s) => <InspectionResults key={s.id} session={s} />)}</div>
            </section>
          )}
        </div>
        <aside className="space-y-4">
          <section className="panel p-4">
            <h2 className="text-base font-semibold">Room status</h2>
            {!r.ticket_id ? <div className="mt-2 space-y-1 text-sm">
              <StatusBadge status={r.room_occupancy === 'OCCUPIED' ? 'OCCUPIED' : r.room_status} />
              <p className="text-gray-600">{r.blocks_room ? 'Off sale until this repair is completed.' : 'Not part of a turnover.'}</p>
            </div> : t ? <div className="mt-2 space-y-1 text-sm">
              <StatusBadge status={t.status} />
              <p className="text-gray-600">Housekeeper: {t.assigned_housekeeper?.display_name || '—'}</p>
              <p className="text-gray-600">Opened {formatDateTime(t.created_at)}</p>
            </div> : <p className="text-sm text-gray-500">Loading…</p>}
          </section>
          <section className="panel">
            <h2 className="border-b border-mist px-4 py-3 text-base font-semibold">Previous repairs in this room</h2>
            <ul className="divide-y divide-gray-100">
              {r.room_repair_history.length === 0 && <li className="px-4 py-4 text-sm text-gray-500">None recorded.</li>}
              {r.room_repair_history.map((h) => (
                <li key={h.id} className="px-4 py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2"><Link to={`/engineering/repairs/${h.id}`} className="font-medium text-harbor-700 hover:underline">{h.repair_number}</Link><StatusBadge status={h.status} /></div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{h.reported_defect}</p>
                  {h.repair_notes && <p className="text-xs text-gray-600">Fix: {h.repair_notes}</p>}
                  <p className="text-xs text-gray-500">{formatDateTime(h.created_at)}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
      <NotDoableDialog open={notDoable} repair={r} onClose={() => setNotDoable(false)}
        onSubmit={async (body) => { repair.setData(await engineeringService.markPending(repairId, body)); toast.success('Moved to pending.'); }} />
      <ConfirmDialog open={reopening} title={`Reopen ${r.repair_number}?`} confirmLabel="Reopen" variant="danger" reasonLabel="What is still wrong?"
        message="The room goes back to engineering and cannot be released until you complete the repair again."
        onCancel={() => setReopening(false)}
        onConfirm={async (reason) => { await run(() => engineeringService.reopen(repairId, reason), 'Repair reopened.'); setReopening(false); }} />
    </>
  );
}
