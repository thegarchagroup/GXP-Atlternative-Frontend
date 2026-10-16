import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCheck, Save } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import { Checkbox, Textarea } from '../../components/common/Input';
import { PageLoader } from '../../components/common/LoadingSpinner';
import EmptyState, { ErrorBanner } from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ChecklistSection, { groupResults } from '../../components/checklist/ChecklistSection';
import ChecklistProgress from '../../components/checklist/ChecklistProgress';
import ProblemSummary from '../../components/checklist/ProblemSummary';
import AttachmentList from '../../components/checklist/AttachmentList';
import { useApi } from '../../hooks/useApi';
import { useChecklistState } from '../../hooks/useChecklistState';
import { engineeringService } from '../../services/engineeringService';
import { useToast } from '../../context/ToastContext';

export default function EngineeringInspectionPage() {
  const { repairId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const detail = useApi(() => engineeringService.get(repairId), [repairId]);
  const checklist = useApi(() => engineeringService.checklist(repairId), [repairId]);
  const session = checklist.data?.session;
  const state = useChecklistState(session);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [reclean, setReclean] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [textDirty, setTextDirty] = useState(false);

  useEffect(() => {
    if (detail.data) {
      setDiagnosis(detail.data.diagnosis || '');
      setNotes(detail.data.repair_notes || '');
    }
  }, [detail.data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = state.isDirty || textDirty;
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if ((detail.loading && !detail.data) || (checklist.loading && !checklist.data)) return <PageLoader />;
  const loadError = detail.error || checklist.error;
  if (loadError && !detail.data) return <ErrorBanner error={loadError} onRetry={() => { detail.reload(); checklist.reload(); }} />;
  const r = detail.data;
  const back = <Link to={`/engineering/repairs/${repairId}`} className="mb-1 inline-flex items-center gap-1 text-sm text-harbor-700 hover:underline"><ArrowLeft className="h-4 w-4" />{r.repair_number}</Link>;

  if (r.status !== 'IN_PROGRESS' || !session || session.status !== 'IN_PROGRESS') {
    return (
      <>
        <PageHeader title={`Room ${r.room_number} repair`} back={back} />
        <div className="panel"><EmptyState title="No repair checklist open" message="Start the repair first, or it has already been completed."
          action={<Link to={`/engineering/repairs/${repairId}`} className="text-sm font-medium text-harbor-700 underline">Back to repair</Link>} /></div>
      </>
    );
  }

  const failed = state.items.filter((i) => i.result === 'FAIL');
  const body = (all) => ({ items: state.payload(all), diagnosis, repair_notes: notes });
  const save = async () => {
    setSaving(true);
    try {
      await engineeringService.save(repairId, body(false));
      state.clearDirty();
      setTextDirty(false);
      toast.success('Progress saved.');
    } catch (e) { toast.error(e); } finally { setSaving(false); }
  };
  const tryComplete = () => {
    setShowErrors(true);
    const problems = [];
    if (failed.length) problems.push(`Checks still failing: ${failed.map((f) => f.item_name).join(', ')}. Fix them, or save and come back.`);
    if (!diagnosis.trim()) problems.push('Add a diagnosis.');
    if (!notes.trim()) problems.push('Describe the work done.');
    if (problems.length || state.problems.length) {
      setSubmitError(problems.length ? { message: 'The repair cannot be completed yet:', details: problems } : null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitError(null);
    setConfirm(true);
  };
  const complete = async () => {
    try {
      await engineeringService.save(repairId, body(true));
      await engineeringService.complete(repairId, { requires_recleaning: reclean, diagnosis, repair_notes: notes });
      state.clearDirty();
      setTextDirty(false);
      toast.success(reclean ? 'Repair completed. Housekeeping will re-clean the room.' : 'Repair completed.');
      navigate(`/engineering/repairs/${repairId}`);
    } catch (e) {
      setSubmitError(e);
      setConfirm(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="pb-24">
      <PageHeader title={`Room ${r.room_number} repair`} back={back} subtitle="Record what you found and fixed, then verify every check." />
      <ErrorBanner error={submitError} />
      {showErrors && state.problems.length > 0 && <ProblemSummary problems={state.problems} />}
      <div className="mt-3 grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <section className="panel space-y-3 p-4">
            <div>
              <p className="text-sm font-semibold">{r.origin === 'FRONT_DESK' ? 'Reported by the front desk' : 'Reported by housekeeping'}</p>
              <p className="whitespace-pre-line text-sm text-gray-800">{r.reported_defect}</p>
              {r.failed_items.flatMap((i) => i.attachments).length > 0 && <AttachmentList attachments={r.failed_items.flatMap((i) => i.attachments)} />}
            </div>
            <Textarea label="Diagnosis" required rows={3} value={diagnosis} error={showErrors && !diagnosis.trim() ? 'Required.' : undefined}
              onChange={(e) => { setDiagnosis(e.target.value); setTextDirty(true); }} />
            <Textarea label="Repair notes" required rows={3} value={notes} help="Parts replaced, work done, anything housekeeping should know."
              error={showErrors && !notes.trim() ? 'Required.' : undefined} onChange={(e) => { setNotes(e.target.value); setTextDirty(true); }} />
          </section>
          {groupResults(state.items).map((g) => (
            <ChecklistSection key={g.title} title={g.title} items={g.items} onItemChange={state.updateItem}
              ticketId={r.ticket_id} repairId={r.id} showErrors={showErrors} />
          ))}
        </div>
        <aside>
          <section className="panel space-y-3 p-4 xl:sticky xl:top-20">
            <p className="text-sm font-semibold">Before you finish</p>
            <Checkbox label="Room needs re-cleaning" checked={reclean} onChange={setReclean}
              help={r.ticket_id ? 'Tick if the repair left dust, debris or marks. Housekeeping will clean and inspect again.'
                : r.room_occupancy === 'OCCUPIED' ? 'Tick if the room needs cleaning. The guest is in the room, so the front desk will arrange it.'
                  : 'Tick if the repair left dust, debris or marks. A housekeeping turnover is opened for this room.'} />
            <p className="text-xs text-gray-600">The repair can only be completed when every required check passes. A failing check keeps the repair open.</p>
          </section>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-mist bg-white/95 backdrop-blur lg:left-[var(--sidebar-width)]">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-[12rem] flex-1"><ChecklistProgress progress={state.progress} /></div>
          <Button variant="secondary" icon={Save} loading={saving} onClick={save} disabled={!dirty}>Save progress</Button>
          <Button icon={CheckCheck} variant="success" onClick={tryComplete}>Complete repair</Button>
        </div>
      </div>

      <ConfirmDialog open={confirm} onCancel={() => setConfirm(false)} onConfirm={complete} variant="success"
        title={`Complete ${r.repair_number}?`} confirmLabel="Complete repair"
        message={reclean ? 'The room goes back to housekeeping for re-cleaning before it can be released.'
          : 'All checks pass. The room moves to final verification.'} />
    </div>
  );
}
