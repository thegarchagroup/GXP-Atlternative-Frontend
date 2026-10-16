import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <Icon className="h-8 w-8 text-gray-400" aria-hidden />
      <p className="mt-3 text-sm font-semibold text-slate-ink">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-gray-600">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <div role="alert" className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <div>
        <p className="font-medium">{error.message || 'Something went wrong.'}</p>
        {Array.isArray(error.details) && error.details.length > 0 && (
          <ul className="mt-1 list-disc pl-5">
            {error.details.map((d, i) => <li key={i}>{typeof d === 'string' ? d : `${d.field ? `${d.field}: ` : ''}${d.message}`}</li>)}
          </ul>
        )}
      </div>
      {onRetry && <button type="button" onClick={() => onRetry()} className="font-medium underline">Try again</button>}
    </div>
  );
}
