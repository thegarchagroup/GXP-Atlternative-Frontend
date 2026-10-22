// One colour family per stage of the turnover, used everywhere a status appears.
const TONES = {
  ready: 'bg-emerald-50 text-emerald-800 ring-emerald-600/25',
  housekeeping: 'bg-sky-50 text-sky-800 ring-sky-600/25',
  housekeepingActive: 'bg-sky-100 text-sky-900 ring-sky-700/30',
  engineering: 'bg-amber-50 text-amber-900 ring-amber-600/30',
  engineeringActive: 'bg-orange-100 text-orange-900 ring-orange-700/30',
  verify: 'bg-violet-50 text-violet-800 ring-violet-600/25',
  danger: 'bg-red-50 text-red-800 ring-red-600/25',
  neutral: 'bg-gray-100 text-gray-700 ring-gray-500/25',
  occupied: 'bg-harbor-50 text-harbor-800 ring-harbor-600/25',
};

// Bar colour used on room rack tiles
export const RACK_BAR = {
  READY_FOR_GUEST: 'bg-emerald-600',
  AWAITING_HOUSEKEEPING: 'bg-sky-400',
  HOUSEKEEPING_ASSIGNED: 'bg-sky-500',
  HOUSEKEEPING_IN_PROGRESS: 'bg-sky-700',
  ENGINEERING_REQUIRED: 'bg-red-600',
  ENGINEERING_ASSIGNED: 'bg-amber-500',
  ENGINEERING_IN_PROGRESS: 'bg-orange-600',
  AWAITING_FINAL_VERIFICATION: 'bg-violet-600',
  OUT_OF_SERVICE: 'bg-gray-500',
};

const STATUS = {
  READY_FOR_GUEST: ['Ready for guest', 'ready'],
  AWAITING_HOUSEKEEPING: ['Awaiting housekeeping', 'housekeeping'],
  HOUSEKEEPING_ASSIGNED: ['Housekeeping assigned', 'housekeeping'],
  HOUSEKEEPING_IN_PROGRESS: ['Housekeeping in progress', 'housekeepingActive'],
  ENGINEERING_REQUIRED: ['Engineering required', 'danger'],
  ENGINEERING_ASSIGNED: ['Engineering assigned', 'engineering'],
  ENGINEERING_IN_PROGRESS: ['Engineering in progress', 'engineeringActive'],
  AWAITING_FINAL_VERIFICATION: ['Awaiting final verification', 'verify'],
  OUT_OF_SERVICE: ['Out of service', 'neutral'],
  RECLEAN_REQUIRED: ['Re-clean required', 'housekeeping'],
  CLOSED: ['Closed', 'ready'],
  CANCELLED: ['Cancelled', 'neutral'],
  OCCUPIED: ['Occupied', 'occupied'],
  VACANT: ['Vacant', 'neutral'],
  NEW: ['New', 'danger'],
  ASSIGNED: ['Assigned', 'engineering'],
  IN_PROGRESS: ['In progress', 'engineeringActive'],
  COMPLETED: ['Completed', 'ready'],
  REOPENED: ['Reopened', 'danger'],
  SUBMITTED: ['Submitted', 'verify'],
  SUPERSEDED: ['Superseded', 'neutral'],
  PASS: ['Pass', 'ready'],
  FAIL: ['Fail', 'danger'],
  NOT_APPLICABLE: ['N/A', 'neutral'],
  PENDING: ['Pending', 'engineering'],
  DONE: ['Done', 'ready'],
  LOW: ['Low', 'neutral'],
  NORMAL: ['Normal', 'housekeeping'],
  HIGH: ['High', 'engineering'],
  URGENT: ['Urgent', 'danger'],
};

export function statusLabel(status) {
  if (!status) return '';
  return STATUS[status]?.[0] || status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function statusTone(status) {
  return TONES[STATUS[status]?.[1] || 'neutral'];
}

export const departmentLabel = (d) => ({ FRONT_DESK: 'Front Desk', HOUSEKEEPING: 'Housekeeping', ENGINEERING: 'Engineering' }[d] || d);
