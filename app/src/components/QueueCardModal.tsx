'use client';
import { useState, useEffect } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ToastProvider';
import type { QueueCard, ProgressStage, PaymentStatus } from '@/lib/types';
import { addDays, format } from 'date-fns';

interface Props {
  card: QueueCard | null;
  onClose: () => void;
}

const STAGES: ProgressStage[] = ['Waiting', 'Sketching', 'Line Art', 'Base Coloring', 'Adding Details', 'Complete'];

function calcPrice(basePrice: number, scaleModifier: number, scaleType: 'flat' | 'percentage', qty: number): number {
  let price = basePrice;
  if (scaleType === 'percentage') price = price * (1 + scaleModifier / 100);
  else price = price + scaleModifier;
  return price * qty;
}

export function QueueCardModal({ card, onClose }: Props) {
  const { addCard, updateCard, workTypes, scaleTypes, platforms, addPlatform, settings } = useAppStore();
  const { toast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');

  const [form, setForm] = useState<Omit<QueueCard, 'id' | 'createdAt' | 'updatedAt'>>({
    customerName: '',
    platformId: platforms[0]?.id || '',
    workTypeId: workTypes[0]?.id || '',
    scaleTypeId: undefined,
    description: '',
    price: workTypes[0]?.basePrice || 0,
    isCommercial: false,
    isPublic: settings.defaultCardPublic,
    isNSFW: false,
    quantity: 1,
    briefReceived: false,
    paymentStatus: 'unpaid',
    commissionDate: today,
    deadlineDate: format(addDays(new Date(), workTypes[0]?.estimatedDurationDays || 7), 'yyyy-MM-dd'),
    progress: 'Waiting',
    notes: '',
    images: [],
  });

  const [newPlatform, setNewPlatform] = useState('');
  const [showAddPlatform, setShowAddPlatform] = useState(false);

  // Auto-calculate price & deadline when work type / scale changes
  useEffect(() => {
    const wt = workTypes.find((w) => w.id === form.workTypeId);
    const sc = scaleTypes.find((s) => s.id === form.scaleTypeId);
    if (!wt) return;
    const baseDays = wt.estimatedDurationDays + (sc?.durationModifierDays || 0);
    const deadline = format(addDays(new Date(form.commissionDate), baseDays), 'yyyy-MM-dd');
    const price = calcPrice(wt.basePrice, sc?.priceModifier || 0, sc?.priceModifierType || 'flat', form.quantity);
    setForm((f) => ({ ...f, deadlineDate: deadline, price }));
  }, [form.workTypeId, form.scaleTypeId, form.commissionDate, form.quantity]);

  // Populate form if editing
  useEffect(() => {
    if (card) setForm({
      customerName: card.customerName,
      platformId: card.platformId,
      workTypeId: card.workTypeId,
      scaleTypeId: card.scaleTypeId,
      description: card.description,
      price: card.price,
      isCommercial: card.isCommercial,
      isPublic: card.isPublic,
      isNSFW: card.isNSFW,
      quantity: card.quantity,
      briefReceived: card.briefReceived,
      paymentStatus: card.paymentStatus,
      commissionDate: card.commissionDate,
      deadlineDate: card.deadlineDate,
      progress: card.progress,
      notes: card.notes,
      images: card.images,
    });
  }, [card]);

  const handleSave = () => {
    if (!form.customerName.trim()) return toast('Customer name required', 'error');
    if (!form.workTypeId) return toast('Work type required', 'error');
    if (card) {
      updateCard(card.id, form);
      toast('Commission updated', 'success');
    } else {
      addCard(form);
      toast('Commission added!', 'success');
    }
    onClose();
  };

  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{card ? 'Edit Commission' : 'New Commission'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Row 1: Customer + Platform */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label">Customer Name *</label>
              <input className="input" value={form.customerName} onChange={(e) => set('customerName', e.target.value)} placeholder="e.g. Alice" />
            </div>
            <div className="form-group">
              <label className="label">Platform</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <select className="select" value={form.platformId} onChange={(e) => set('platformId', e.target.value)}>
                  {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button className="btn-icon" onClick={() => setShowAddPlatform(!showAddPlatform)} title="Add platform"><Plus size={14} /></button>
              </div>
              {showAddPlatform && (
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                  <input className="input" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} placeholder="Platform name" />
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    if (newPlatform.trim()) { addPlatform({ name: newPlatform.trim() }); setNewPlatform(''); setShowAddPlatform(false); }
                  }}>Add</button>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Work Type + Scale */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label">Work Type *</label>
              <select className="select" value={form.workTypeId} onChange={(e) => set('workTypeId', e.target.value)}>
                {workTypes.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Scale <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(optional)</span></label>
              <select className="select" value={form.scaleTypeId || ''} onChange={(e) => set('scaleTypeId', e.target.value || undefined)}>
                <option value="">— None —</option>
                {scaleTypes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="label">Work Description</label>
            <textarea className="textarea" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the commission..." />
          </div>

          {/* Row 3: Price + Qty */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label">Price ({settings.currency}) — auto-calculated</label>
              <input className="input" type="number" min="0" value={form.price}
                onChange={(e) => set('price', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Quantity</label>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <button className="btn-icon" onClick={() => set('quantity', Math.max(1, form.quantity - 1))}>−</button>
                <input className="input" type="number" min="1" value={form.quantity}
                  onChange={(e) => set('quantity', Math.max(1, +e.target.value))}
                  style={{ textAlign: 'center', width: 64 }} />
                <button className="btn-icon" onClick={() => set('quantity', form.quantity + 1)}>+</button>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'isCommercial', label: 'Commercial Use' },
              { key: 'isPublic', label: 'Public' },
              { key: 'isNSFW', label: 'NSFW' },
              { key: 'briefReceived', label: 'Brief Received' },
            ].map(({ key, label }) => (
              <label key={key} className="toggle-wrap">
                <span className="toggle">
                  <input type="checkbox" checked={!!form[key as keyof typeof form]}
                    onChange={(e) => set(key as keyof typeof form, e.target.checked)} />
                  <span className="toggle-slider" />
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
              </label>
            ))}
          </div>

          {/* Payment Status */}
          <div className="form-group">
            <label className="label">Payment Status</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {(['unpaid', 'deposit', 'paid'] as PaymentStatus[]).map((s) => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="radio" name="payment" value={s} checked={form.paymentStatus === s}
                    onChange={() => set('paymentStatus', s)}
                    style={{ accentColor: 'var(--accent)' }} />
                  {s === 'unpaid' ? 'Unpaid' : s === 'deposit' ? '50% Deposit' : 'Fully Paid'}
                </label>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label">Commission Date</label>
              <input className="input" type="date" value={form.commissionDate}
                onChange={(e) => set('commissionDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Deadline Date — auto-suggested</label>
              <input className="input" type="date" value={form.deadlineDate}
                onChange={(e) => set('deadlineDate', e.target.value)} />
            </div>
          </div>

          {/* Progress */}
          <div className="form-group">
            <label className="label">Current Progress</label>
            <select className="select" value={form.progress} onChange={(e) => set('progress', e.target.value as ProgressStage)}>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="label">Additional Notes</label>
            <textarea className="textarea" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any extra details..." style={{ minHeight: 60 }} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Check size={15} /> {card ? 'Save Changes' : 'Add Commission'}
          </button>
        </div>
      </div>
    </div>
  );
}
