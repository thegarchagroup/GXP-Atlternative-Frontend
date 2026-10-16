import { CircleAlert } from 'lucide-react';

/** Live list of what still blocks submission; updates as items are filled in. */
export default function ProblemSummary({ problems }) {
  const shown = problems.slice(0, 5);
  return (
    <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="flex items-center gap-2 font-medium"><CircleAlert className="h-4 w-4" />{problems.length} item{problems.length > 1 ? 's' : ''} left before you can submit</p>
      <ul className="mt-1 list-disc pl-6">{shown.map((p) => <li key={p}>{p}</li>)}</ul>
      {problems.length > shown.length && <p className="mt-1 text-xs">and {problems.length - shown.length} more, marked "Required" below.</p>}
    </div>
  );
}
