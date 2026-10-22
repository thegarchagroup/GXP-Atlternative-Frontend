import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import { Textarea } from '../../components/common/Input';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ChecklistSection, { groupResults } from '../../components/checklist/ChecklistSection';
import ChecklistProgress from '../../components/checklist/ChecklistProgress';
import ProblemSummary from '../../components/checklist/ProblemSummary';
import InspectionResults from '../../components/tickets/InspectionResults';
import { ReservationTag } from '../../components/dashboard/SheetRoomTags';
import { useApi } from '../../hooks/useApi';
import { useChecklistState } from '../../hooks/useChecklistState';
import { dailySheetService } from '../../services/dailySheetService';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/dateHelpers';

export default function RoomFormPage() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, error, loading, reload } = useApi(() => dailySheetService.entry(entryId), [entryId]);
  const session = data?.session;
  const state = useChecklistState(session?.status === 'IN_PROGRESS' ? session : null);
  const [notes, setNotes] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!state.isDirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state.isDirty]);

  // a failed engineering item also needs a photo (same rule as the server)
  const problems = useMemo(() => [...state.problems, ...state.items
    .filter((i) => i.result === 'FAIL' && !(i.attachments || []).length)
    .map((i) => `"${i.item_name}" failed: take a photo of the problem.`)], [state.problems, state.items]);

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <ErrorBanner error={error} onRetry={reload} />;
  const back = <Link to="/housekeeping" className="mb-1 inline-flex items-center gap-1 text-sm text-harbor-700 hover:underline"><ArrowLeft className="h-4 w-4" />My runsheet</Link>;
  const header = (
    <PageHeader title={`Room ${data.room_number}`} back={back}
      subtitle={data.status === 'DONE' ? `Finished ${formatDateTime(data.finished_at)}` : 'Mark cleaning done, and each engineering item pass or fail. A failure needs a remark and a photo.'} />
  );

  if (data.status !== 'IN_PROGRESS' || !session || session.status !== 'IN_PROGRESS') {
    return (
      <>
        {header}
        <div className="mb-3"><ReservationTag room={data} /></div>
        {session ? <div className="panel p-4"><InspectionResults session={session} title="Your form" /></div>
          : <p className="text-sm text-gray-600">Start this room from your runsheet first.</p>}
        {data.repair_ids?.length > 0 && <p className="mt-3 text-sm text-red-800">Sent to Engineering ({data.repair_ids.length} repair request).</p>}
      </>
    );
  }

  const failed = state.items.filter((i) => i.result === 'FAIL');
  const save = async () => {
    setSaving(true);
    try { await dailySheetService.save(entryId, state.payload()); state.clearDirty(); toast.success('Progress saved.'); }
    catch (e) { toast.error(e); } finally { setSaving(false); }
  };
  const tryFinish = () => {
    setShowErrors(true);
    setSubmitError(null);
    if (problems.length) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setConfirm(true);
  };
  const finish = async () => {
    try {
      await dailySheetService.finish(entryId, state.payload(true), notes.trim() || null);
      state.clearDirty();
      toast.success(failed.length ? `Room ${data.room_number} done. Engineering has been notified.` : `Room ${data.room_number} done.`);
      navigate('/housekeeping');
    } catch (e) { setSubmitError(e); setConfirm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  return (
    <div className="pb-24">
      {header}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <ReservationTag room={data} />
        <Button variant="secondary" size="sm" onClick={() => state.markAll('PASS', (i) => i.checklist_type === 'HOUSEKEEPING_CLEANING')}>Mark all cleaning done</Button>
      </div>
      <ErrorBanner error={submitError} />
      {showErrors && problems.length > 0 && <ProblemSummary problems={problems} />}
      <div className="mt-3 space-y-4">
        {groupResults(state.items).map((g) => (
          <ChecklistSection key={g.title} title={g.title} items={g.items} onItemChange={state.updateItem} showErrors={showErrors} />
        ))}
        <section className="panel p-4">
          <Textarea label="Note (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-mist bg-white/95 backdrop-blur lg:left-[var(--sidebar-width)]">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-[12rem] flex-1"><ChecklistProgress progress={state.progress} /></div>
          <Button variant="secondary" icon={Save} loading={saving} onClick={save} disabled={!state.isDirty}>Save progress</Button>
          <Button icon={Send} variant={failed.length ? 'danger' : 'primary'} onClick={tryFinish}>
            {failed.length ? `Finish and report ${failed.length} issue${failed.length > 1 ? 's' : ''}` : 'Finish room'}
          </Button>
        </div>
      </div>
      <ConfirmDialog open={confirm} onCancel={() => setConfirm(false)} onConfirm={finish}
        title={failed.length ? 'Send the problems to Engineering?' : `Finish room ${data.room_number}?`}
        confirmLabel={failed.length ? 'Finish and report' : 'Finish room'} variant={failed.length ? 'danger' : 'primary'}
        message={failed.length ? `${failed.map((f) => f.item_name).join(', ')} failed. Engineering gets your remarks and photos.`
          : 'Everything is done and passed. The room will show as ready.'} />
    </div>
  );
}
