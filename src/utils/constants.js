export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1802/api/v1';
export const POLL_INTERVAL_MS = Math.max(5, Number(import.meta.env.VITE_POLL_INTERVAL_SECONDS || 20)) * 1000;

export const DEPARTMENTS = {
  FRONT_DESK: { value: 'FRONT_DESK', label: 'Front Desk / Admin', home: '/frontdesk' },
  HOUSEKEEPING: { value: 'HOUSEKEEPING', label: 'Housekeeping', home: '/housekeeping' },
  ENGINEERING: { value: 'ENGINEERING', label: 'Engineering', home: '/engineering' },
};
export const DEPARTMENT_LIST = Object.values(DEPARTMENTS);

export const ROLES = {
  ADMIN: { label: 'Front Desk admin', department: 'FRONT_DESK', home: '/frontdesk' },
  HK_SUPERVISOR: { label: 'Housekeeping supervisor', department: 'HOUSEKEEPING', home: '/housekeeping/team' },
  ROOM_ATTENDANT: { label: 'Room attendant', department: 'HOUSEKEEPING', home: '/housekeeping' },
  ENG_SUPERVISOR: { label: 'Engineering supervisor', department: 'ENGINEERING', home: '/engineering/all' },
  TECHNICIAN: { label: 'Technician', department: 'ENGINEERING', home: '/engineering' },
};

/** Which accounts each role may create and manage (mirrors the API). */
export const MANAGEABLE_ROLES = {
  ADMIN: ['ADMIN', 'HK_SUPERVISOR', 'ENG_SUPERVISOR'],
  HK_SUPERVISOR: ['ROOM_ATTENDANT'],
  ENG_SUPERVISOR: ['TECHNICIAN'],
};

export const homeFor = (user) => ROLES[user?.role]?.home || DEPARTMENTS[user?.department]?.home || '/login';
export const roleLabel = (role) => ROLES[role]?.label || role;

export const OPERATIONAL_STATUSES = [
  'READY_FOR_GUEST', 'AWAITING_HOUSEKEEPING', 'HOUSEKEEPING_ASSIGNED', 'HOUSEKEEPING_IN_PROGRESS',
  'ENGINEERING_REQUIRED', 'ENGINEERING_ASSIGNED', 'ENGINEERING_IN_PROGRESS', 'AWAITING_FINAL_VERIFICATION', 'OUT_OF_SERVICE',
];
export const TICKET_STATUSES = [
  'AWAITING_HOUSEKEEPING', 'HOUSEKEEPING_ASSIGNED', 'HOUSEKEEPING_IN_PROGRESS', 'ENGINEERING_REQUIRED',
  'ENGINEERING_ASSIGNED', 'ENGINEERING_IN_PROGRESS', 'RECLEAN_REQUIRED', 'AWAITING_FINAL_VERIFICATION', 'CLOSED', 'CANCELLED',
];
export const REPAIR_STATUSES = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REOPENED', 'CANCELLED'];
export const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
export const CHECKLIST_TYPES = {
  HOUSEKEEPING_CLEANING: 'Housekeeping cleaning',
  HOUSEKEEPING_INSPECTION: 'Housekeeping inspection',
  ENGINEERING_INSPECTION: 'Engineering inspection',
};
