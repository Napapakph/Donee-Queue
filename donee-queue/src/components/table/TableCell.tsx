'use client';
import React, { useEffect, useRef, useState } from 'react';
import { CellValue, Column } from '@/types';
import PriorityBadge from '@/components/ui/PriorityBadge';
import DeadlineBadge from '@/components/ui/DeadlineBadge';

interface TableCellProps {
  column: Column;
  value: CellValue;
  onChange: (val: CellValue) => void;
}

export default function TableCell({ column, value, onChange }: TableCellProps) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      (inputRef.current as HTMLElement).focus();
    }
  }, [editing]);

  // ── Checkbox ────────────────────────────────────────────────────────────────
  if (column.type === 'checkbox') {
    return (
      <td className="table-cell table-cell--checkbox">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="cell-checkbox"
        />
      </td>
    );
  }

  // ── Priority display with badge ──────────────────────────────────────────────
  if (column.label === 'Priority' || column.label.toLowerCase().includes('priority')) {
    return (
      <td className="table-cell" onClick={() => setEditing(true)}>
        {editing ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={String(value ?? '')}
            onChange={(e) => { onChange(e.target.value); setEditing(false); }}
            onBlur={() => setEditing(false)}
            className="cell-select"
          >
            <option value="">—</option>
            {(column.options ?? ['low', 'medium', 'high']).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        ) : (
          <div className="cell-display">
            {value ? <PriorityBadge priority={String(value)} /> : <span className="cell-placeholder">—</span>}
          </div>
        )}
      </td>
    );
  }

  // ── Deadline display with badge ──────────────────────────────────────────────
  if (column.type === 'date' || column.label.toLowerCase().includes('deadline')) {
    return (
      <td className="table-cell" onClick={() => setEditing(true)}>
        {editing ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            className="cell-input"
          />
        ) : (
          <div className="cell-display">
            <DeadlineBadge date={value ? String(value) : null} />
          </div>
        )}
      </td>
    );
  }

  // ── Dropdown ─────────────────────────────────────────────────────────────────
  if (column.type === 'dropdown') {
    const statusColors: Record<string, { bg: string; color: string }> = {
      pending: { bg: '#EEF4FF', color: '#4A6FA5' },
      in_progress: { bg: '#FFF4DE', color: '#B7791F' },
      done: { bg: '#DFFFED', color: '#276749' },
    };
    const sc = statusColors[String(value ?? '')] ?? { bg: 'transparent', color: 'inherit' };

    return (
      <td className="table-cell" onClick={() => setEditing(true)}>
        {editing ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={String(value ?? '')}
            onChange={(e) => { onChange(e.target.value); setEditing(false); }}
            onBlur={() => setEditing(false)}
            className="cell-select"
          >
            <option value="">—</option>
            {(column.options ?? []).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        ) : (
          <div className="cell-display">
            {value ? (
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: sc.bg,
                  color: sc.color,
                }}
              >
                {String(value).replace('_', ' ')}
              </span>
            ) : (
              <span className="cell-placeholder">—</span>
            )}
          </div>
        )}
      </td>
    );
  }

  // ── Text / Number ─────────────────────────────────────────────────────────────
  return (
    <td className="table-cell" onClick={() => setEditing(true)}>
      {editing ? (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={column.type === 'number' ? 'number' : 'text'}
          value={String(value ?? '')}
          onChange={(e) =>
            onChange(column.type === 'number' ? Number(e.target.value) : e.target.value)
          }
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => { if (e.key === 'Enter') setEditing(false); }}
          className="cell-input"
        />
      ) : (
        <div className="cell-display">
          {column.type === 'number' && value ? (
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              {Number(value).toLocaleString()}
            </span>
          ) : (
            <span>{value !== null && value !== undefined && value !== '' ? String(value) : <span className="cell-placeholder">—</span>}</span>
          )}
        </div>
      )}
    </td>
  );
}
