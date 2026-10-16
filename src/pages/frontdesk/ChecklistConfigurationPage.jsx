import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input, { Checkbox, Textarea } from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState, { ErrorBanner } from '../../components/common/EmptyState';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { useApi } from '../../hooks/useApi';
import { checklistService } from '../../services/checklistService';
import { roomService } from '../../services/roomService';
import { useToast } from '../../context/ToastContext';
import { CHECKLIST_TYPES } from '../../utils/constants';

const BLANK_ITEM = { name: '', description: '', category: '', is_mandatory: true, allow_not_applicable: false, is_active: true,
  display_order: 0, room_type_ids: [], reference_instructions: '', reference_image_url: '' };

function ItemDialog({ open, item, template, roomTypes, onClose, onSaved }) {
  const [form, setForm] = useState(BLANK_ITEM);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    const nextOrder = ((template?.items || []).reduce((m, i) => Math.max(m, i.display_order), 0) || 0) + 10;
    setForm(item ? { ...BLANK_ITEM, ...item, description: item.description || '', reference_instructions: item.reference_instructions || '', reference_image_url: item.reference_image_url || '' }
      : { ...BLANK_ITEM, display_order: nextOrder });
    setError(null);
  }, [open, item, template]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleType = (id) => set('room_type_ids', form.room_type_ids.includes(id) ? form.room_type_ids.filter((x) => x !== id) : [...form.room_type_ids, id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError({ message: 'Item name is required.' }); return; }
    setBusy(true);
    setError(null);
    const body = {
      name: form.name.trim(), description: form.description || null, category: form.category.trim() || 'General',
      is_mandatory: form.is_mandatory, allow_not_applicable: form.allow_not_applicable, is_active: form.is_active,
      display_order: Number(form.display_order) || 0, room_type_ids: form.room_type_ids,
      reference_instructions: form.reference_instructions || null, reference_image_url: form.reference_image_url || null,
    };
    try {
      if (item) await checklistService.updateItem(item.id, body); else await checklistService.addItem(template.id, body);
      onSaved();
      onClose();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={item ? `Edit "${item.name}"` : `Add item to ${template?.name}`}
      description="Changes apply to inspections started from now on. Inspections already started keep the items they began with."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="item-form" loading={busy}>{item ? 'Save item' : 'Add item'}</Button></>}>
      <form id="item-form" onSubmit={submit} className="space-y-3" noValidate>
        <ErrorBanner error={error} />
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem_7rem]">
          <Input label="Item name" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          <Input label="Category" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Bathroom" />
          <Input label="Order" type="number" value={form.display_order} onChange={(e) => set('display_order', e.target.value)} />
        </div>
        <Textarea label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} />
        <Textarea label="Instructions for staff" value={form.reference_instructions} onChange={(e) => set('reference_instructions', e.target.value)} rows={2}
          help="Shown under the item while inspecting." />
        <Input label="Reference image URL" value={form.reference_image_url} onChange={(e) => set('reference_image_url', e.target.value)} placeholder="Optional" />
        <div className="grid gap-2 sm:grid-cols-3">
          <Checkbox label="Required" checked={form.is_mandatory} onChange={(v) => set('is_mandatory', v)} help="Cannot be skipped" />
          <Checkbox label="Allow N/A" checked={form.allow_not_applicable} onChange={(v) => set('allow_not_applicable', v)} help="e.g. fan where installed" />
          <Checkbox label="Active" checked={form.is_active} onChange={(v) => set('is_active', v)} />
        </div>
        <fieldset>
          <legend className="label">Applies to room types</legend>
          <p className="help mb-2">Leave all unticked to apply to every room type.</p>
          <div className="flex flex-wrap gap-3">
            {roomTypes.map((t) => <Checkbox key={t.id} label={t.name} checked={form.room_type_ids.includes(t.id)} onChange={() => toggleType(t.id)} />)}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

function TemplateDialog({ open, template, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '', checklist_type: '', is_active: true });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setForm(template ? { name: template.name, description: template.description || '', checklist_type: template.checklist_type, is_active: template.is_active }
      : { name: '', description: '', checklist_type: '', is_active: true });
    setError(null);
  }, [open, template]);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.checklist_type) { setError({ message: 'Name and type are required.' }); return; }
    setBusy(true);
    try {
      const saved = template
        ? await checklistService.update(template.id, { name: form.name.trim(), description: form.description || null, is_active: form.is_active })
        : await checklistService.create({ name: form.name.trim(), description: form.description || null, checklist_type: form.checklist_type, is_active: form.is_active });
      onSaved(saved);
      onClose();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={template ? 'Edit checklist' : 'New checklist'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="tpl-form" loading={busy}>Save</Button></>}>
      <form id="tpl-form" onSubmit={submit} className="space-y-3" noValidate>
        <ErrorBanner error={error} />
        <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Select label="Used for" required disabled={!!template} value={form.checklist_type} placeholder="Choose…"
          options={Object.entries(CHECKLIST_TYPES).map(([value, label]) => ({ value, label }))} onChange={(e) => setForm({ ...form, checklist_type: e.target.value })} />
        <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        <Checkbox label="Active" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} help="Inactive checklists are not added to new inspections." />
      </form>
    </Modal>
  );
}

