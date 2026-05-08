'use client';
import React from 'react';
import { formatDeadlineLabel, deadlineClass } from '@/utils/queueUtils';

const CLASS_COLORS: Record<string, string> = {
  danger: '#FFB3B3',
  warning: '#FFE9A8',
  safe: '#C7F5D9',
};

const TEXT_COLORS: Record<string, string> = {
  danger: '#C0392B',
  warning: '#856404',
  safe: '#276749',
};

interface DeadlineBadgeProps {
  date: string | null | undefined;
}

export default function DeadlineBadge({ date }: DeadlineBadgeProps) {
  if (!date) return <span style={{ color: '#bbb', fontSize: '12px' }}>—</span>;
  const cls = deadlineClass(date);
  const label = formatDeadlineLabel(date);
  const bg = cls ? CLASS_COLORS[cls] : 'transparent';
  const color = cls ? TEXT_COLORS[cls] : '#666';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        background: bg,
        color,
      }}
    >
      {cls === 'danger' && '🔴'} {date} {label && `(${label})`}
    </span>
  );
}
