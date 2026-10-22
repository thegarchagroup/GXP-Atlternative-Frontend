/** Priority information from the task sheet, shown the same way to supervisors and room attendants. */
export function ReservationTag({ room }) {
  const res = room.reservation_status || (room.fo_status === 'VAC' ? 'Vacant' : '');
  const tone = res === 'Departed' || res === 'Vacant' ? 'bg-sky-50 text-sky-800 ring-sky-600/25'
    : res === 'Due Out' ? 'bg-amber-50 text-amber-900 ring-amber-600/30' : 'bg-gray-100 text-gray-700 ring-gray-500/25';
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {room.arrival_today && (
        <span className="rounded-full bg-brass px-2 py-0.5 text-xs font-semibold text-white" title="A guest arrives today">Arrival today</span>
      )}
      {res && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>{res}</span>}
      <span className={`rounded px-1.5 py-0.5 text-2xs font-semibold ${room.fo_status === 'OCC' ? 'bg-harbor-50 text-harbor-800' : 'bg-gray-100 text-gray-600'}`}>
        {room.fo_status === 'OCC' ? 'Occupied' : room.fo_status === 'VAC' ? 'Vacant' : room.fo_status}
      </span>
    </span>
  );
}

const STATUS = {
  PENDING: ['Not started', 'bg-gray-100 text-gray-700 ring-gray-500/25'],
  IN_PROGRESS: ['In progress', 'bg-sky-100 text-sky-900 ring-sky-700/30'],
  DONE: ['Done', 'bg-emerald-50 text-emerald-800 ring-emerald-600/25'],
};

export function RoomWorkStatus({ room }) {
  const [label, tone] = STATUS[room.status] || [room.status, ''];
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>{label}</span>
      {room.outcome === 'FAIL' && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800 ring-1 ring-inset ring-red-600/25">Sent to engineering</span>}
    </span>
  );
}
