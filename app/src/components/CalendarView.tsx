'use client';
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { QueueCard } from '@/lib/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDeadlineClass(commissionDate: string, deadlineDate: string, threshold: number) {
  const now = Date.now();
  const end = new Date(deadlineDate).getTime();
  const start = new Date(commissionDate).getTime();
  if (now > end) return 'overdue';
  const r = (now - start) / (end - start);
  return r >= threshold / 100 ? 'warning' : 'safe';
}

export function CalendarView({ cards }: { cards: QueueCard[] }) {
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const cardsForDay = (d: Date) =>
    cards.filter((c) => isSameDay(new Date(c.commissionDate), d) || isSameDay(new Date(c.deadlineDate), d));

  const selectedCards = selected ? cardsForDay(selected) : [];

  return (
    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div className="glass" style={{ padding: '1.25rem', flex: '1 1 360px', minWidth: 320 }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <button className="btn-icon" onClick={() => setCurrent(subMonths(current, 1))}><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{format(current, 'MMMM yyyy')}</span>
          <button className="btn-icon" onClick={() => setCurrent(addMonths(current, 1))}><ChevronRight size={16} /></button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0.25rem 0' }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {days.map((day) => {
            const dc = cardsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = day.getMonth() === current.getMonth();
            const isSel = selected && isSameDay(day, selected);

            const hasCommission = dc.some((c) => isSameDay(new Date(c.commissionDate), day));
            const hasDeadline = dc.some((c) => isSameDay(new Date(c.deadlineDate), day));

            return (
              <button key={day.toISOString()} onClick={() => setSelected(isSel ? null : day)}
                style={{
                  aspectRatio: '1', borderRadius: 6, border: isToday ? '1.5px solid var(--accent)' : '1px solid transparent',
                  background: isSel ? 'rgba(168,85,247,0.2)' : isToday ? 'rgba(168,85,247,0.08)' : 'transparent',
                  color: isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer',
                  position: 'relative', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 2, padding: '0.25rem',
                  transition: 'all 0.15s',
                }}
              >
                <span>{format(day, 'd')}</span>
                {(hasCommission || hasDeadline) && (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {hasCommission && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--info)' }} />}
                    {hasDeadline && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--danger)' }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--info)', display: 'inline-block' }} /> Commission date</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} /> Deadline</span>
        </div>
      </div>

      {/* Side panel */}
      {selected && (
        <div className="glass" style={{ padding: '1.25rem', flex: '0 0 280px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            {format(selected, 'EEE, d MMM yyyy')}
          </h3>
          {selectedCards.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No commissions on this day.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedCards.map((c) => (
                <div key={c.id} style={{
                  padding: '0.6rem 0.8rem', borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  fontSize: '0.82rem',
                }}>
                  <div style={{ fontWeight: 700 }}>{c.customerName}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{c.progress}</div>
                  {isSameDay(new Date(c.deadlineDate), selected) && (
                    <span className="badge badge-red" style={{ marginTop: '0.25rem' }}>Deadline</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