export default function ChecklistConfigurationPage() {
  const toast = useToast();
  const [type, setType] = useState('HOUSEKEEPING_INSPECTION');
  const [selectedId, setSelectedId] = useState(null);
  const [itemDialog, setItemDialog] = useState(null);
  const [tplDialog, setTplDialog] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const lists = useApi(() => checklistService.list({ checklist_type: type }), [type]);
  const roomTypes = useApi(roomService.types, []);
  const templates = lists.data || [];
  const selected = templates.find((t) => t.id === selectedId) || templates[0];
  const typeName = (ids) => (ids.length ? ids.map((id) => roomTypes.data?.find((t) => t.id === id)?.name || id).join(', ') : 'All room types');

  const grouped = useMemo(() => {
    const g = {};
    (selected?.items || []).forEach((i) => (g[i.category] ||= []).push(i));
    return Object.entries(g);
  }, [selected]);

  const doDelete = async () => {
    try {
      if (confirm.kind === 'item') await checklistService.removeItem(confirm.item.id);
      else { await checklistService.remove(confirm.template.id); setSelectedId(null); }
      toast.success('Removed. Inspections already recorded are unchanged.');
      lists.refresh();
    } catch (err) { toast.error(err); }
    setConfirm(null);
  };

  return (
    <>
      <PageHeader title="Checklist configuration" subtitle="What housekeeping and engineering check in every room."
        actions={<Button icon={Plus} variant="secondary" onClick={() => setTplDialog('new')}>New checklist</Button>} />
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-mist bg-white p-1" role="tablist">
        {Object.entries(CHECKLIST_TYPES).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={type === value} onClick={() => { setType(value); setSelectedId(null); }}
            className={`rounded-md px-3 py-1.5 text-sm ${type === value ? 'bg-harbor-700 font-semibold text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{label}</button>
        ))}
      </div>
      {lists.error && <ErrorBanner error={lists.error} onRetry={lists.reload} />}
      {lists.loading && !lists.data ? <PageLoader /> : templates.length === 0 ? (
        <div className="panel"><EmptyState title="No checklist of this type" message="Create one so inspections can start."
          action={<Button icon={Plus} onClick={() => setTplDialog('new')}>New checklist</Button>} /></div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
          <ul className="space-y-1" aria-label="Checklists">
            {templates.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => setSelectedId(t.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${selected?.id === t.id ? 'border-harbor-700 bg-white ring-1 ring-harbor-700' : 'border-mist bg-white hover:border-harbor-600'}`}>
                  <span className="block font-medium">{t.name}</span>
                  <span className="text-xs text-gray-500">{t.items.length} items{t.is_active ? '' : ' | inactive'}</span>
                </button>
              </li>
            ))}
          </ul>
          {selected && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="text-base font-semibold">{selected.name} {!selected.is_active && <span className="text-sm font-normal text-gray-500">(inactive)</span>}</h2>
                  {selected.description && <p className="text-sm text-gray-600">{selected.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setTplDialog(selected)}>Edit</Button>
                  <Button size="sm" variant="secondary" icon={Trash2} onClick={() => setConfirm({ kind: 'template', template: selected })}>Delete</Button>
                  <Button size="sm" icon={Plus} onClick={() => setItemDialog({ item: null })}>Add item</Button>
                </div>
              </div>
              {grouped.length === 0 ? <EmptyState title="No items yet" message="Add the things staff should check." /> : grouped.map(([cat, items]) => (
                <div key={cat}>
                  <h3 className="border-b border-mist bg-gray-50/70 px-4 py-2 text-sm font-semibold">{cat}</h3>
                  <ul className="divide-y divide-gray-100">
                    {items.map((i) => (
                      <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                        <div className={i.is_active ? '' : 'opacity-50'}>
                          <p className="text-sm font-medium">{i.name}</p>
                          <p className="text-xs text-gray-500">
                            {i.is_mandatory ? 'Required' : 'Optional'}{i.allow_not_applicable ? ' | N/A allowed' : ''} | {typeName(i.room_type_ids)} | order {i.display_order}{i.is_active ? '' : ' | inactive'}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setItemDialog({ item: i })}>Edit</Button>
                          <Button size="sm" variant="ghost" className="text-red-700" onClick={() => setConfirm({ kind: 'item', item: i })}>Remove</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
      <ItemDialog open={!!itemDialog} item={itemDialog?.item} template={selected} roomTypes={roomTypes.data || []}
        onClose={() => setItemDialog(null)} onSaved={() => { toast.success('Checklist saved.'); lists.refresh(); }} />
      <TemplateDialog open={!!tplDialog} template={tplDialog === 'new' ? null : tplDialog} onClose={() => setTplDialog(null)}
        onSaved={(t) => { toast.success('Checklist saved.'); if (t.checklist_type !== type) setType(t.checklist_type); setSelectedId(t.id); lists.refresh(); }} />
      <ConfirmDialog open={!!confirm} variant="danger" onCancel={() => setConfirm(null)} onConfirm={doDelete}
        title={confirm?.kind === 'item' ? `Remove "${confirm.item.name}"?` : `Delete "${confirm?.template?.name}"?`}
        confirmLabel="Remove" message="New inspections will no longer include it. Past and in-progress inspections keep their recorded items." />
    </>
  );
}
