export default function LoadingSpinner({ size = 'md', label, className = '' }) {
  const dim = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role={label ? 'status' : undefined}>
      <svg className={`${dim} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </span>
  );
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-harbor-700">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}
