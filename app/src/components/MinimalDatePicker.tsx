'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth } from 'date-fns';

interface Props {
  value: string; // yyyy-MM-dd
  onChange: (val: string) => void;
  label?: string;
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
            className={`picker-day ${isSelected ? 'selected' : ''} ${!isCurrentMonth ? 'disabled' : ''}`}
            onClick={() => {
              onChange(format(cloneDay, 'yyyy-MM-dd'));
              setIsOpen(false);
            }}
          >
            {format(cloneDay, 'd')}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="picker-week" key={day.toString()}>{days}</div>);
      days = [];
    }
    return <div className="picker-body">{rows}</div>;
  };

  return (
    <div className="picker-container" ref={containerRef}>
      <div className="picker-input" onClick={() => setIsOpen(!isOpen)}>
        <CalendarIcon size={14} className="picker-icon" />
        <span>{value ? format(new Date(value), 'dd/MM/yyyy') : 'Select date'}</span>
      </div>

      {isOpen && (
        <div className="picker-dropdown glass">
          <div className="picker-header">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="picker-nav">
              <ChevronLeft size={16} />
            </button>
            <div className="picker-month-year">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="picker-nav">
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="picker-weekdays">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="picker-weekday">{d}</div>
            ))}
          </div>
          
          {renderDays()}
        </div>
      )}

      <style jsx>{`
        .picker-container { position: relative; width: 100%; }
        .picker-input {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          color: var(--text-primary);
          transition: all 0.2s;
        }
        .picker-input:hover { border-color: var(--accent); background: rgba(255, 255, 255, 0.05); }
        .picker-icon { color: var(--text-muted); }
        
        .picker-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          z-index: 100;
          width: 280px;
          padding: 1rem;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        
        .picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          marginBottom: 1rem;
        }
        .picker-month-year { font-weight: 700; font-size: 0.9rem; }
        .picker-nav {
          background: none; border: none; color: var(--text-secondary);
          cursor: pointer; padding: 4px; border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
        }
        .picker-nav:hover { background: rgba(255,255,255,0.1); color: #fff; }
        
        .picker-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 0.5rem;
        }
        .picker-weekday {
          text-align: center; font-size: 0.7rem; font-weight: 800;
          color: var(--text-muted); opacity: 0.6;
        }
        
        .picker-week { display: grid; grid-template-columns: repeat(7, 1fr); }
        .picker-day {
          aspect-ratio: 1;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; cursor: pointer; border-radius: 6px;
          transition: all 0.2s;
        }
        .picker-day:hover:not(.disabled) { background: rgba(168, 85, 247, 0.2); color: var(--accent); }
        .picker-day.selected { background: var(--accent); color: #fff; font-weight: 700; }
        .picker-day.disabled { color: var(--text-muted); opacity: 0.2; cursor: default; }
      `}</style>
    </div>
  );
}
