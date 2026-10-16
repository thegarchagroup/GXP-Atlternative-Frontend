import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

/**
 * columns: [{ key, header, render?(row), sortable?, className? }]
 * sort: { key, order } ; onSort(key)
 */
export default function DataTable({ columns, rows, loading, emptyTitle = 'Nothing here yet', emptyMessage, sort, onSort, rowKey = 'id', onRowClick, caption }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-mist text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="table-head">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`whitespace-nowrap px-4 py-2.5 ${c.className || ''}`}
                aria-sort={sort?.key === c.key ? (sort.order === 'asc' ? 'ascending' : 'descending') : undefined}>
                {c.sortable && onSort ? (
                  <button type="button" onClick={() => onSort(c.key)} className="inline-flex items-center gap-1 hover:text-harbor-700">
                    {c.header}
                    {sort?.key === c.key && (sort.order === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                  </button>
                ) : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {loading && !rows?.length ? (
            <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-harbor-700"><LoadingSpinner label="Loading…" /></td></tr>
          ) : !rows?.length ? (
            <tr><td colSpan={columns.length}><EmptyState title={emptyTitle} message={emptyMessage} /></td></tr>
          ) : rows.map((row) => (
            <tr key={row[rowKey]} className={onRowClick ? 'cursor-pointer hover:bg-harbor-50/60' : ''} onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {columns.map((c) => (
                <td key={c.key} className={`whitespace-nowrap px-4 py-2.5 align-middle ${c.className || ''}`}>
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return total ? <p className="px-4 py-3 text-xs text-gray-500">{total} total</p> : null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav className="flex items-center justify-between border-t border-mist px-4 py-3 text-sm" aria-label="Pagination">
      <span className="text-gray-600">{from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button type="button" className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 text-gray-700">Page {page} of {pages}</span>
        <button type="button" className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
