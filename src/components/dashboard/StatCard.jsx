/** Compact count used in summary strips. `accent` is a Tailwind bg class for the left rule. */
export default function StatCard({ label, value, accent = 'bg-gray-300', onClick, active }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick}
      className={`relative flex min-w-0 flex-col items-start overflow-hidden rounded-md border bg-white py-2.5 pl-4 pr-3 text-left ${active ? 'border-harbor-700 ring-1 ring-harbor-700' : 'border-mist'} ${onClick ? 'hover:border-harbor-600' : ''}`}
      aria-pressed={onClick ? !!active : undefined}>
      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden />
      <span className="room-no text-2xl font-semibold leading-none text-harbor-800">{value ?? '—'}</span>
      <span className="mt-1 text-xs leading-tight text-gray-600">{label}</span>
    </Tag>
  );
}
