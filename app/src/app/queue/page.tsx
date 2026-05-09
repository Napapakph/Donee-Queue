'use client';
import { useState, useRef } from 'react';
import {
  Plus, Trash2, Edit2, X, Upload, Eye, EyeOff, DollarSign,
  Calendar, Clock, ChevronDown, AlertTriangle, CheckCircle, Filter
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ToastProvider';
import type { QueueCard, ProgressStage, PaymentStatus } from '@/lib/types';
import { QueueCardModal } from '@/components/QueueCardModal';
import { CalendarView } from '@/components/CalendarView';
import { ImageLightbox } from '@/components/ImageLightbox';
import { createClient } from '@/lib/supabase/client';
import { uploadBase64Image } from '@/lib/upload';

type Category = 'all' | 'waiting' | 'working' | 'completed';
type ViewMode = 'cards' | 'calendar';

const STAGES: ProgressStage[] = ['Waiting', 'Sketching', 'Line Art', 'Base Coloring', 'Adding Details', 'Complete'];

function getDeadlineStatus(commissionDate: string, deadlineDate: string, threshold: number) {
  const now = Date.now();
  const start = new Date(commissionDate).getTime();
  const end = new Date(deadlineDate).getTime();
  if (now > end) return 'overdue';
  const ratio = (now - start) / (end - start);
  if (ratio >= threshold / 100) return 'warning';
  return 'safe';
}

function DeadlineStrip({ status, complete }: { status: string; complete: boolean }) {
  const cls = complete ? 'deadline-complete' : status === 'overdue' ? 'deadline-overdue' : status === 'warning' ? 'deadline-warning' : 'deadline-safe';
  return <div className={`deadline-strip ${cls}`} />;
}

export default function QueuePage() {
  const { role, queueCards, updateCard, removeCard, updateCardProgress, workTypes, scaleTypes, platforms, settings } = useAppStore();
  const { toast } = useToast();
  const isUser = role === 'user' || role === 'admin';
  const supabase = createClient();

  const [category, setCategory] = useState<Category>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [showModal, setShowModal] = useState(false);
  const [editCard, setEditCard] = useState<QueueCard | null>(null);
  const [showIncome, setShowIncome] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [lightboxData, setLightboxData] = useState<{ images: string[], index: number } | null>(null);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = queueCards
    .filter((c) => {
      if (category === 'waiting') return ['Waiting'].includes(c.progress);
      if (category === 'working') return ['Sketching', 'Line Art', 'Base Coloring', 'Adding Details'].includes(c.progress);
      if (category === 'completed') return c.progress === 'Complete';
      return true;
    })
    .filter((c) => {
      if (role === 'guest') return c.isPublic && !c.isNSFW;
      return true;
    })
    .filter((c) => !filterPlatform || c.platformId === filterPlatform)
    .filter((c) => !filterPayment || c.paymentStatus === filterPayment)
    .sort((a, b) => new Date(a.commissionDate).getTime() - new Date(b.commissionDate).getTime());

  // ── Income summary ─────────────────────────────────────────────────────────
  const totalIncome = queueCards
    .filter((c) => c.paymentStatus === 'paid')
    .reduce((sum, c) => sum + c.price * c.quantity, 0);
  const incomeVisible = isUser ? showIncome : settings.showIncomeSummaryToGuests && showIncome;

  const countFor = (cat: Category) => {
    if (cat === 'all') return queueCards.length;
    if (cat === 'waiting') return queueCards.filter((c) => c.progress === 'Waiting').length;
    if (cat === 'working') return queueCards.filter((c) => ['Sketching', 'Line Art', 'Base Coloring', 'Adding Details'].includes(c.progress)).length;
    if (cat === 'completed') return queueCards.filter((c) => c.progress === 'Complete').length;
    return 0;
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="section-title"><span className="gradient-text">Commission Queue</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {queueCards.length} total commissions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Income toggle */}
          {(isUser || settings.showIncomeSummaryToGuests) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {incomeVisible && (
                <div className="glass" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DollarSign size={14} style={{ color: 'var(--success)' }} />
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                    {settings.currency}{totalIncome.toLocaleString()}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>received</span>
                </div>
              )}
              {isUser && (
                <button className="btn-icon" onClick={() => setShowIncome(!showIncome)} title="Toggle income visibility">
                  {showIncome ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              )}
            </div>
          )}
          {/* View toggle */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '0.25rem', border: '1px solid var(--border)' }}>
            <button className={`tab ${viewMode === 'cards' ? 'active' : ''}`} style={{ flex: 'none', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setViewMode('cards')}>Cards</button>
            <button className={`tab ${viewMode === 'calendar' ? 'active' : ''}`} style={{ flex: 'none', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setViewMode('calendar')}>Calendar</button>
          </div>
          {isUser && (
            <button className="btn btn-primary btn-sm" onClick={() => { setEditCard(null); setShowModal(true); }}>
              <Plus size={14} /> Add Commission
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="tab-bar" style={{ marginBottom: '1.25rem' }}>
        {(['all', 'waiting', 'working', 'completed'] as Category[]).map((c) => (
          <button key={c} className={`tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
            <span style={{
              marginLeft: '0.4rem', fontSize: '0.7rem',
              background: category === c ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              borderRadius: 99, padding: '0 0.4rem',
            }}>{countFor(c)}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      {isUser && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <select className="select" style={{ width: 'auto', fontSize: '0.8rem', minWidth: 140 }}
            value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
            <option value="">All Platforms</option>
            {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="select" style={{ width: 'auto', fontSize: '0.8rem', minWidth: 140 }}
            value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
            <option value="">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="deposit">50% Deposit</option>
            <option value="paid">Fully Paid</option>
          </select>
        </div>
      )}

      {/* Content */}
      {viewMode === 'calendar' ? (
        <CalendarView cards={filtered} />
      ) : (
        <>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
              <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <h3 style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No commissions here</h3>
              <p style={{ fontSize: '0.875rem' }}>
                {isUser ? 'Click "Add Commission" to get started.' : 'Nothing to display right now.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
              {filtered.map((card) => (
                <CardItem key={card.id} card={card}
                  onEdit={() => { setEditCard(card); setShowModal(true); }}
                  onDelete={async () => {
                    const { error } = await supabase.from('queue_cards').delete().eq('id', card.id);
                    if (error) return toast(`DB Error: ${error.message}`, 'error');
                    removeCard(card.id); 
                    toast('Commission removed', 'info'); 
                  }}
                  onStageChange={async (s) => {
                    const { error } = await supabase.from('queue_cards').update({ progress: s }).eq('id', card.id);
                    if (error) return toast(`DB Error: ${error.message}`, 'error');
                    updateCardProgress(card.id, s);
                  }}
                  onImageClick={(images, index) => setLightboxData({ images, index })}
                  isUser={isUser}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <QueueCardModal
          card={editCard}
          onClose={() => { setShowModal(false); setEditCard(null); }}
        />
      )}

      {lightboxData && (
        <ImageLightbox 
          images={lightboxData.images} 
          initialIndex={lightboxData.index} 
          onClose={() => setLightboxData(null)} 
        />
      )}
    </div>
  );
}

// ── Individual Queue Card ─────────────────────────────────────────────────────
function CardItem({
  card, onEdit, onDelete, onStageChange, onImageClick, isUser,
}: {
  card: QueueCard;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
  onStageChange: (s: ProgressStage) => void | Promise<void>;
  onImageClick: (images: string[], index: number) => void;
  isUser: boolean;
}) {
  const { workTypes, scaleTypes, platforms, settings } = useAppStore();
  const { toast } = useToast();
  const wt = workTypes.find((w) => w.id === card.workTypeId);
  const sc = scaleTypes.find((s) => s.id === card.scaleTypeId);
  const plat = platforms.find((p) => p.id === card.platformId);
  const deadlineStatus = getDeadlineStatus(card.commissionDate, card.deadlineDate, settings.warningThresholdPercent);
  const complete = card.progress === 'Complete';

  const paymentColors: Record<PaymentStatus, string> = {
    unpaid: 'badge-red', deposit: 'badge-orange', paid: 'badge-green',
  };
  const paymentLabels: Record<PaymentStatus, string> = {
    unpaid: 'Unpaid', deposit: '50% Paid', paid: 'Fully Paid',
  };

  const fileRef = useRef<HTMLInputElement>(null);
  const { updateCard, isPro } = useAppStore();
  const maxImages = isPro ? 3 : 1;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (card.images.length >= maxImages) return;
    
    const supabase = createClient();
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      toast('Uploading image...', 'info');
      try {
        const url = await uploadBase64Image(base64, 'images', `queue/${card.id}_${Date.now()}.jpg`);
        const newImages = [...card.images, url];
        const { error } = await supabase.from('queue_cards').update({ images: newImages }).eq('id', card.id);
        if (error) throw error;
        updateCard(card.id, { images: newImages });
        toast('Image uploaded', 'success');
      } catch (err: any) {
        toast(`Upload failed: ${err.message}`, 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="queue-card" style={{ padding: '0 0 0 4px' }}>
      <DeadlineStrip status={deadlineStatus} complete={complete} />
      <div style={{ padding: '1rem 1rem 1rem 0.75rem' }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{card.customerName}</div>
            {plat && <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>via {plat.name}</div>}
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span className={`badge ${paymentColors[card.paymentStatus]}`}>{paymentLabels[card.paymentStatus]}</span>
            {card.isNSFW && <span className="badge badge-red">NSFW</span>}
            {!card.isPublic && <span className="badge badge-gray"><EyeOff size={8} /> Private</span>}
          </div>
        </div>

        {/* Type + price */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
          {wt && <span className="badge badge-purple">{wt.name}</span>}
          {sc && <span className="badge badge-blue">{sc.name}</span>}
          <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--accent)' }}>
            {settings.currency}{(card.price * card.quantity).toLocaleString()}
            {card.quantity > 1 && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 400 }}> ×{card.quantity}</span>}
          </span>
        </div>

        {/* Description */}
        {card.description && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {card.description}
          </p>
        )}

        {/* Dates */}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={11} /> {new Date(card.commissionDate).toLocaleDateString()}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: deadlineStatus === 'overdue' ? 'var(--danger)' : deadlineStatus === 'warning' ? 'var(--warning)' : 'var(--text-muted)' }}>
            <Clock size={11} /> Due {new Date(card.deadlineDate).toLocaleDateString()}
            {deadlineStatus === 'warning' && <AlertTriangle size={10} />}
            {deadlineStatus === 'overdue' && <AlertTriangle size={10} />}
          </span>
        </div>

        {/* Progress dropdown */}
        {isUser && (
          <select className="select" value={card.progress}
            onChange={(e) => onStageChange(e.target.value as ProgressStage)}
            style={{ fontSize: '0.8rem', marginBottom: '0.6rem' }}
          >
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {!isUser && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
            Stage: <strong>{card.progress}</strong>
          </div>
        )}

        {/* Images */}
        {card.images.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
            {card.images.map((img, i) => (
              <div key={i} onClick={() => onImageClick(card.images, i)} style={{ cursor: 'pointer', display: 'block', width: 52, height: 52, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {card.notes && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '0.4rem 0.6rem', marginBottom: '0.6rem', borderLeft: '2px solid var(--accent)' }}>
            {card.notes}
          </p>
        )}

        {/* Actions */}
        {isUser && (
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
            <button className="btn-icon" onClick={onEdit}><Edit2 size={13} /></button>
            <button className="btn-icon" onClick={() => fileRef.current?.click()}
              title={card.images.length >= maxImages ? `Max ${maxImages} images (upgrade to Pro)` : 'Upload image'}>
              <Upload size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            <button className="btn-icon" style={{ marginLeft: 'auto', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }} onClick={onDelete}>
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
