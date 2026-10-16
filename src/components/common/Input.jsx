import { useId } from 'react';

export function Field({ label, error, help, required, children, id, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}{required && <span className="text-red-700" aria-hidden> *</span>}
        </label>
      )}
      {children}
      {error ? <p className="error-text" id={`${id}-error`}>{error}</p> : help ? <p className="help">{help}</p> : null}
    </div>
  );
}

export default function Input({ label, error, help, required, className = '', id, ...rest }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} error={error} help={help} required={required} id={inputId} className={className}>
      <input id={inputId} className={`control ${error ? 'control-error' : ''}`} aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined} required={required} {...rest} />
    </Field>
  );
}

export function Textarea({ label, error, help, required, className = '', id, rows = 3, ...rest }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} error={error} help={help} required={required} id={inputId} className={className}>
      <textarea id={inputId} rows={rows} className={`control ${error ? 'control-error' : ''}`} aria-invalid={!!error} {...rest} />
    </Field>
  );
}

export function Checkbox({ label, checked, onChange, help, id, disabled }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="flex items-start gap-2">
      <input id={inputId} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-harbor-700 focus:ring-brass/40" />
      <label htmlFor={inputId} className="text-sm">
        {label}
        {help && <span className="block text-xs text-gray-500">{help}</span>}
      </label>
    </div>
  );
}
