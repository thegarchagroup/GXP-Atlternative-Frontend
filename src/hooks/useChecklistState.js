import { useCallback, useEffect, useMemo, useState } from 'react';
import { checklistProblems, checklistProgress } from '../utils/validators';

/** Local editable copy of a checklist session, with dirty tracking and API payload building. */
export function useChecklistState(session) {
  const [items, setItems] = useState([]);
  const [dirty, setDirty] = useState(new Set());

  useEffect(() => {
    setItems(session?.results ? session.results.map((r) => ({ ...r })) : []);
    setDirty(new Set());
  }, [session]);

  const updateItem = useCallback((next) => {
    setItems((list) => list.map((i) => (i.id === next.id ? next : i)));
    setDirty((d) => new Set(d).add(next.id));
  }, []);

  const markAll = useCallback((value, predicate = () => true) => {
    setItems((list) => list.map((i) => (i.result === 'PENDING' && predicate(i) ? { ...i, result: value } : i)));
    setDirty((d) => {
      const n = new Set(d);
      items.forEach((i) => i.result === 'PENDING' && predicate(i) && n.add(i.id));
      return n;
    });
  }, [items]);

  const payload = useCallback((all = false) => items
    .filter((i) => all || dirty.has(i.id))
    .map((i) => ({
      result_id: i.id,
      result: i.result,
      remarks: (i.remarks || '').trim() || null,
      attachment_ids: (i.attachments || []).map((a) => a.id),
    })), [items, dirty]);

  const progress = useMemo(() => checklistProgress(items), [items]);
  const problems = useMemo(() => checklistProblems(items), [items]);

  return { items, updateItem, markAll, payload, progress, problems, isDirty: dirty.size > 0, clearDirty: () => setDirty(new Set()) };
}
