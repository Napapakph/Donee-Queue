'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  value: string; // HH:mm
  onChange: (val: string) => void;
}

export function MinimalTimePicker({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [h, m] = (value || '00:00').split(':');
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateTime = (newH: string, newM: string) => {
    onChange(`${newH}:${newM}`);
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
          height: '100%'
        }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
      >
        <Clock size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ fontWeight: 700 }}>{value || '00:00'}</span>
      </div>

      {isOpen && (
        <div className="glass" style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          zIndex: 9999,
          width: '200px',
          padding: '1rem',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(20, 20, 25, 0.95)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          gap: '0.5rem',
          height: '240px'
        }}>
          {/* Hours */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '4px' }} className="custom-scroll">
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '4px' }}>HOUR</div>
            {hours.map(hour => (
              <button
                key={hour}
                onClick={() => updateTime(hour, m)}
                style={{
                  padding: '8px',
                  border: 'none',
                  borderRadius: '6px',
                  background: h === hour ? 'var(--accent)' : 'transparent',
                  color: h === hour ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: h === hour ? 700 : 400,
                  cursor: 'pointer'
                }}
              >
                {hour}
              </button>
            ))}
          </div>

          <div style={{ alignSelf: 'center', fontWeight: 800, color: 'var(--text-muted)' }}>:</div>

          {/* Minutes */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '4px' }} className="custom-scroll">
             <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '4px' }}>MIN</div>
             {minutes.map(min => (
              <button
                key={min}
                onClick={() => updateTime(h, min)}
                style={{
                  padding: '8px',
                  border: 'none',
                  borderRadius: '6px',
                  background: m === min ? 'var(--accent)' : 'transparent',
                  color: m === min ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: m === min ? 700 : 400,
                  cursor: 'pointer'
                }}
              >
                {min}
              </button>
            ))}
          </div>

          <style jsx>{`
            .custom-scroll::-webkit-scrollbar { width: 3px; }
            .custom-scroll::-webkit-scrollbar-track { background: transparent; }
            .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
          `}</style>
        </div>
      )}
    </div>
  );
}
