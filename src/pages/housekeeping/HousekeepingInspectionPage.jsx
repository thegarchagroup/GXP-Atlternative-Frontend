import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import { Textarea } from '../../components/common/Input';
import { PageLoader } from '../../components/common/LoadingSpinner';
import EmptyState, { ErrorBanner } from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ChecklistSection, { groupResults } from '../../components/checklist/ChecklistSection';
import ChecklistProgress from '../../components/checklist/ChecklistProgress';
import ProblemSummary from '../../components/checklist/ProblemSummary';
import { useApi } from '../../hooks/useApi';
import { useChecklistState } from '../../hooks/useChecklistState';
import { housekeepingService } from '../../services/housekeepingService';
import { useToast } from '../../context/ToastContext';

export default function HousekeepingInspectionPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, error, loading, reload } = useApi(() => housekeepingService.checklist(ticketId), [ticketId]);
  const session = data?.session;
  const state = useChecklistState(session);
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

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <ErrorBanner error={error} onRetry={reload} />;
  const t = data.ticket;
  const back = <Link to={`/housekeeping/tickets/${ticketId}`} className="mb-1 inline-flex items-center gap-1 text-sm text-harbor-700 hover:underline"><ArrowLeft className="h-4 w-4" />Room {t.room_number}</Link>;

  if (!session || session.status !== 'IN_PROGRESS' || t.status !== 'HOUSEKEEPING_IN_PROGRESS') {
    return (
      <>
        <PageHeader title={`Room ${t.room_number} checklist`} back={back} />
        <div className="panel"><EmptyState title="No checklist open" message="Start work on the room first, or it has already been submitted."
          action={<Link to={`/housekeeping/tickets/${ticketId}`} className="text-sm font-medium text-harbor-700 underline">Back to room</Link>} /></div>
      </>
    );
  }

  const failed = state.items.filter((i) => i.result === 'FAIL');
  const save = async () => {
    setSaving(true);
    try {
      await housekeepingService.save(ticketId, state.payload());
      state.clearDirty();
      toast.success('Progress saved.');
    } catch (e) { toast.error(e); } finally { setSaving(false); }
  };
  const trySubmit = () => {
    setShowErrors(true);
    setSubmitError(null);
    if (state.problems.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setConfirm(true);
  };
  const submit = async () => {
    try {
      await housekeepingService.submit(ticketId, state.payload(true), notes.trim() || null);
      state.clearDirty();
      toast.success(failed.length ? 'Submitted. Engineering has been notified.' : 'Submitted. All items passed.');
      navigate(`/housekeeping/tickets/${ticketId}`);
    } catch (e) {
      setSubmitError(e);
      setConfirm(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="pb-24">
      <PageHeader title={`Room ${t.room_number} checklist`} back={back}
        subtitle={session.is_reclean ? 'Re-clean after engineering work. Check every item again.' : 'Mark each task done and each item pass or fail. Failed items need a remark.'}
        actions={(
          <Button variant="secondary" size="sm" onClick={() => state.markAll('PASS', (i) => i.checklist_type === 'HOUSEKEEPING_CLEANING')}>
            Mark remaining cleaning tasks done
          </Button>
        )} />
      <ErrorBanner error={submitError} />
      {showErrors && state.problems.length > 0 && <ProblemSummary problems={state.problems} />}
      <div className="mt-3 space-y-4">
        {groupResults(state.items).map((g) => (
          <ChecklistSection key={g.title} title={g.title} items={g.items} onItemChange={state.updateItem}
            ticketId={Number(ticketId)} showErrors={showErrors} />
        ))}
        <section className="panel p-4">
          <Textarea label="Notes for the front desk or engineering" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-mist bg-white/95 backdrop-blur lg:left-[var(--sidebar-width)]">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-[12rem] flex-1"><ChecklistProgress progress={state.progress} /></div>
          <Button variant="secondary" icon={Save} loading={saving} onClick={save} disabled={!state.isDirty}>Save progress</Button>
          <Button icon={Send} onClick={trySubmit} variant={failed.length ? 'danger' : 'primary'}>
            {failed.length ? `Submit and report ${failed.length} issue${failed.length > 1 ? 's' : ''}` : 'Submit inspection'}
          </Button>
        </div>
      </div>

      <ConfirmDialog open={confirm} onCancel={() => setConfirm(false)} onConfirm={submit}
        title={failed.length ? 'Send this room to engineering?' : 'Submit inspection?'}
        confirmLabel={failed.length ? 'Submit and report' : 'Submit'} variant={failed.length ? 'danger' : 'primary'}
        message={failed.length
          ? `${failed.length} item(s) failed: ${failed.map((f) => f.item_name).join(', ')}. A repair request will be raised and the room stays unavailable until it is fixed.`
          : 'All required items are complete with no failures. The room moves to final verification.'} />
    </div>
  );
}
