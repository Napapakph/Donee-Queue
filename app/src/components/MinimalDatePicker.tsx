'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth } from 'date-fns';

interface Props {
  value: string; // yyyy-MM-dd
  onChange: (val: string) => void;
}

export function MinimalDatePicker({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : new Date();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isSelected = isSameDay(cloneDay, selectedDate);
        const isCurrentMonth = isSameMonth(cloneDay, monthStart);

        days.push(
          <div
            key={cloneDay.toString()}
            style={{
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'all 0.2s',
              backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
              color: isSelected ? '#fff' : isCurrentMonth ? 'var(--text-primary)' : 'rgba(255,255,255,0.15)',
              fontWeight: isSelected ? '700' : '500',
            }}
            onClick={() => {
              onChange(format(cloneDay, 'yyyy-MM-dd'));
              setIsOpen(false);
            }}
            onMouseOver={(e) => !isSelected && isCurrentMonth && (e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.15)')}
            onMouseOut={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {format(cloneDay, 'd')}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={containerRef}>
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '0.95rem',
          color: 'var(--text-primary)',
          transition: 'all 0.2s',
        }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
      >
        <CalendarIcon size={16} style={{ color: 'var(--accent)' }} />
        <span>{value ? format(new Date(value), 'dd MMMM yyyy') : 'Select date'}</span>
      </div>

      {isOpen && (
        <div className="glass" style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          left: 0,
          zIndex: 9999,
          width: '320px',
          padding: '1.25rem',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(20, 20, 25, 0.95)',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex' }}
            >
              <ChevronLeft size={20} />
            </button>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '0.5rem' }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>{d}</div>
            ))}
          </div>
          
          {renderDays()}
          
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' }}>
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => {
                const now = format(new Date(), 'yyyy-MM-dd');
                onChange(now);
                setIsOpen(false);
              }}
            >
              Go to Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
