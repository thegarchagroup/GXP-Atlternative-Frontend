import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import ChecklistProgress from '../checklist/ChecklistProgress';
import { formatDateTime } from '../../utils/dateHelpers';

export default function RepairCard({ repair, actions, linkTo }) {
  return (
    <article className="rounded-md border border-mist bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {linkTo ? <Link to={linkTo} className="text-harbor-700 hover:underline">{repair.repair_number}</Link> : repair.repair_number}
          </p>
          <p className="text-xs text-gray-500">Raised {formatDateTime(repair.created_at)} by {repair.created_by?.display_name}
            {repair.origin === 'FRONT_DESK' ? ' (front desk request)' : ' (failed inspection)'}</p>
        </div>
        <div className="flex gap-1"><StatusBadge status={repair.priority} /><StatusBadge status={repair.status} /></div>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm text-gray-800">{repair.reported_defect}</p>
      <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
        <div><dt className="inline text-gray-500">Engineer: </dt><dd className="inline">{repair.assigned_engineer?.display_name || 'Unassigned'}</dd></div>
        <div><dt className="inline text-gray-500">Completed: </dt><dd className="inline">{formatDateTime(repair.completed_at)}</dd></div>
        {repair.diagnosis && <div className="sm:col-span-2"><dt className="inline text-gray-500">Diagnosis: </dt><dd className="inline">{repair.diagnosis}</dd></div>}
        {repair.repair_notes && <div className="sm:col-span-2"><dt className="inline text-gray-500">Work done: </dt><dd className="inline">{repair.repair_notes}</dd></div>}
        {repair.requires_recleaning && <div className="sm:col-span-2 text-sky-800">Sent back to housekeeping for re-cleaning.</div>}
        {repair.reopen_count > 0 && <div className="sm:col-span-2 text-red-800">Reopened {repair.reopen_count}x. Last reason: {repair.last_reopen_reason}</div>}
      </dl>
      {repair.progress && <div className="mt-3 max-w-xs"><ChecklistProgress progress={repair.progress} /></div>}
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </article>
  );
}
