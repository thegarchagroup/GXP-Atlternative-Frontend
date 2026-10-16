import StatusBadge from '../common/StatusBadge';
import ChecklistProgress from '../checklist/ChecklistProgress';
import ChecklistSection, { groupResults } from '../checklist/ChecklistSection';
import { formatDateTime } from '../../utils/dateHelpers';

/** Read-only view of one inspection session. */
export default function InspectionResults({ session, title, onlyFailed = false }) {
  const results = onlyFailed ? session.results.filter((r) => r.result === 'FAIL') : session.results;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title || (session.kind === 'HOUSEKEEPING' ? `Housekeeping round ${session.round_number}` : `Engineering check ${session.round_number}`)}
            {session.is_reclean && <span className="ml-2 text-xs font-normal text-gray-500">re-clean after repair</span>}</p>
          <p className="text-xs text-gray-500">
            {session.inspector?.display_name} | started {formatDateTime(session.started_at)}
            {session.submitted_at && ` | submitted ${formatDateTime(session.submitted_at)}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ChecklistProgress progress={session.progress} compact />
          <StatusBadge status={session.outcome || session.status} />
        </div>
      </div>
      {session.notes && <p className="rounded bg-gray-50 px-3 py-2 text-sm">{session.notes}</p>}
      {results.length === 0 ? <p className="text-sm text-gray-500">No failed items.</p> : groupResults(results).map((g) => (
        <ChecklistSection key={g.title} title={g.title} items={g.items} readOnly onItemChange={() => {}} />
      ))}
    </div>
  );
}
