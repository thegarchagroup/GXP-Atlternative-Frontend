import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, DoorOpen, Hammer, History, LogIn, Pencil } from 'lucide-react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import ConfirmDialog from '../common/ConfirmDialog';
import CreateRepairDialog from './CreateRepairDialog';
import RoomHistoryDialog from './RoomHistoryDialog';
import RoomFormDialog from './RoomFormDialog';
import { roomService } from '../../services/roomService';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/dateHelpers';

function Action({ icon: Icon, children, onClick, disabled, hint }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex w-full items-start gap-3 rounded-md border border-mist px-3 py-2.5 text-left hover:border-harbor-600 hover:bg-harbor-50/50 disabled:cursor-not-allowed disabled:opacity-50">
      <Icon className="mt-0.5 h-4 w-4 text-harbor-700" aria-hidden />
      <span><span className="block text-sm font-medium">{children}</span>{hint && <span className="block text-xs text-gray-500">{hint}</span>}</span>
    </button>
  );
}


/** Everything the front desk can do for one room. */
export default function RoomActionsDialog({ room, onClose, onChanged }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [dialog, setDialog] = useState(null);
  if (!room) return null;
  const hasTicket = !!room.active_ticket_id;
  const ready = room.operational_status === 'READY_FOR_GUEST';
  const oos = room.operational_status === 'OUT_OF_SERVICE';
  const done = (msg) => { toast.success(msg); onChanged?.(); };

  return (
    <>
      <Modal open={!!room && !dialog} onClose={onClose} title={`Room ${room.room_number}`}
        description={`Floor ${room.floor} | ${room.room_type?.name}`}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={room.operational_status} />
          <StatusBadge status={room.occupancy_status} />
          {room.active_ticket_number && <span className="text-sm text-gray-600">Ticket {room.active_ticket_number}</span>}
        </div>
        <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-gray-500">Housekeeper</dt><dd>{room.assigned_housekeeper?.display_name || '—'}</dd>
          <dt className="text-gray-500">Engineer</dt><dd>{room.assigned_engineer?.display_name || '—'}</dd>
          <dt className="text-gray-500">Last inspection</dt><dd>{formatDateTime(room.last_inspection_at)}</dd>
          <dt className="text-gray-500">Last ready</dt><dd>{formatDateTime(room.last_ready_at)}</dd>
        </dl>
        <div className="grid gap-2 sm:grid-cols-2">
          {ready && room.occupancy_status === 'VACANT' && <Action icon={LogIn} onClick={() => setDialog('checkin')}>Check guest in</Action>}
          <Action icon={Hammer} onClick={() => setDialog('repair')}
            hint={room.open_repairs ? `${room.open_repairs} repair(s) already open` : 'Send a job to engineering'}>Raise engineering repair</Action>
          {!hasTicket && !oos && <Action icon={Ban} onClick={() => setDialog('oos')}>Take out of service</Action>}
          {!hasTicket && oos && <Action icon={DoorOpen} onClick={() => setDialog('return')} hint="It goes on the next task sheet for cleaning">Return to service</Action>}
          <Action icon={History} onClick={() => setDialog('history')}>Inspection and repair history</Action>
          <Action icon={Pencil} onClick={() => setDialog('edit')}>Edit room details</Action>
        </div>
      </Modal>

      <CreateRepairDialog open={dialog === 'repair'} room={room} onClose={() => setDialog(null)}
        onCreated={(r) => { done(`Repair ${r.repair_number} sent to engineering.`); onClose(); }} />
      <RoomHistoryDialog roomId={dialog === 'history' ? room.id : null} onClose={() => setDialog(null)} />
      <RoomFormDialog open={dialog === 'edit'} room={room} onClose={() => setDialog(null)} onSaved={() => { done('Room updated.'); onClose(); }} />
      <ConfirmDialog open={dialog === 'checkin'} title={`Check a guest into room ${room.room_number}?`} confirmLabel="Mark occupied"
        onCancel={() => setDialog(null)}
        onConfirm={async () => {
          try { await roomService.setOccupancy(room.id, 'OCCUPIED'); done('Room marked occupied.'); onClose(); } catch (e) { toast.error(e); }
          setDialog(null);
        }} />
      <ConfirmDialog open={dialog === 'oos'} title={`Take room ${room.room_number} out of service?`} confirmLabel="Take out of service" variant="danger"
        reasonLabel="Reason" onCancel={() => setDialog(null)}
        onConfirm={async (reason) => {
          try { await roomService.overrideStatus(room.id, 'OUT_OF_SERVICE', reason); done('Room taken out of service.'); onClose(); } catch (e) { toast.error(e); }
          setDialog(null);
        }} />
      <ConfirmDialog open={dialog === 'return'} title={`Return room ${room.room_number} to service?`} confirmLabel="Return to service"
        message="The room will be marked Awaiting Housekeeping. Record a checkout to send it through cleaning and inspection."
        reasonLabel="Reason" onCancel={() => setDialog(null)}
        onConfirm={async (reason) => {
          try { await roomService.overrideStatus(room.id, 'AWAITING_HOUSEKEEPING', reason); done('Room returned to service.'); onClose(); } catch (e) { toast.error(e); }
          setDialog(null);
        }} />
    </>
  );
}
