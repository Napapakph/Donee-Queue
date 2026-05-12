'use client';
import { useState, useEffect } from 'react';
import { Check, X, Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import type { QueueCard, ScaleType, ProgressStage, PaymentStatus, PricingExtra } from '@/lib/types';
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
      selectedExtras: [],
    };
  });

  const [newPlatform, setNewPlatform] = useState('');
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [showEditPlatform, setShowEditPlatform] = useState(false);
  const [editingPlatformName, setEditingPlatformName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculate price & deadline when work type / scale changes
  const autoFill = (workId: string, scaleId?: string, commDate?: string) => {
    const wt = workTypes.find((w) => w.id === workId);
    if (!wt) return;
    
    const sc = (wt.scales || []).find((s: ScaleType) => s.id === scaleId);
    
    // Parse estimated time (e.g., "3-5 days" -> 5)
    const getDays = (str?: string) => {
      if (!str) return 7;
      const match = str.match(/(\d+)/g);
      if (!match) return 7;
      return parseInt(match[match.length - 1]);
    };

    const baseDays = getDays(sc?.estimatedTime);
    const deadline = format(addDays(new Date(commDate || form.commissionDate), baseDays), 'yyyy-MM-dd');
    const price = sc?.basePrice || 0;
    
    setForm((f) => ({ ...f, deadlineDate: deadline, price: price, selectedExtras: [] }));
  };

  const calculateTotalPrice = (base: number, extras: { price: number; type: 'flat' | 'percentage' }[]) => {
    let total = base;
    let percentageBonus = 0;
    
    extras.forEach(ex => {
      if (ex.type === 'flat') total += ex.price;
      else percentageBonus += ex.price;
    });

    if (percentageBonus > 0) {
      total = total * (1 + percentageBonus / 100);
    }

    return total;
  };

  const toggleExtra = (extra: PricingExtra) => {
    const isSelected = form.selectedExtras?.some(e => e.label === extra.label);
    let nextExtras = [...(form.selectedExtras || [])];
    
    if (isSelected) {
      nextExtras = nextExtras.filter(e => e.label !== extra.label);
    } else {
      nextExtras.push({ label: extra.label, price: extra.price, type: extra.type, estimatedTime: extra.estimatedTime });
    }

    // Recalculate price and deadline
    const wt = workTypes.find(w => w.id === form.workTypeId);
    const sc = wt?.scales?.find(s => s.id === form.scaleTypeId);
    const basePrice = sc?.basePrice || 0;
    
    const newPrice = calculateTotalPrice(basePrice, nextExtras);
    
    // Recalculate deadline
    const getDays = (str?: string) => {
      if (!str) return 0;
      const match = str.match(/(\d+)/g);
      if (!match) return 0;
      return parseInt(match[match.length - 1]);
    };

    let totalDays = getDays(sc?.estimatedTime || '7');
    nextExtras.forEach(ex => {
      totalDays += getDays(ex.estimatedTime);
    });

    const newDeadline = format(addDays(new Date(form.commissionDate), totalDays), 'yyyy-MM-dd');
    
    setForm(f => ({ ...f, selectedExtras: nextExtras, price: newPrice, deadlineDate: newDeadline }));
  };

  useEffect(() => {
    if (card) {
      let cleanNotes = card.notes || '';
      let extras = card.selectedExtras || [];
      
      // If extras are encoded in notes (workaround)
      if (cleanNotes.includes('::EXTRAS::')) {
        const parts = cleanNotes.split('::EXTRAS::');
        cleanNotes = parts[0].trim();
        try {
          extras = JSON.parse(parts[1]);
        } catch (e) {}
      }

      setForm({
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
        commissionDate: card.commissionDate.split('T')[0],
        commissionTime: card.commissionTime || (card.commissionDate.includes('T') ? card.commissionDate.split('T')[1].slice(0, 5) : format(new Date(card.createdAt), 'HH:mm')),
        deadlineDate: card.deadlineDate,
        progress: card.progress,
        notes: cleanNotes,
        images: card.images,
        selectedExtras: extras,
      });
    }
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
        commission_date: `${form.commissionDate}T${form.commissionTime || '00:00'}:00Z`,
        deadline_date: form.deadlineDate,
        progress: form.progress,
        notes: form.notes + (form.selectedExtras?.length ? `\n\n::EXTRAS::${JSON.stringify(form.selectedExtras)}` : ''),
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

  const handleAddPlatform = async () => {
    const trimmed = newPlatform.trim();
    if (!trimmed) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('platforms')
          .insert({ name: trimmed, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        
        // Update store with the actual DB record
        useAppStore.setState((s) => ({
          platforms: [...s.platforms, { id: data.id, name: data.name }]
        }));
        // Select it
        set('platformId', data.id);
        toast('Platform saved to database', 'success');
      } else {
        // Fallback for local-only
        const id = 'p_' + Date.now();
        useAppStore.setState((s) => ({
          platforms: [...s.platforms, { id, name: trimmed }]
        }));
        set('platformId', id);
      }
      setNewPlatform('');
      setShowAddPlatform(false);
    } catch (err: any) {
      toast(`Error: ${err.message}`, 'error');
    }
  };

  const handleRenamePlatform = async () => {
    const trimmed = editingPlatformName.trim();
    if (!trimmed || !form.platformId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('platforms')
          .update({ name: trimmed })
          .eq('id', form.platformId);
        if (error) throw error;
        
        useAppStore.setState((s) => ({
          platforms: s.platforms.map(p => p.id === form.platformId ? { ...p, name: trimmed } : p)
        }));
        toast('Platform renamed', 'success');
      }
      setShowEditPlatform(false);
    } catch (err: any) {
      toast(`Error: ${err.message}`, 'error');
    }
  };

  const handleDeletePlatform = async () => {
    if (!form.platformId) return;
    if (!confirm('Are you sure you want to delete this platform?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('platforms')
          .delete()
          .eq('id', form.platformId);
        if (error) throw error;
        
        useAppStore.setState((s) => ({
          platforms: s.platforms.filter(p => p.id !== form.platformId)
        }));
        // Select the first available platform if current one is deleted
        const firstPlat = useAppStore.getState().platforms[0];
        set('platformId', firstPlat?.id || '');
        toast('Platform deleted', 'success');
      }
      setShowEditPlatform(false);
    } catch (err: any) {
      toast(`Error: ${err.message}`, 'error');
    }
  };

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
                <button className="btn-icon" onClick={() => { setShowAddPlatform(!showAddPlatform); setShowEditPlatform(false); }} title="Add platform"><Plus size={14} /></button>
                <button className="btn-icon" onClick={() => { 
                  const p = platforms.find(x => x.id === form.platformId);
                  if (p) {
                    setEditingPlatformName(p.name);
                    setShowEditPlatform(!showEditPlatform);
                    setShowAddPlatform(false);
                  }
                }} title="Edit platform"><Edit2 size={14} /></button>
              </div>
              {showAddPlatform && (
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                  <input className="input" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} placeholder="New platform name" onKeyDown={(e) => e.key === 'Enter' && handleAddPlatform()} />
                  <button className="btn btn-primary btn-sm" onClick={handleAddPlatform}>Add</button>
                </div>
              )}
              {showEditPlatform && (
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                  <input className="input" value={editingPlatformName} onChange={(e) => setEditingPlatformName(e.target.value)} placeholder="Edit platform name" onKeyDown={(e) => e.key === 'Enter' && handleRenamePlatform()} />
                  <button className="btn btn-primary btn-sm" onClick={handleRenamePlatform}>Save</button>
                  <button className="btn btn-danger btn-sm" style={{ padding: '0 0.5rem' }} onClick={handleDeletePlatform} title="Delete platform"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Work Type + Scale */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label">Work Type *</label>
              <select className="select" value={form.workTypeId} onChange={(e) => {
                set('workTypeId', e.target.value);
                autoFill(e.target.value, form.scaleTypeId);
              }}>
                {workTypes.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Scale <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(optional)</span></label>
              <select className="select" value={form.scaleTypeId || ''} onChange={(e) => {
                const val = e.target.value || undefined;
                set('scaleTypeId', val);
                autoFill(form.workTypeId, val);
              }}>
                <option value="">Select Scale...</option>
                {(workTypes.find(w => w.id === form.workTypeId)?.scales || []).map((s: ScaleType) => (
                  <option key={s.id} value={s.id}>{s.title} ({settings.currency}{s.basePrice})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Extra Options */}
          {(() => {
            const currentWT = workTypes.find(w => w.id === form.workTypeId);
            const currentScale = currentWT?.scales?.find(s => s.id === form.scaleTypeId);
            const extras = currentScale?.extraPricing || [];
            
            if (extras.length === 0) return null;

            return (
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                   <label className="label" style={{ margin: 0 }}>Extra Options / Modifiers</label>
                   <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{form.selectedExtras?.length || 0} SELECTED</span>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                  gap: '0.75rem',
                }}>
                  {extras.map((ex: PricingExtra) => {
                    const isActive = form.selectedExtras?.some(e => e.label === ex.label);
                    return (
                      <label key={ex.label} style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '0.4rem', 
                        cursor: 'pointer',
                        padding: '1rem',
                        borderRadius: '16px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: isActive ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05))' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: isActive ? '0 8px 24px rgba(168, 85, 247, 0.15)' : 'none',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {/* Hidden native checkbox */}
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleExtra(ex)}
                          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                        />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 800, 
                            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                            lineHeight: 1.2
                          }}>
                            {ex.label}
                          </div>
                          <div style={{
                             width: 20, height: 20, 
                             borderRadius: '6px', 
                             border: `2px solid ${isActive ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
                             background: isActive ? 'var(--accent)' : 'transparent',
                             display: 'flex', alignItems: 'center', justifyContent: 'center',
                             transition: 'all 0.2s'
                          }}>
                             {isActive && <Check size={12} color="white" strokeWidth={4} />}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                              <span style={{ opacity: 0.6 }}>{settings.currency}</span>
                              {ex.type === 'flat' ? ex.price.toLocaleString() : `+${ex.price}%`}
                           </div>
                           {ex.estimatedTime && (
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.8 }}>
                                <Clock size={12} />
                                <span>+{ex.estimatedTime}d</span>
                             </div>
                           )}
                        </div>

                        {/* Subtle background glow for active state */}
                        {isActive && (
                          <div style={{
                            position: 'absolute',
                            bottom: -20,
                            right: -20,
                            width: 60,
                            height: 60,
                            background: 'var(--accent)',
                            filter: 'blur(30px)',
                            opacity: 0.3,
                            zIndex: 0
                          }} />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
                    onChange={(val) => {
                      set('commissionDate', val);
                      autoFill(form.workTypeId, form.scaleTypeId, val);
                    }}
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
