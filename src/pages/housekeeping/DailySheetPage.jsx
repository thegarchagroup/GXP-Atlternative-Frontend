import { useMemo, useRef, useState } from 'react';
import { FileUp, UserCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import EmptyState, { ErrorBanner } from '../../components/common/EmptyState';
import { PageLoader } from '../../components/common/LoadingSpinner';
import StatCard from '../../components/dashboard/StatCard';
import ChecklistProgress from '../../components/checklist/ChecklistProgress';
import InspectionResults from '../../components/tickets/InspectionResults';
import { ReservationTag, RoomWorkStatus } from '../../components/dashboard/SheetRoomTags';
import { useApi } from '../../hooks/useApi';
import { dailySheetService } from '../../services/dailySheetService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { POLL_INTERVAL_MS } from '../../utils/constants';
import { formatDateTime, formatShortDate, formatTime, hotelToday } from '../../utils/dateHelpers';

function RoomDetailDialog({ entryId, onClose }) {
  const { data, loading, error } = useApi(() => dailySheetService.entry(entryId), [entryId], { enabled: !!entryId });
  return (
    <Modal open={!!entryId} onClose={onClose} size="lg" title={data ? `Room ${data.room_number}` : 'Room'}
      description={data ? `${data.assigned_ra?.display_name || 'Unassigned'}${data.finished_at ? ` | finished ${formatDateTime(data.finished_at)}` : ''}` : undefined}>
      {loading ? <PageLoader /> : error ? <ErrorBanner error={error} /> : data && (
        data.session ? <InspectionResults session={data.session} title="Room attendant's form" />
          : <p className="text-sm text-gray-600">The room attendant has not started this room yet.</p>
      )}
    </Modal>
  );
}

export default function DailySheetPage() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [day, setDay] = useState(hotelToday());
  const [selected, setSelected] = useState(new Set());
  const [filters, setFilters] = useState({ sheet: '', status: '', ra: '', search: '' });
  const [assignTo, setAssignTo] = useState('');
  const [sheetAssign, setSheetAssign] = useState({ sheet: '', ra: '' });
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);
  const staff = useApi(() => userService.staff('HOUSEKEEPING'), []);
  const sheet = useApi(() => dailySheetService.byDate(day), [day], { interval: POLL_INTERVAL_MS });
  const noSheet = sheet.error?.code === 'NO_TASK_SHEET';
  const data = noSheet ? null : sheet.data;
  const ras = (staff.data || []).map((u) => ({ value: String(u.id), label: u.display_name }));

  const rooms = useMemo(() => (data?.rooms || []).filter((r) => (!filters.sheet || r.sheet_no === filters.sheet)
    && (!filters.status || (filters.status === 'UNASSIGNED' ? !r.assigned_ra : r.status === filters.status))
    && (!filters.ra || String(r.assigned_ra?.id) === filters.ra)
    && (!filters.search || r.room_number.includes(filters.search.trim()))), [data, filters]);

  const perRa = useMemo(() => {
    const m = {};
    (data?.rooms || []).forEach((r) => {
      if (!r.assigned_ra) return;
      const k = r.assigned_ra.display_name;
      m[k] ||= { total: 0, done: 0 };
      m[k].total += 1;
      if (r.status === 'DONE') m[k].done += 1;
    });
    return Object.entries(m).sort();
  }, [data]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const r = await dailySheetService.upload(file);
      toast.success(`Task sheet for ${formatShortDate(r.task_date)} uploaded: ${r.rooms_in_file} rooms (${r.added} new, ${r.updated} updated${r.removed ? `, ${r.removed} removed` : ''}).`);
      setSelected(new Set());
      if (r.task_date !== day) setDay(r.task_date); else sheet.setData(r);
    } catch (err) { toast.error(err); } finally { setUploading(false); }
  };

  const run = async (fn, msg) => {
    setBusy(true);
    try { const r = await fn(); if (r?.rooms) sheet.setData(r); else sheet.refresh(); toast.success(msg); setSelected(new Set()); }
    catch (err) { toast.error(err); } finally { setBusy(false); }
  };
  const assignSelected = (raId) => run(() => dailySheetService.assign(data.id, { entry_ids: [...selected], ra_id: raId ? Number(raId) : null }),
    raId ? `${selected.size} room(s) assigned.` : `${selected.size} room(s) unassigned.`);
  const assignSheet = () => run(() => dailySheetService.assign(data.id, { sheet_no: sheetAssign.sheet, ra_id: Number(sheetAssign.ra) }),
    `Sheet ${sheetAssign.sheet} assigned.`);
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectable = rooms.filter((r) => r.status === 'PENDING');
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.id));
  const s = data?.summary;

  return (
    <>
      <PageHeader title="Daily task sheet" subtitle="Upload the day's task sheet, then assign rooms to room attendants."
        actions={(
          <>
            <input ref={fileRef} type="file" accept="application/pdf" className="sr-only" onChange={onFile} tabIndex={-1} aria-hidden />
            <Button icon={FileUp} loading={uploading} onClick={() => fileRef.current?.click()}>Upload task sheet PDF</Button>
          </>
        )} />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Input label="Date" type="date" value={day} onChange={(e) => { setDay(e.target.value); setSelected(new Set()); }} />
        {day !== hotelToday() && <Button variant="ghost" onClick={() => setDay(hotelToday())}>Back to today</Button>}
        {data && <p className="pb-2 text-xs text-gray-500">Uploaded {formatDateTime(data.last_uploaded_at)} by {data.uploaded_by?.display_name} ({data.source_filename})</p>}
      </div>

      {sheet.loading && !sheet.data && !sheet.error ? <PageLoader /> : noSheet ? (
        <div className="panel"><EmptyState icon={FileUp} title={`No task sheet for ${formatShortDate(day)}`}
          message="Upload the Housekeeping Task Sheet PDF from the property system. Its date is read from the sheet."
          action={<Button icon={FileUp} loading={uploading} onClick={() => fileRef.current?.click()}>Upload task sheet PDF</Button>} /></div>
      ) : sheet.error ? <ErrorBanner error={sheet.error} onRetry={sheet.reload} /> : data && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            <StatCard label="Rooms" value={s.total} accent="bg-harbor-700" />
            <StatCard label="Arrivals today" value={s.arrivals} accent="bg-brass" />
            <StatCard label="Unassigned" value={s.unassigned} accent="bg-gray-400" onClick={() => setFilters({ ...filters, status: filters.status === 'UNASSIGNED' ? '' : 'UNASSIGNED' })} active={filters.status === 'UNASSIGNED'} />
            <StatCard label="Not started" value={s.pending} accent="bg-sky-400" onClick={() => setFilters({ ...filters, status: filters.status === 'PENDING' ? '' : 'PENDING' })} active={filters.status === 'PENDING'} />
            <StatCard label="In progress" value={s.in_progress} accent="bg-sky-700" onClick={() => setFilters({ ...filters, status: filters.status === 'IN_PROGRESS' ? '' : 'IN_PROGRESS' })} active={filters.status === 'IN_PROGRESS'} />
            <StatCard label="Done" value={s.done} accent="bg-emerald-600" onClick={() => setFilters({ ...filters, status: filters.status === 'DONE' ? '' : 'DONE' })} active={filters.status === 'DONE'} />
            <StatCard label="Sent to engineering" value={s.with_issues} accent="bg-red-600" />
          </div>

          {s.missing_rooms.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p><span className="font-semibold">{s.missing_rooms.length} room(s) on this sheet are not set up yet</span>: {s.missing_rooms.slice(0, 12).join(', ')}{s.missing_rooms.length > 12 ? '…' : ''}. Room attendants can't start them until they are added.</p>
              <Button size="sm" loading={busy} onClick={() => run(async () => { const r = await dailySheetService.addMissingRooms(data.id); return r; }, `Rooms added.`)}>Add these rooms</Button>
            </div>
          )}

          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_18rem]">
            <section className="panel">
              <div className="grid gap-3 border-b border-mist p-4 sm:grid-cols-4">
                <Input label="Room" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search…" />
                <Select label="Sheet" value={filters.sheet} onChange={(e) => setFilters({ ...filters, sheet: e.target.value })} placeholder="All sheets"
                  options={s.sheet_numbers.map((n) => ({ value: n, label: n === 'FLOAT' ? 'Float' : `Sheet ${n}` }))} />
                <Select label="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} placeholder="Any"
                  options={[{ value: 'UNASSIGNED', label: 'Unassigned' }, { value: 'PENDING', label: 'Not started' }, { value: 'IN_PROGRESS', label: 'In progress' }, { value: 'DONE', label: 'Done' }]} />
                <Select label="Room attendant" value={filters.ra} onChange={(e) => setFilters({ ...filters, ra: e.target.value })} placeholder="Anyone" options={ras} />
              </div>
              {selected.size > 0 && (
                <div className="flex flex-wrap items-end gap-2 border-b border-mist bg-harbor-50 px-4 py-3">
                  <p className="pb-2 text-sm font-medium">{selected.size} selected</p>
                  <Select label="Assign to" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} placeholder="Choose…" options={ras} />
                  <Button icon={UserCheck} disabled={!assignTo} loading={busy} onClick={() => assignSelected(assignTo)}>Assign</Button>
                  <Button variant="secondary" loading={busy} onClick={() => assignSelected(null)}>Unassign</Button>
                  <Button variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-mist text-sm">
                  <caption className="sr-only">Rooms on the task sheet</caption>
                  <thead className="table-head">
                    <tr>
                      <th className="px-3 py-2.5"><input type="checkbox" aria-label="Select all not started rooms" checked={allSelected}
                        onChange={() => setSelected(allSelected ? new Set() : new Set(selectable.map((r) => r.id)))} /></th>
                      <th className="px-3 py-2.5">Room</th><th className="px-3 py-2.5">Sheet</th><th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5">Guest</th><th className="px-3 py-2.5">Arrival / departure</th>
                      <th className="px-3 py-2.5">Room attendant</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {rooms.length === 0 && <tr><td colSpan={9}><EmptyState title="No rooms match" /></td></tr>}
                    {rooms.map((r) => (
                      <tr key={r.id} className={`hover:bg-harbor-50/60 ${selected.has(r.id) ? 'bg-harbor-50' : ''}`}>
                        <td className="px-3 py-2"><input type="checkbox" aria-label={`Select room ${r.room_number}`} disabled={r.status !== 'PENDING'}
                          checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                        <td className="px-3 py-2"><button type="button" className="room-no font-semibold text-harbor-700 hover:underline" onClick={() => setDetail(r.id)}>{r.room_number}</button>
                          {!r.room_known && <span className="ml-1 text-2xs text-amber-700">not set up</span>}</td>
                        <td className="px-3 py-2 text-gray-600">{r.sheet_no}</td>
                        <td className="px-3 py-2 text-gray-600">{r.room_type_code}</td>
                        <td className="px-3 py-2"><ReservationTag room={r} /></td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600">{r.arrival_date ? `${formatShortDate(r.arrival_date)} to ${formatShortDate(r.departure_date)}` : '—'}</td>
                        <td className="px-3 py-2">{r.assigned_ra?.display_name || <span className="text-gray-400">Unassigned</span>}</td>
                        <td className="px-3 py-2"><RoomWorkStatus room={r} /></td>
                        <td className="px-3 py-2 text-xs text-gray-600">{r.status === 'DONE' ? `Done ${formatTime(r.finished_at)}` : r.progress ? <ChecklistProgress progress={r.progress} compact /> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="space-y-4">
              <section className="panel space-y-3 p-4">
                <h2 className="text-sm font-semibold">Assign a whole sheet</h2>
                <Select label="Sheet" value={sheetAssign.sheet} onChange={(e) => setSheetAssign({ ...sheetAssign, sheet: e.target.value })} placeholder="Choose…"
                  options={s.sheet_numbers.map((n) => ({ value: n, label: n === 'FLOAT' ? 'Float' : `Sheet ${n}` }))} />
                <Select label="Room attendant" value={sheetAssign.ra} onChange={(e) => setSheetAssign({ ...sheetAssign, ra: e.target.value })} placeholder="Choose…" options={ras}
                  help={ras.length === 0 ? 'Add room attendants first.' : undefined} />
                <Button className="w-full" disabled={!sheetAssign.sheet || !sheetAssign.ra} loading={busy} onClick={assignSheet}>Assign sheet</Button>
              </section>
              <section className="panel">
                <h2 className="border-b border-mist px-4 py-3 text-sm font-semibold">Progress by room attendant</h2>
                <ul className="divide-y divide-gray-100">
                  {perRa.length === 0 && <li className="px-4 py-4 text-sm text-gray-500">Nobody assigned yet.</li>}
                  {perRa.map(([name, v]) => (
                    <li key={name} className="px-4 py-2.5">
                      <div className="flex justify-between text-sm"><span>{name}</span><span className="text-gray-600">{v.done}/{v.total}</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-gray-200"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.round((100 * v.done) / v.total)}%` }} /></div>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </>
      )}
      <RoomDetailDialog entryId={detail} onClose={() => setDetail(null)} />
    </>
  );
}
