import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { ACCEPTED_TYPES, MAX_UPLOAD_MB, uploadService } from '../../services/uploadService';
import { useToast } from '../../context/ToastContext';

export default function PhotoUpload({ ticketId, repairId, onUploaded, disabled, label = 'Add photo' }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(`Files must be ${MAX_UPLOAD_MB} MB or smaller.`);
      return;
    }
    setBusy(true);
    try {
      const att = await uploadService.upload(file, { ticketId, repairId });
      onUploaded(att);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input ref={ref} type="file" accept={ACCEPTED_TYPES} capture="environment" className="sr-only" onChange={onChange} tabIndex={-1} aria-hidden />
      <button type="button" onClick={() => ref.current?.click()} disabled={disabled || busy}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-harbor-700 hover:bg-harbor-50 disabled:text-gray-400">
        <Camera className="h-3.5 w-3.5" aria-hidden />{busy ? 'Uploading…' : label}
      </button>
    </>
  );
}
