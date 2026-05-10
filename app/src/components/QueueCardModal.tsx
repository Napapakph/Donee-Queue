'use client';
import { useState, useEffect } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import type { QueueCard, ScaleType, ProgressStage, PaymentStatus } from '@/lib/types';
import { addDays, format } from 'date-fns';
import { MinimalDatePicker } from './MinimalDatePicker';
import { MinimalTimePicker } from './MinimalTimePicker';

interface Props {
  card: QueueCard | null;
  onClose: () => void;
}

const STAGES: ProgressStage[] = ['Waiting', 'Sketching', 'Adding Details', 'Complete'];

function calcPrice(basePrice: number, scaleModifier: number, scaleType: 'flat' | 'percentage', qty: number, isCommercial: boolean): number {
  let price = basePrice;
  if (scaleType === 'percentage') price = price * (1 + scaleModifier / 100);
  else price = price + scaleModifier;

  if (isCommercial) price = price * 2;

  return price * qty;
}

export function QueueCardModal({ card, onClose }: Props) {
  const { addCard, updateCard, workTypes, platforms, addPlatform, settings } = useAppStore();
  const { toast } = useToast();
  const supabase = createClient();

  const today = format(new Date(), 'yyyy-MM-dd');

  // Find current work type and its scales
  const [form, setForm] = useState<Omit<QueueCard, 'id' | 'createdAt' | 'updatedAt'>>(() => {
    const firstWT = workTypes[0];
    const firstScale = firstWT?.scales?.[0];
    
    return {
      customerName: '',
      platformId: platforms[0]?.id || '',
      workTypeId: firstWT?.id || '',
      scaleTypeId: firstScale?.id,
      description: '',
      price: firstScale?.basePrice || 0,
      isCommercial: false,
      isPublic: settings.defaultCardPublic,
      isNSFW: false,
      quantity: 1,
      briefReceived: false,
      paymentStatus: 'unpaid',
      commissionDate: today,
      commissionTime: format(new Date(), 'HH:mm'),
      deadlineDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'), // Fallback 7 days
      progress: 'Waiting',
      notes: '',
      images: [],
    };
  });

  const [newPlatform, setNewPlatform] = useState('');
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculate price & deadline when work type / scale changes
  useEffect(() => {
    const wt = workTypes.find((w) => w.id === form.workTypeId);
    if (!wt) return;
    
    const sc = (wt.scales || []).find((s: ScaleType) => s.id === form.scaleTypeId);
    
    // Parse estimated time (e.g., "3-5 days" -> 5)
    const getDays = (str?: string) => {
      if (!str) return 7;
      const match = str.match(/(\d+)/g);
      if (!match) return 7;
      return parseInt(match[match.length - 1]);
    };

    const baseDays = getDays(sc?.estimatedTime);
    const deadline = format(addDays(new Date(form.commissionDate), baseDays), 'yyyy-MM-dd');
    const price = sc?.basePrice || 0;
    
    setForm((f) => ({ ...f, deadlineDate: deadline, price: price }));
  }, [form.workTypeId, form.scaleTypeId, form.commissionDate]);

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
      commissionTime: card.commissionTime || format(new Date(card.createdAt), 'HH:mm'),
      deadlineDate: card.deadlineDate,
      progress: card.progress,
      notes: card.notes,
      images: card.images,
    });
  }, [card]);

  const handleSave = async () => {
    if (!form.customerName.trim()) return toast('Customer name required', 'error');
    if (!form.workTypeId) return toast('Work type required', 'error');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast('Not logged in', 'error');

    setIsSubmitting(true);
    try {
      const dbData = {
        customer_name: form.customerName,
        platform_id: form.platformId,
        work_type_id: form.workTypeId,
        scale_type_id: form.scaleTypeId,
        description: form.description,
        price: form.price,
        quantity: form.quantity,
        is_commercial: form.isCommercial,
        is_public: form.isPublic,
        is_nsfw: form.isNSFW,
        brief_received: form.briefReceived,
        payment_status: form.paymentStatus,
        commission_date: form.commissionDate,
        deadline_date: form.deadlineDate,
        progress: form.progress,
        notes: form.notes,
        images: form.images,
      };

      if (card) {
        const { error } = await supabase.from('queue_cards').update(dbData).eq('id', card.id);
        if (error) throw error;
        updateCard(card.id, form);
        toast('Commission updated', 'success');
      } else {
        const { data, error } = await supabase.from('queue_cards').insert({ ...dbData, user_id: user.id }).select('id').single();
        if (error) throw error;
        addCard({ ...form, id: data.id });
        toast('Commission added!', 'success');
      }
      onClose();
    } catch (err: any) {
      toast(`DB Error: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
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
                {workTypes.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Scale <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(optional)</span></label>
              <select className="select" value={form.scaleTypeId || ''} onChange={(e) => set('scaleTypeId', e.target.value || undefined)}>
                <option value="">Select Scale...</option>
                {(workTypes.find(w => w.id === form.workTypeId)?.scales || []).map((s: ScaleType) => (
                  <option key={s.id} value={s.id}>{s.title} ({settings.currency}{s.basePrice})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="label">Work Description</label>
            <textarea className="textarea" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the commission..." />
          </div>

          {/* Row 3: Price + Qty */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label className="label">Price (auto-calculated)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  color: 'var(--accent)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  opacity: 0.8
                }}>
                  {settings.currency}
                </span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => set('price', +e.target.value)}
                  style={{ paddingLeft: '2.4rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Quantity</label>
              <div style={{
                display: 'flex',
                gap: '0.2rem',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.03)',
                padding: '0.25rem',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => set('quantity', Math.max(1, form.quantity - 1))}
                  style={{ border: 'none', background: 'none' }}
                >
                  −
                </button>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => set('quantity', Math.max(1, +e.target.value))}
                  style={{ textAlign: 'center', width: '100%', border: 'none', background: 'none', fontWeight: 700 }}
                />
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => set('quantity', form.quantity + 1)}
                  style={{ border: 'none', background: 'none' }}
                >
                  +
                </button>
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
            <div style={{
              display: 'flex',
              gap: '0.4rem',
              background: 'rgba(255,255,255,0.03)',
              padding: '0.35rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {(['unpaid', 'deposit', 'paid'] as PaymentStatus[]).map((s) => {
                const isActive = form.paymentStatus === s;
                const labels: Record<string, string> = { unpaid: 'Unpaid', deposit: '50% Deposit', paid: 'Fully Paid' };
                const colors: Record<string, string> = { unpaid: 'var(--danger)', deposit: 'var(--warning)', paid: 'var(--success)' };

                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('paymentStatus', s)}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 800 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: isActive ? colors[s] : 'var(--text-muted)',
                      boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                      borderBottom: isActive ? `2px solid ${colors[s]}` : '2px solid transparent',
                    }}
                  >
                    {labels[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label">Commission Date & Time</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 2 }}>
                  <MinimalDatePicker
                    value={form.commissionDate}
                    onChange={(val) => set('commissionDate', val)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <MinimalTimePicker 
                    value={form.commissionTime || '00:00'}
                    onChange={(val) => set('commissionTime', val)}
                  />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Deadline Date — auto-suggested</label>
              <MinimalDatePicker
                value={form.deadlineDate}
                onChange={(val) => set('deadlineDate', val)}
              />
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
          <button className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : <><Check size={15} /> {card ? 'Save Changes' : 'Add Commission'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
