import { FileText } from 'lucide-react';
import { fileUrl } from '../../services/apiClient';

export default function AttachmentList({ attachments = [], onRemove }) {
  if (!attachments.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {attachments.map((a) => (
        <li key={a.id} className="relative">
          <a href={fileUrl(a.url)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded border border-mist bg-gray-50"
            title={a.original_filename}>
            {a.content_type.startsWith('image/') ? (
              <img src={fileUrl(a.url)} alt={a.caption || a.original_filename} className="h-16 w-16 object-cover" loading="lazy" />
            ) : (
              <span className="flex h-16 w-16 flex-col items-center justify-center text-2xs text-gray-600"><FileText className="h-5 w-5" />PDF</span>
            )}
          </a>
          {onRemove && (
            <button type="button" onClick={() => onRemove(a.id)} aria-label={`Remove ${a.original_filename}`}
              className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-xs text-gray-700 shadow ring-1 ring-gray-300 hover:text-red-700">×</button>
          )}
        </li>
      ))}
    </ul>
  );
}
