import { useEffect } from 'react';

export default function PageHeader({ title, subtitle, actions, back }) {
  useEffect(() => { document.title = `${title} | Room Turnover`; }, [title]);
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {back}
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
