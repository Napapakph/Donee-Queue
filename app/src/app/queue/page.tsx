'use client';
import React, { useState, useRef } from 'react';
import {
  LayoutDashboard, Calendar, Plus, Eye, EyeOff, Edit2, Trash2,
  Upload, Clock, AlertTriangle, X, ArrowLeft, ArrowRight
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ProgressStage, QueueCard } from '@/lib/types';
import { QueueCardModal } from '../../components/QueueCardModal';
import { ImageLightbox } from '../../components/ImageLightbox';
import { useToast } from '@/components/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import { uploadBase64Image } from '@/lib/upload';

type ViewMode = 'cards' | 'calendar';
type Category = 'all' | 'waiting' | 'working' | 'completed';

export default function QueuePage({ externalData }: { externalData?: any }) {
  const storeData = useAppStore();
  const data = externalData || storeData;
  const { role, queueCards, updateCard, removeCard, updateCardProgress, workTypes, scaleTypes, platforms, settings, profile, toggleBusyDay } = data;
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
  const [search, setSearch] = useState('');
  const [lightboxData, setLightboxData] = useState<{ images: string[], index: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Sync busy days to Supabase
  const handleToggleBusy = async (dateStr: string) => {
    if (!isUser) return;
    toggleBusyDay(dateStr);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const currentBusy = profile.busyDays || [];
      const nextBusy = currentBusy.includes(dateStr)
        ? currentBusy.filter((d: string) => d !== dateStr)
        : [...currentBusy, dateStr];
      await supabase.from('profiles').update({ busy_days: nextBusy }).eq('id', user.id);
      toast(nextBusy.includes(dateStr) ? 'Marked as Busy' : 'Marked as Available', 'info');
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredCards = (queueCards || []).filter((c: any) => {
    const sMatch = category === 'all' || (category === 'waiting' && c.progress === 'Waiting') || (category === 'working' && ['Sketching', 'Adding Details'].includes(c.progress)) || (category === 'completed' && c.progress === 'Complete');
    const pMatch = !filterPlatform || c.platformId === filterPlatform;
    const payMatch = !filterPayment || c.paymentStatus === filterPayment;
    const qMatch = !search || (c.customerName || '').toLowerCase().includes(search.toLowerCase());
    return sMatch && pMatch && payMatch && qMatch;
  });

  const sortedCards = [...filteredCards].sort((a: any, b: any) =>
    new Date(a.commissionDate).getTime() - new Date(b.commissionDate).getTime()
  );

  // ── Income summary ─────────────────────────────────────────────────────────
  const totalIncome = filteredCards
    .filter((c: any) => c.paymentStatus === 'paid')
    .reduce((sum: number, c: any) => sum + (c.price * c.quantity), 0);
  const incomeVisible = isUser ? showIncome : (settings.showIncomeSummaryToGuests && showIncome);

  const countFor = (cat: Category) => {
    if (cat === 'all') return (queueCards || []).length;
    if (cat === 'waiting') return (queueCards || []).filter((c: any) => c.progress === 'Waiting').length;
    if (cat === 'working') return (queueCards || []).filter((c: any) => ['Sketching', 'Adding Details'].includes(c.progress)).length;
    if (cat === 'completed') return (queueCards || []).filter((c: any) => c.progress === 'Complete').length;
    return 0;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: '0.25rem' }}>
            <span className="gradient-text">Queue Board</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Track and manage commission progress</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setViewMode('cards')}>
            <LayoutDashboard size={14} /> Cards
          </button>
          <button className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setViewMode('calendar')}>
            <Calendar size={14} /> Calendar
          </button>
          {isUser && (
            <button className="btn btn-primary btn-sm" onClick={() => { setEditCard(null); setShowModal(true); }}>
              <Plus size={14} /> Add Commission
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      {incomeVisible && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div className="glass" style={{ padding: '1rem', flex: 1, minWidth: 160, textAlign: 'center', borderBottom: '3px solid var(--accent)' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{settings.currency}{totalIncome.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confirmed Income</div>
          </div>
          <div className="glass" style={{ padding: '1rem', flex: 1, minWidth: 160, textAlign: 'center', borderBottom: '3px solid var(--warning)' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning)' }}>{filteredCards.filter((c: any) => c.paymentStatus === 'deposit').length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deposits Paid</div>
          </div>
          <div className="glass" style={{ padding: '1rem', flex: 1, minWidth: 160, textAlign: 'center', borderBottom: '3px solid var(--danger)' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger)' }}>{filteredCards.filter((c: any) => c.paymentStatus === 'unpaid').length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting Payment</div>
          </div>
        </div>
      )}

      {/* Tabs / Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="tab-bar" style={{ maxWidth: 500 }}>
          {([['all', 'All'], ['waiting', 'Waiting'], ['working', 'Working'], ['completed', 'Completed']] as [Category, string][]).map(([cat, label]) => (
            <button key={cat} className={`tab ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
              {label} <span style={{ opacity: 0.5, fontSize: '0.7rem', marginLeft: '0.2rem' }}>({countFor(cat)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {isUser && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
          <input
            className="input"
            placeholder="Search customer..."
            style={{ width: 'auto', fontSize: '0.8rem', minWidth: 200 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select" style={{ width: 'auto', fontSize: '0.8rem', minWidth: 140 }}
            value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
            <option value="">All Platforms</option>
            {platforms.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="select" style={{ width: 'auto', fontSize: '0.8rem', minWidth: 140 }}
            value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
            <option value="">All Payment</option>
            <option value="unpaid">Unpaid</option>
            <option value="deposit">Deposit</option>
            <option value="paid">Paid</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowIncome(!showIncome)}>
            {showIncome ? <EyeOff size={14} /> : <Eye size={14} />} {showIncome ? 'Hide' : 'Show'} Income
          </button>
        </div>
      )}

      {/* Content */}
      {viewMode === 'calendar' ? (
        <CalendarView
          cards={sortedCards}
          busyDays={profile.busyDays || []}
          onDayClick={(day) => setSelectedDay(day)}
        />
      ) : (
        <>
          {sortedCards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
              <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <h3 style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No commissions here</h3>
              <p style={{ fontSize: '0.875rem' }}>Try changing the filters or add a new commission.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
              {sortedCards.map((card: any) => (
                <CardItem key={card.id} card={card}
                  onEdit={() => { setEditCard(card); setShowModal(true); }}
                  onDelete={async () => {
                    if (confirm('Delete this card?')) {
                      await supabase.from('queue_cards').delete().eq('id', card.id);
                      removeCard(card.id);
                      toast('Deleted successfully', 'success');
                    }
                  }}
                  onStageChange={async (stage) => {
                    await supabase.from('queue_cards').update({ progress: stage }).eq('id', card.id);
                    updateCardProgress(card.id, stage);
                  }}
                  onImageClick={(imgs, idx) => setLightboxData({ images: imgs, index: idx })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showModal && (
        <QueueCardModal
          card={editCard}
          onClose={() => setShowModal(false)}
        />
      )}

      {lightboxData && (
        <ImageLightbox
          images={lightboxData.images}
          initialIndex={lightboxData.index}
          onClose={() => setLightboxData(null)}
        />
      )}

      {selectedDay && (
        <DayDetailsPopup
          date={selectedDay}
          cards={sortedCards}
          isBusy={(profile.busyDays || []).includes(selectedDay.toISOString().split('T')[0])}
          isUser={isUser}
          onToggleBusy={() => handleToggleBusy(selectedDay.toISOString().split('T')[0])}
          onEditCard={(card) => { setEditCard(card); setShowModal(true); setSelectedDay(null); }}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

// ── Components ──────────────────────────────────────────────────────────────

function CalendarView({ cards, busyDays, onDayClick }: { cards: any[], busyDays: string[], onDayClick: (d: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const days = [];
  const startDay = start.getDay();
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= end.getDate(); i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  return (
    <div className="glass" style={{ padding: '1.5rem', borderRadius: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }}>
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-icon" onClick={() => changeMonth(-1)}><ArrowLeft size={16} /></button>
          <button className="btn-icon" onClick={() => changeMonth(1)}><ArrowRight size={16} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.5rem 0' }}>{d}</div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const dateStr = day.toISOString().split('T')[0];
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          const isBusy = busyDays.includes(dateStr);

          // Orders placed on this day
          const dayOrders = cards.filter(c => {
            return new Date(c.commissionDate).toISOString().split('T')[0] === dateStr;
          });

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(day)}
              className="glass"
              style={{
                aspectRatio: '1.4 / 1',
                padding: '0.5rem',
                position: 'relative',
                cursor: 'pointer',
                borderRadius: 12,
                border: isToday ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.05)',
                background: isBusy ? 'rgba(239,68,68,0.1)' : isToday ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {day.getDate()}
                </div>
                {dayOrders.length > 0 && (
                   <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)' }}>{dayOrders.length} orders</div>
                )}
              </div>

              <div style={{ marginTop: '8px', display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                {dayOrders.map((c, idx) => (
                  <div key={c.id} style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    boxShadow: '0 0 8px var(--accent)',
                    opacity: 0.8
                  }} title={c.customerName} />
                ))}
                {isBusy && <div style={{ fontSize: '0.6rem', color: 'var(--danger)', fontWeight: 700 }}>BUSY</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayDetailsPopup({ date, cards, isBusy, isUser, onToggleBusy, onEditCard, onClose }: {
  date: Date, cards: any[], isBusy: boolean, isUser: boolean, onToggleBusy: () => void, onEditCard: (card: any) => void, onClose: () => void
}) {
  const dateStr = date.toISOString().split('T')[0];
  const dayCards = cards.filter(c => {
    const cDate = new Date(c.commissionDate).toISOString().split('T')[0];
    const dDate = new Date(c.deadlineDate).toISOString().split('T')[0];
    return dateStr >= cDate && dateStr <= dDate && c.progress !== 'Complete';
  });

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{date.toLocaleDateString(undefined, { dateStyle: 'full' })}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {isUser && (
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              className={`btn ${isBusy ? 'btn-ghost' : 'btn-primary'}`}
              style={{ width: '100%', borderColor: isBusy ? 'var(--danger)' : '' }}
              onClick={() => { onToggleBusy(); onClose(); }}
            >
              {isBusy ? 'Mark as Available' : 'Mark as Busy (No Work)'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Tasks</h3>
          {dayCards.length === 0 && !isBusy && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active commissions for this day.</p>
          )}
          {isBusy && (
            <div className="glass" style={{ padding: '1rem', borderLeft: '4px solid var(--danger)', background: 'rgba(239,68,68,0.1)' }}>
              <p style={{ fontWeight: 700, color: 'var(--danger)' }}>Artist is Busy</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Not accepting or working on commissions today.</p>
            </div>
          )}
          {dayCards.map(c => (
            <div key={c.id} className="glass" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: ['Waiting'].includes(c.progress) ? 'var(--warning)' : 'var(--accent)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.customerName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.progress}</div>
                </div>
              </div>
              {isUser && (
                <button className="btn-icon" onClick={() => onEditCard(c)}>
                  <Edit2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardItem({ card, onEdit, onDelete, onStageChange, onImageClick }: {
  card: any; onEdit: () => void; onDelete: () => void; onStageChange: (stage: ProgressStage) => void; onImageClick: (imgs: string[], idx: number) => void;
}) {
  const { workTypes, scaleTypes, platforms, settings, role } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const updateCard = useAppStore(s => s.updateCard);
  const toast = useToast().toast;

  const isUser = role === 'user' || role === 'admin';
  const wt = workTypes.find((w: any) => w.id === card.workTypeId);
  const sc = scaleTypes.find((s: any) => s.id === card.scaleTypeId);
  const plat = platforms.find((p: any) => p.id === card.platformId);
  const deadlineStatus = getDeadlineStatus(card.commissionDate, card.deadlineDate, settings.warningThresholdPercent);
  const complete = card.progress === 'Complete';

  const STAGES: ProgressStage[] = ['Waiting', 'Sketching', 'Adding Details', 'Complete'];
  const maxImages = 8;

  const paymentColors: Record<string, string> = { unpaid: 'badge-red', deposit: 'badge-yellow', paid: 'badge-green' };
  const paymentLabels: Record<string, string> = { unpaid: 'Unpaid', deposit: 'Deposit', paid: 'Paid' };

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
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {card.images.map((img: string, i: number) => (
              <div key={i} style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)' }}
                onClick={() => onImageClick(card.images, i)}>
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

function getDeadlineStatus(start: string, end: string, warningThreshold: number) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now > e) return 'overdue';
  const total = e - s;
  const elapsed = now - s;
  if (elapsed / total * 100 > warningThreshold) return 'warning';
  return 'safe';
}

function DeadlineStrip({ status, complete }: { status: string; complete: boolean }) {
  const cls = complete ? 'deadline-complete' : status === 'overdue' ? 'deadline-overdue' : status === 'warning' ? 'deadline-warning' : 'deadline-safe';
  return <div className={`deadline-strip ${cls}`} />;
}
