import { describe, expect, it } from 'vitest';
import { checklistProblems, checklistProgress, validatePassword, validateUserId } from '../utils/validators';
import { statusLabel } from '../utils/statusHelpers';

const item = (o) => ({ item_name: 'X', is_mandatory: true, result: 'PENDING', remarks: null, ...o });

describe('checklist rules (mirror the API)', () => {
  it('requires mandatory items and remarks on failures', () => {
    const results = [item({ item_name: 'Door lock' }), item({ item_name: 'AC', result: 'FAIL' }), item({ item_name: 'Fan', is_mandatory: false })];
    const problems = checklistProblems(results);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain('Door lock');
    expect(problems[1]).toContain('needs a remark');
    expect(checklistProblems([item({ result: 'FAIL', remarks: 'broken' })])).toEqual([]);
  });

  it('calculates progress from required items only', () => {
    const p = checklistProgress([item({ result: 'PASS' }), item({ result: 'PENDING' }), item({ is_mandatory: false, result: 'PENDING' }), item({ result: 'FAIL', remarks: 'x' })]);
    expect(p).toEqual({ required_total: 3, required_done: 2, percent: 67, failed: 1 });
  });
});

describe('form validators', () => {
  it('validates passwords like the server', () => {
    expect(validatePassword('short1')).toBeTruthy();
    expect(validatePassword('lettersonly')).toBeTruthy();
    expect(validatePassword('Passw0rd123')).toBeNull();
  });
  it('validates user ids', () => {
    expect(validateUserId('ab')).toBeTruthy();
    expect(validateUserId('hk.anita')).toBeNull();
  });
  it('labels statuses', () => {
    expect(statusLabel('AWAITING_FINAL_VERIFICATION')).toBe('Awaiting final verification');
  });
});
