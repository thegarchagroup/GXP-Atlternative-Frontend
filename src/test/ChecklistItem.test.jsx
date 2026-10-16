import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChecklistItem from '../components/checklist/ChecklistItem';
import { ToastProvider } from '../context/ToastContext';

const base = { id: 1, item_name: 'Air conditioning', checklist_type: 'HOUSEKEEPING_INSPECTION', is_mandatory: true,
  allow_not_applicable: false, result: 'PENDING', remarks: null, attachments: [] };
const renderItem = (item, onChange = vi.fn()) => {
  render(<ToastProvider><ul><ChecklistItem item={item} onChange={onChange} ticketId={1} showError /></ul></ToastProvider>);
  return onChange;
};

describe('ChecklistItem', () => {
  it('offers Pass and Fail, and N/A only when allowed', () => {
    renderItem(base);
    expect(screen.getByRole('radio', { name: 'Pass' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Fail' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'N/A' })).not.toBeInTheDocument();
    expect(screen.getByText('Required.')).toBeInTheDocument();
  });

  it('reports a Fail selection', async () => {
    const onChange = renderItem(base);
    await userEvent.click(screen.getByRole('radio', { name: 'Fail' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL' }));
  });

  it('asks for a remark when failed', () => {
    renderItem({ ...base, result: 'FAIL' });
    expect(screen.getByPlaceholderText(/Describe the defect/)).toBeInTheDocument();
    expect(screen.getByText('Describe what is wrong.')).toBeInTheDocument();
  });

  it('shows cleaning tasks as Done, never Fail', () => {
    renderItem({ ...base, checklist_type: 'HOUSEKEEPING_CLEANING', allow_not_applicable: true });
    expect(screen.getByRole('radio', { name: 'Done' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'N/A' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Fail' })).not.toBeInTheDocument();
  });
});
