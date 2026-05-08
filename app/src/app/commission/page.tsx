'use client';
import { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, X, Upload, Eye, EyeOff, Image, BookOpen } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ToastProvider';
import type { WorkType, ScaleType, CommissionStatus } from '@/lib/types';

type Tab = 'gallery' | 'pricing' | 'tos';

export default function CommissionPage() {
  const {
    role, workTypes, addWorkType, updateWorkType, removeWorkType,
    scaleTypes, addScaleType, updateScaleType, removeScaleType,
    commissionStatus, setCommissionStatus, tos, setTos,
    showcaseImages, addShowcaseImage, removeShowcaseImage, settings,
  } = useAppStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('gallery');
  const isUser = role === 'user' || role === 'admin';

  // ── Work Type form ─────────────────────────────────────────────────────────
  const [editWt, setEditWt] = useState<Partial<WorkType> | null>(null);
  const [showWtForm, setShowWtForm] = useState(false);
  const emptyWt = (): Partial<WorkType> => ({ name: '', description: '', basePrice: 0, estimatedDurationDays: 1, visible: true });

  const saveWt = () => {
    if (!editWt?.name) return toast('Name required', 'error');
    if (editWt.id) {
      updateWorkType(editWt.id, editWt);
      toast('Work type updated', 'success');
    } else {
      addWorkType(editWt as Omit<WorkType, 'id'>);
      toast('Work type added', 'success');
    }
    setEditWt(null); setShowWtForm(false);
  };

  // ── Scale Type form ────────────────────────────────────────────────────────
  const [editSc, setEditSc] = useState<Partial<ScaleType> | null>(null);
  const [showScForm, setShowScForm] = useState(false);
  const emptySc = (): Partial<ScaleType> => ({ name: '', priceModifier: 0, priceModifierType: 'percentage', durationModifierDays: 0 });

  const saveSc = () => {
    if (!editSc?.name) return toast('Name required', 'error');
    if (editSc.id) {
      updateScaleType(editSc.id, editSc);
      toast('Scale type updated', 'success');
    } else {
      addScaleType(editSc as Omit<ScaleType, 'id'>);
      toast('Scale type added', 'success');
    }
    setEditSc(null); setShowScForm(false);
  };

  // ── Image upload ───────────────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);
  const handleImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      addShowcaseImage({ url: ev.target?.result as string, caption: file.name, isNSFW: false });
      toast('Image added to gallery', 'success');
    };
    reader.readAsDataURL(file);
  };

  const statusColors: Record<CommissionStatus, string> = {
    open: 'var(--success)', closed: 'var(--danger)', waitlist: 'var(--warning)',
  };
  const statusLabels: Record<CommissionStatus, string> = {
    open: '✦ Commissions Open', closed: '✦ Commissions Closed', waitlist: '✦ Waitlist Only',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: '0.25rem' }}>
            <span className="gradient-text">Commission Art</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Showcase, pricing & commission info</p>
        </div>

        {/* Status Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            padding: '0.5rem 1.2rem', borderRadius: 999,
            background: `${statusColors[commissionStatus]}22`,
            border: `1px solid ${statusColors[commissionStatus]}55`,
            color: statusColors[commissionStatus],
            fontWeight: 700, fontSize: '0.875rem',
          }}>
            {statusLabels[commissionStatus]}
          </div>
          {isUser && (
            <select className="select" style={{ width: 'auto', fontSize: '0.8rem' }}
              value={commissionStatus}
              onChange={(e) => setCommissionStatus(e.target.value as CommissionStatus)}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="waitlist">Waitlist</option>
            </select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: '2rem', maxWidth: 400 }}>
        {([['gallery', 'Gallery'], ['pricing', 'Pricing'], ['tos', 'TOS']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {/* ── Gallery Tab ─────────────────────────────────────────────── */}
      {tab === 'gallery' && (
        <div>
          {isUser && (
            <div style={{ marginBottom: '1.5rem' }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImgUpload} />
              <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> Upload Image
              </button>
            </div>
          )}

          {showcaseImages.length === 0 ? (
            <EmptyState icon={<Image size={48} />} title="No Artwork Yet" desc="Upload some examples to showcase your style." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
              {showcaseImages.map((img) => (
                <div key={img.id} className="glass" style={{ overflow: 'hidden', position: 'relative' }}>
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={img.url} alt={img.caption}
                      className={img.isNSFW && role === 'guest' ? 'nsfw-blur' : ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {img.isNSFW && <span className="badge badge-red" style={{ position: 'absolute', top: 8, right: 8 }}>NSFW</span>}
                  </div>
                  <div style={{ padding: '0.75rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {img.caption}
                    </p>
                  </div>
                  {isUser && (
                    <button onClick={() => removeShowcaseImage(img.id)} className="btn-icon"
                      style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', border: 'none' }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Pricing Tab ─────────────────────────────────────────────── */}
      {tab === 'pricing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Work Types */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Work Types</h2>
              {isUser && (
                <button className="btn btn-primary btn-sm" onClick={() => { setEditWt(emptyWt()); setShowWtForm(true); }}>
                  <Plus size={14} /> Add Type
                </button>
              )}
            </div>

            {showWtForm && editWt && (
              <div className="glass" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="label">Name *</label>
                    <input className="input" value={editWt.name || ''} onChange={(e) => setEditWt({ ...editWt, name: e.target.value })} placeholder="e.g. Full Color" />
                  </div>
                  <div className="form-group">
                    <label className="label">Base Price ({settings.currency})</label>
                    <input className="input" type="number" min="0" value={editWt.basePrice || 0}
                      onChange={(e) => setEditWt({ ...editWt, basePrice: +e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="label">Estimated Days</label>
                    <input className="input" type="number" min="1" value={editWt.estimatedDurationDays || 1}
                      onChange={(e) => setEditWt({ ...editWt, estimatedDurationDays: +e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="label">Description</label>
                    <input className="input" value={editWt.description || ''} onChange={(e) => setEditWt({ ...editWt, description: e.target.value })} placeholder="Short description..." />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={saveWt}><Check size={14} /> Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setShowWtForm(false); setEditWt(null); }}><X size={14} /> Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '0.75rem' }}>
              {workTypes.filter((w) => w.visible || isUser).map((wt) => (
                <div key={wt.id} className="glass" style={{ padding: '1.25rem', position: 'relative' }}>
                  {!wt.visible && <span className="badge badge-gray" style={{ position: 'absolute', top: 10, right: 10 }}><EyeOff size={10} /> Hidden</span>}
                  <div className="gradient-text" style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }}>{wt.name}</div>
                  {wt.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{wt.description}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1.2rem' }}>{settings.currency}{wt.basePrice.toLocaleString()}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>~{wt.estimatedDurationDays} day{wt.estimatedDurationDays > 1 ? 's' : ''}</span>
                  </div>
                  {isUser && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button className="btn-icon" onClick={() => { setEditWt({ ...wt }); setShowWtForm(true); }}><Edit2 size={12} /></button>
                      <button className="btn-icon" onClick={() => updateWorkType(wt.id, { visible: !wt.visible })}>{wt.visible ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                      <button className="btn-icon btn-danger" onClick={() => { removeWorkType(wt.id); toast('Deleted', 'info'); }}><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Scale Types */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Scale Types <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 400 }}>(optional modifiers)</span></h2>
              {isUser && (
                <button className="btn btn-primary btn-sm" onClick={() => { setEditSc(emptySc()); setShowScForm(true); }}>
                  <Plus size={14} /> Add Scale
                </button>
              )}
            </div>

            {showScForm && editSc && (
              <div className="glass" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="label">Name *</label>
                    <input className="input" value={editSc.name || ''} onChange={(e) => setEditSc({ ...editSc, name: e.target.value })} placeholder="e.g. Full Body" />
                  </div>
                  <div className="form-group">
                    <label className="label">Price Modifier</label>
                    <input className="input" type="number" value={editSc.priceModifier || 0} onChange={(e) => setEditSc({ ...editSc, priceModifier: +e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="label">Modifier Type</label>
                    <select className="select" value={editSc.priceModifierType || 'percentage'} onChange={(e) => setEditSc({ ...editSc, priceModifierType: e.target.value as 'flat' | 'percentage' })}>
                      <option value="percentage">% Add-on</option>
                      <option value="flat">Flat Amount</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">+Days</label>
                    <input className="input" type="number" value={editSc.durationModifierDays || 0} onChange={(e) => setEditSc({ ...editSc, durationModifierDays: +e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={saveSc}><Check size={14} /> Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setShowScForm(false); setEditSc(null); }}><X size={14} /> Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0.75rem' }}>
              {scaleTypes.map((sc) => (
                <div key={sc.id} className="glass" style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{sc.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {sc.priceModifier >= 0 ? '+' : ''}{sc.priceModifier}{sc.priceModifierType === 'percentage' ? '%' : settings.currency}
                    {sc.durationModifierDays !== 0 && ` · ${sc.durationModifierDays > 0 ? '+' : ''}${sc.durationModifierDays} day${Math.abs(sc.durationModifierDays) > 1 ? 's' : ''}`}
                  </div>
                  {isUser && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                      <button className="btn-icon" onClick={() => { setEditSc({ ...sc }); setShowScForm(true); }}><Edit2 size={12} /></button>
                      <button className="btn-icon btn-danger" onClick={() => removeScaleType(sc.id)}><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── TOS Tab ──────────────────────────────────────────────────── */}
      {tab === 'tos' && (
        <div className="glass" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} /> Terms of Service
            </h2>
          </div>
          {isUser ? (
            <textarea className="textarea" value={tos} onChange={(e) => setTos(e.target.value)}
              style={{ minHeight: 320, fontFamily: 'inherit', fontSize: '0.9rem' }} />
          ) : (
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
              {tos}
            </div>
          )}
          {isUser && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}
              onClick={() => toast('TOS saved', 'success')}>
              <Check size={14} /> Saved Automatically
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
      <div style={{ marginBottom: '1rem', opacity: 0.4 }}>{icon}</div>
      <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem' }}>{desc}</p>
    </div>
  );
}
