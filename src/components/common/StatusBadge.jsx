import { statusLabel, statusTone } from '../../utils/statusHelpers';

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusTone(status)} ${className}`}>
      {statusLabel(status)}
    </span>
  );
}
