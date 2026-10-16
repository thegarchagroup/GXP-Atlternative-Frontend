import { useState } from 'react';
import { Download } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import StatCard from '../../components/dashboard/StatCard';
import { ErrorBanner } from '../../components/common/EmptyState';
import { useApi } from '../../hooks/useApi';
import { reportService } from '../../services/reportService';
import { formatDateTime, formatMinutes, isoDate } from '../../utils/dateHelpers';

function downloadCsv(name, rows) {
  if (!rows?.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const today = new Date();
  const [range, setRange] = useState({ date_from: isoDate(new Date(today.getTime() - 29 * 864e5)), date_to: isoDate(today) });
  const [tab, setTab] = useState('turnover');
  const turnover = useApi(() => reportService.roomTurnover(range), [range.date_from, range.date_to], { enabled: tab === 'turnover' });
  const maint = useApi(() => reportService.maintenance(range), [range.date_from, range.date_to], { enabled: tab === 'maintenance' });
  const t = turnover.data;
  const m = maint.data;

  return (
    <>
      <PageHeader title="Reports" subtitle="Turnaround and maintenance for a date range." />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Input label="From" type="date" value={range.date_from} onChange={(e) => setRange({ ...range, date_from: e.target.value })} />
        <Input label="To" type="date" value={range.date_to} onChange={(e) => setRange({ ...range, date_to: e.target.value })} />
        <div className="flex gap-1 rounded-lg border border-mist bg-white p-1" role="tablist">
          {[['turnover', 'Room turnover'], ['maintenance', 'Maintenance']].map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`rounded-md px-3 py-1.5 text-sm ${tab === k ? 'bg-harbor-700 font-semibold text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{label}</button>
          ))}
        </div>
      </div>

      {tab === 'turnover' && (
        <>
          <ErrorBanner error={turnover.error} onRetry={turnover.reload} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Tickets opened" value={t?.total_tickets} accent="bg-harbor-700" />
            <StatCard label="Released" value={t?.closed} accent="bg-emerald-600" />
            <StatCard label="Still open" value={t?.open} accent="bg-sky-500" />
            <StatCard label="Needed repairs" value={t?.with_repairs} accent="bg-orange-600" />
            <StatCard label="Avg. turnaround" value={formatMinutes(t?.avg_turnaround_minutes)} accent="bg-violet-600" />
            <StatCard label="Avg. housekeeping" value={formatMinutes(t?.avg_housekeeping_minutes)} accent="bg-sky-700" />
          </div>
          <section className="panel mt-4">
            <div className="panel-header"><h2 className="text-base font-semibold">Tickets</h2>
              <Button size="sm" variant="secondary" icon={Download} onClick={() => downloadCsv('room-turnover.csv', t?.rows)} disabled={!t?.rows?.length}>Export CSV</Button></div>
            <DataTable rowKey="ticket_id" loading={turnover.loading} rows={t?.rows || []} emptyTitle="No tickets in this range" columns={[
              { key: 'ticket_number', header: 'Ticket' },
              { key: 'room_number', header: 'Room', render: (r) => <span className="room-no font-semibold">{r.room_number}</span> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'housekeeper', header: 'Housekeeper' },
              { key: 'created_at', header: 'Opened', render: (r) => formatDateTime(r.created_at) },
              { key: 'released_at', header: 'Released', render: (r) => formatDateTime(r.released_at) },
              { key: 'hk', header: 'Housekeeping', render: (r) => formatMinutes(r.housekeeping_minutes) },
              { key: 'ta', header: 'Turnaround', render: (r) => formatMinutes(r.turnaround_minutes) },
              { key: 'repairs', header: 'Repairs' },
            ]} />
          </section>
        </>
      )}

      {tab === 'maintenance' && (
        <>
          <ErrorBanner error={maint.error} onRetry={maint.reload} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Repairs raised" value={m?.total_repairs} accent="bg-harbor-700" />
            <StatCard label="Completed" value={m?.completed} accent="bg-emerald-600" />
            <StatCard label="Open" value={m?.open} accent="bg-orange-600" />
            <StatCard label="Reopened" value={m?.reopened} accent="bg-red-600" />
            <StatCard label="Needed re-clean" value={m?.required_recleaning} accent="bg-sky-500" />
            <StatCard label="Avg. repair time" value={formatMinutes(m?.avg_repair_minutes)} accent="bg-violet-600" />
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-[20rem_1fr]">
            <section className="panel">
              <div className="panel-header"><h2 className="text-base font-semibold">Most failed items</h2></div>
              <ol className="divide-y divide-gray-100">
                {(m?.top_failed_items || []).length === 0 && <li className="px-4 py-6 text-sm text-gray-500">No failures recorded.</li>}
                {(m?.top_failed_items || []).map((f) => (
                  <li key={f.item_name} className="flex justify-between px-4 py-2 text-sm"><span>{f.item_name} <span className="text-gray-500">({f.category})</span></span><span className="font-semibold">{f.count}</span></li>
                ))}
              </ol>
            </section>
            <section className="panel">
              <div className="panel-header"><h2 className="text-base font-semibold">Repairs</h2>
                <Button size="sm" variant="secondary" icon={Download} onClick={() => downloadCsv('maintenance.csv', m?.rows)} disabled={!m?.rows?.length}>Export CSV</Button></div>
              <DataTable rowKey="repair_id" loading={maint.loading} rows={m?.rows || []} emptyTitle="No repairs in this range" columns={[
                { key: 'repair_number', header: 'Repair' },
                { key: 'room_number', header: 'Room' },
                { key: 'origin', header: 'Raised by', render: (r) => (r.origin === 'FRONT_DESK' ? 'Front desk' : 'Housekeeping') },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                { key: 'engineer', header: 'Engineer' },
                { key: 'created_at', header: 'Raised', render: (r) => formatDateTime(r.created_at) },
                { key: 'rt', header: 'Repair time', render: (r) => formatMinutes(r.repair_minutes) },
                { key: 'reopen_count', header: 'Reopened' },
              ]} />
            </section>
          </div>
        </>
      )}
    </>
  );
}
