export default function ChecklistProgress({ progress, compact = false }) {
  if (!progress) return null;
  const { percent, required_done: done, required_total: total, failed } = progress;
  return (
    <div className={compact ? 'w-32' : 'w-full'}>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-slate-ink">{percent}%</span>
        <span className="text-gray-500">{done}/{total} required{failed ? ` | ${failed} failed` : ''}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}
        aria-label="Required checklist items completed">
        <div className={`h-full rounded-full ${failed ? 'bg-red-600' : percent === 100 ? 'bg-emerald-600' : 'bg-harbor-600'}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
