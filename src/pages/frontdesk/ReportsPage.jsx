import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/dashboard/StatCard';
import EmptyState, { ErrorBanner } from '../../components/common/EmptyState';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { reportService } from '../../services/reportService';
import { useToast } from '../../context/ToastContext';
import { hotelToday } from '../../utils/dateHelpers';

const REPORTS = [
  { key: 'daily-runsheet', label: 'Daily runsheet', roles: ['ADMIN', 'HK_SUPERVISOR'], single: true,
    help: 'Every room on the day’s task sheet: room attendant, times, minutes taken and result.' },
  { key: 'ra-productivity', label: 'Room attendant productivity', roles: ['ADMIN', 'HK_SUPERVISOR'],
    help: 'Per room attendant: rooms done, average minutes per room, issues reported and guest requests.' },
  { key: 'guest-requests', label: 'Guest requests', roles: ['ADMIN', 'HK_SUPERVISOR'],
    help: 'Every request from the front desk, who did it, and how long it took.' },
  { key: 'engineering-issues', label: 'Engineering issues', roles: ['ADMIN', 'ENG_SUPERVISOR'],
    help: 'Every repair: who raised it, the technician, time to fix, and pending repairs with how long they have waited.' },
];

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const available = REPORTS.filter((r) => r.roles.includes(user.role));
  const [key, setKey] = useState(available[0]?.key);
  const today = hotelToday();
  const [day, setDay] = useState(today);
  const [range, setRange] = useState({ date_from: addDays(today, -6), date_to: today });
  const [downloading, setDownloading] = useState(null);
  const meta = available.find((r) => r.key === key);
  const params = meta?.single ? { day } : range;
  const rep = useApi(() => reportService.get(key, params), [key, JSON.stringify(params)], { enabled: !!meta });
  useEffect(() => { if (!meta && available[0]) setKey(available[0].key); }, [meta, available]);

  const download = async (format) => {
    setDownloading(format);
    try { await reportService.download(key, params, format); } catch (e) { toast.error(e); } finally { setDownloading(null); }
  };
  const data = rep.data && rep.data.report === key ? rep.data : null; // never show another tab's report while loading
  const columns = (data?.columns || []).map((c) => ({
    key: c.key, header: c.label,
    className: ['problem', 'request_text', 'failed_items', 'diagnosis', 'work_done', 'note'].includes(c.key) ? 'whitespace-normal' : '',
    render: (row) => (row[c.key] === null || row[c.key] === undefined || row[c.key] === ''
      ? <span className="text-gray-300">—</span>
      : ['problem', 'request_text', 'diagnosis', 'work_done'].includes(c.key)
        ? <span className="block min-w-[10rem] max-w-[18rem] whitespace-normal">{row[c.key]}</span> : String(row[c.key])),
  }));

  return (
    <>
      <PageHeader title="Reports" subtitle={data ? `Times shown in ${data.timezone}.` : 'Choose a report and a date range.'}
        actions={meta && (
          <>
            <Button icon={FileSpreadsheet} loading={downloading === 'xlsx'} disabled={!data} onClick={() => download('xlsx')}>Download Excel</Button>
            <Button variant="secondary" icon={Download} loading={downloading === 'csv'} disabled={!data} onClick={() => download('csv')}>Download CSV</Button>
          </>
        )} />
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-mist bg-white p-1" role="tablist" style={{ width: 'fit-content' }}>
        {available.map((r) => (
          <button key={r.key} type="button" role="tab" aria-selected={key === r.key} onClick={() => setKey(r.key)}
            className={`rounded-md px-3 py-1.5 text-sm ${key === r.key ? 'bg-harbor-700 font-semibold text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{r.label}</button>
        ))}
      </div>
      {meta && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          {meta.single ? (
            <Input label="Day" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
          ) : (
            <>
              <Input label="From" type="date" value={range.date_from} onChange={(e) => setRange({ ...range, date_from: e.target.value })} />
              <Input label="To" type="date" value={range.date_to} onChange={(e) => setRange({ ...range, date_to: e.target.value })} />
              <div className="flex gap-1 pb-1">
                {[['Today', 0], ['7 days', 6], ['30 days', 29]].map(([label, n]) => (
                  <Button key={label} size="sm" variant="ghost" onClick={() => setRange({ date_from: addDays(today, -n), date_to: today })}>{label}</Button>
                ))}
              </div>
            </>
          )}
          <p className="pb-2 text-sm text-gray-600">{meta.help}</p>
        </div>
      )}
      {rep.error?.code === 'NO_TASK_SHEET' ? (
        <div className="panel"><EmptyState title="No task sheet for this day" message="Choose another day, or upload that day’s task sheet first." /></div>
      ) : (
        <>
          <ErrorBanner error={rep.error} onRetry={rep.reload} />
          {data && (
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {data.summary.map((s, i) => (
                <StatCard key={s.label} label={s.label} value={s.value ?? '—'}
                  accent={['bg-harbor-700', 'bg-emerald-600', 'bg-sky-500', 'bg-amber-500', 'bg-red-600', 'bg-violet-600'][i % 6]} />
              ))}
            </div>
          )}
          <section className="panel">
            {data && <p className="border-b border-mist px-4 py-2 text-xs text-gray-500">{data.title} | {data.period} | {data.rows.length} rows | generated {data.generated_at}</p>}
            <DataTable rowKey={columns[0]?.key || 'id'} columns={columns} rows={data?.rows || []} loading={rep.loading || (!data && !rep.error)} caption={meta?.label}
              emptyTitle="Nothing in this period" />
          </section>
        </>
      )}
    </>
  );
}
