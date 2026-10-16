import { RACK_BAR, statusLabel } from '../../utils/statusHelpers';

/** Occupied rooms show as occupied first; the cleaning/repair state is added only if unusual. */
function tileState(r) {
  if (r.occupancy_status === 'OCCUPIED') {
    let label = r.operational_status === 'READY_FOR_GUEST' ? 'Occupied' : `Occupied | ${statusLabel(r.operational_status)}`;
    if (r.open_repairs > 0 && r.operational_status === 'READY_FOR_GUEST') label = 'Occupied | repair open';
    return { bar: OCCUPIED_BAR, label };
  }
  return { bar: RACK_BAR[r.operational_status] || 'bg-gray-300', label: statusLabel(r.operational_status) };
}

const OCCUPIED_BAR = 'bg-harbor-700';

/** Rooms laid out floor by floor, like a front-desk room rack. */
export default function RoomRack({ rooms, onSelect, selectedId }) {
  const floors = {};
  for (const r of rooms) (floors[r.floor] ||= []).push(r);
  const order = Object.keys(floors).map(Number).sort((a, b) => b - a);
  if (!rooms.length) return null;
  return (
    <div className="space-y-3">
      {order.map((floor) => (
        <div key={floor} className="flex items-start gap-3">
          <div className="w-12 shrink-0 pt-2 text-right">
            <span className="text-xs text-gray-500">Floor</span>
            <span className="room-no block text-lg font-semibold leading-none text-harbor-800">{floor}</span>
          </div>
          <ul className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-1.5">
            {floors[floor].sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true })).map((r) => {
              const state = tileState(r);
              return (
              <li key={r.id}>
                <button type="button" onClick={() => onSelect?.(r)}
                  className={`group w-full rounded-md border bg-white px-2.5 pb-2 pt-1.5 text-left hover:border-harbor-600 ${selectedId === r.id ? 'border-harbor-700 ring-1 ring-harbor-700' : 'border-mist'}`}
                  aria-label={`Room ${r.room_number}: ${state.label}`}>
                  <span className={`block h-1 w-8 rounded-full ${state.bar}`} aria-hidden />
                  <span className="room-no mt-1.5 block text-lg font-semibold text-harbor-800">{r.room_number}</span>
                  <span className="line-clamp-2 block min-h-[2rem] text-2xs leading-4 text-gray-600" title={state.label}>{state.label}</span>
                </button>
              </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function RackLegend() {
  const keys = ['READY_FOR_GUEST', 'AWAITING_HOUSEKEEPING', 'HOUSEKEEPING_IN_PROGRESS', 'ENGINEERING_REQUIRED',
    'ENGINEERING_IN_PROGRESS', 'AWAITING_FINAL_VERIFICATION', 'OUT_OF_SERVICE'];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
      {keys.map((k) => (
        <li key={k} className="flex items-center gap-1.5"><span className={`h-1.5 w-4 rounded-full ${RACK_BAR[k]}`} />{statusLabel(k)}</li>
      ))}
      <li className="flex items-center gap-1.5"><span className={`h-1.5 w-4 rounded-full ${OCCUPIED_BAR}`} />Occupied</li>
    </ul>
  );
}
