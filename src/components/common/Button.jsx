import LoadingSpinner from './LoadingSpinner';

const VARIANTS = {
  primary: 'bg-harbor-700 text-white hover:bg-harbor-800 disabled:bg-harbor-700/50',
  secondary: 'bg-white text-slate-ink ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:text-gray-400',
  danger: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-red-700/50',
  success: 'bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-emerald-700/50',
  ghost: 'text-harbor-700 hover:bg-harbor-50 disabled:text-gray-400',
};
const SIZES = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm', lg: 'px-4 py-2.5 text-sm' };

export default function Button({ variant = 'primary', size = 'md', loading = false, icon: Icon, children, className = '', disabled, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? <LoadingSpinner size="sm" className="text-current" /> : Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
      {children}
    </button>
  );
}
