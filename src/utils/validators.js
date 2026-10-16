export const USER_ID_PATTERN = /^[A-Za-z0-9._-]{3,80}$/;

export function validatePassword(pw) {
  if (!pw || pw.length < 8) return 'Use at least 8 characters.';
  if (new TextEncoder().encode(pw).length > 72) return 'Use at most 72 bytes.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one number.';
  return null;
}

export function validateUserId(id) {
  if (!id) return 'User ID is required.';
  if (!USER_ID_PATTERN.test(id)) return '3–80 characters: letters, numbers, dot, dash or underscore.';
  return null;
}

export function validateRoomNumber(n) {
  if (!n) return 'Room number is required.';
  if (!/^[A-Za-z0-9-]{1,20}$/.test(n)) return 'Letters, numbers and dashes only (max 20).';
  return null;
}

export function required(value, label) {
  return value === undefined || value === null || String(value).trim() === '' ? `${label} is required.` : null;
}

/** Checklist results that block submission, mirroring the server rules. */
export function checklistProblems(results) {
  const problems = [];
  for (const r of results) {
    if (r.is_mandatory && r.result === 'PENDING') problems.push(`"${r.item_name}" is required.`);
    if (r.result === 'FAIL' && !(r.remarks || '').trim()) problems.push(`"${r.item_name}" failed and needs a remark.`);
  }
  return problems;
}

export function checklistProgress(results) {
  const required = results.filter((r) => r.is_mandatory);
  const done = required.filter((r) => r.result !== 'PENDING').length;
  const failed = results.filter((r) => r.result === 'FAIL').length;
  const percent = required.length ? Math.round((100 * done) / required.length) : results.length ? 100 : 0;
  return { required_total: required.length, required_done: done, percent, failed };
}
