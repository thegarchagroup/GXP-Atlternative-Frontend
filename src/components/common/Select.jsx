import { useId } from 'react';
import { Field } from './Input';

/** options: [{ value, label }] or strings */
export default function Select({ label, error, help, required, options = [], placeholder, className = '', id, ...rest }) {
  const autoId = useId();
  const selectId = id || autoId;
  return (
    <Field label={label} error={error} help={help} required={required} id={selectId} className={className}>
      <select id={selectId} className={`control ${error ? 'control-error' : ''}`} aria-invalid={!!error} required={required} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o;
          return <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>;
        })}
      </select>
    </Field>
  );
}
