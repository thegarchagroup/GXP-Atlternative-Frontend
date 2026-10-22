import ChecklistItem from './ChecklistItem';

/** A titled group of checklist items (one category). */
export default function ChecklistSection({ title, items, onItemChange, readOnly, ticketId, repairId, showErrors }) {
  const done = items.filter((i) => i.result !== 'PENDING').length;
  return (
    <section className="panel overflow-hidden" aria-label={title}>
      <header className="flex items-center justify-between border-b border-mist bg-gray-50/70 px-4 py-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-gray-500">{done} of {items.length}</span>
      </header>
      <ul className="divide-y divide-gray-100">
        {items.map((item) => (
          <ChecklistItem key={item.id} item={item} readOnly={readOnly} ticketId={ticketId} repairId={repairId}
            showError={showErrors} onChange={onItemChange} />
        ))}
      </ul>
    </section>
  );
}

/** Group results into sections: cleaning first, then by category. */
export function groupResults(results) {
  const groups = [];
  const index = {};
  for (const r of results) {
    const prefix = r.checklist_type === 'HOUSEKEEPING_CLEANING' ? 'Cleaning' : r.checklist_type === 'ENGINEERING_INSPECTION' ? 'Engineering check' : 'Engineering items';
    const key = r.category && r.category !== prefix ? `${prefix}: ${r.category}` : prefix;
    if (!index[key]) {
      index[key] = { title: key, items: [] };
      groups.push(index[key]);
    }
    index[key].items.push(r);
  }
  return groups;
}
