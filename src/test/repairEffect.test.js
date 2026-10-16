import { describe, expect, it } from 'vitest';
import { repairEffect } from '../components/tickets/CreateRepairDialog';

const room = (o) => ({ active_ticket_id: null, occupancy_status: 'VACANT', operational_status: 'READY_FOR_GUEST', ...o });

describe('what raising a repair does to a room', () => {
  it('takes a vacant ready room off sale', () => {
    expect(repairEffect(room())).toMatch(/taken off sale until engineering completes/);
  });
  it('leaves an occupied room occupied', () => {
    expect(repairEffect(room({ occupancy_status: 'OCCUPIED' }))).toMatch(/guest stays in the room/);
  });
  it('joins an open turnover', () => {
    expect(repairEffect(room({ active_ticket_id: 4, active_ticket_number: 'TT-1', operational_status: 'HOUSEKEEPING_ASSIGNED' })))
      .toMatch(/Added to the open turnover TT-1/);
  });
});
