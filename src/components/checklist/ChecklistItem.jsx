import { useId } from 'react';
import { Info } from 'lucide-react';
import AttachmentList from './AttachmentList';
import PhotoUpload from './PhotoUpload';

const CHOICES = {
  inspection: [
    { value: 'PASS', label: 'Pass', on: 'bg-emerald-700 text-white ring-emerald-700' },
    { value: 'FAIL', label: 'Fail', on: 'bg-red-700 text-white ring-red-700' },
    { value: 'NOT_APPLICABLE', label: 'N/A', on: 'bg-gray-600 text-white ring-gray-600' },
  ],
  cleaning: [
    { value: 'PASS', label: 'Done', on: 'bg-emerald-700 text-white ring-emerald-700' },
    { value: 'NOT_APPLICABLE', label: 'N/A', on: 'bg-gray-600 text-white ring-gray-600' },
  ],
};

export default function ChecklistItem({ item, onChange, readOnly, ticketId, repairId, showError }) {
  const id = useId();
  const kind = item.checklist_type === 'HOUSEKEEPING_CLEANING' ? 'cleaning' : 'inspection';
  const choices = CHOICES[kind].filter((c) => c.value !== 'NOT_APPLICABLE' || item.allow_not_applicable);
  const failed = item.result === 'FAIL';
  const missingRemark = failed && !(item.remarks || '').trim();
  const missing = item.is_mandatory && item.result === 'PENDING';

  const set = (patch) => onChange({ ...item, ...patch });
  const toggle = (value) => set({ result: item.result === value ? 'PENDING' : value });

  return (
    <li className={`px-4 py-3 ${failed ? 'bg-red-50/60' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium" id={`${id}-name`}>
            {item.item_name}
            {item.is_mandatory ? <span className="sr-only"> (required)</span> : <span className="ml-1.5 text-xs font-normal text-gray-500">optional</span>}
          </p>
          {item.description && <p className="text-xs text-gray-600">{item.description}</p>}
          {item.reference_instructions && (
            <p className="mt-1 flex items-start gap-1 text-xs text-harbor-700"><Info className="mt-0.5 h-3 w-3 shrink-0" />{item.reference_instructions}</p>
          )}
          {showError && missing && <p className="error-text">Required.</p>}
        </div>
        <div className="flex shrink-0 gap-1" role="radiogroup" aria-labelledby={`${id}-name`}>
          {choices.map((c) => {
            const on = item.result === c.value;
            return (
              <button key={c.value} type="button" role="radio" aria-checked={on} disabled={readOnly}
                onClick={() => toggle(c.value)}
                className={`min-w-[3.25rem] rounded-md px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${on ? c.on : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50'} disabled:cursor-default`}>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {(failed || item.remarks || !readOnly || item.attachments?.length > 0) && kind === 'inspection' && (
        <div className="mt-2">
          {readOnly ? (
            item.remarks && <p className="text-sm text-gray-800"><span className="text-gray-500">Remark: </span>{item.remarks}</p>
          ) : (
            (failed || item.remarks) && (
              <>
                <label htmlFor={`${id}-remarks`} className="sr-only">Remarks for {item.item_name}</label>
                <textarea id={`${id}-remarks`} rows={2} value={item.remarks || ''} onChange={(e) => set({ remarks: e.target.value })}
                  placeholder={failed ? 'Describe the defect (required)' : 'Remarks'}
                  className={`control ${showError && missingRemark ? 'control-error' : ''}`} aria-invalid={showError && missingRemark} />
                {showError && missingRemark && <p className="error-text">Describe what is wrong.</p>}
              </>
            )
          )}
          <AttachmentList attachments={item.attachments}
            onRemove={readOnly ? undefined : (attId) => set({ attachments: item.attachments.filter((a) => a.id !== attId) })} />
          {!readOnly && (
            <div className="mt-1 flex gap-2">
              {!failed && !item.remarks && (
                <button type="button" className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100" onClick={() => set({ remarks: ' ' })}>Add remark</button>
              )}
              <PhotoUpload ticketId={ticketId} repairId={repairId}
                onUploaded={(att) => set({ attachments: [...(item.attachments || []), att] })} />
            </div>
          )}
        </div>
      )}
    </li>
  );
}