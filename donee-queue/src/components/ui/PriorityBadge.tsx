'use client';
import React from 'react';
import { Priority } from '@/types';
import { PRIORITY_COLORS } from '@/constants/design';

interface PriorityBadgeProps {
  priority: Priority | string;
}

const LABELS: Record<string, string> = {
  high: 'High 🔥',
  medium: 'Med',
  low: 'Low',
};

const BG: Record<string, string> = {
  high: '#EDE7FF',
  medium: '#FFF6D1',
  low: '#DFFFED',
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const color = PRIORITY_COLORS[priority] ?? '#999';
  const bg = BG[priority] ?? '#f5f5f5';
  const label = LABELS[priority] ?? priority;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 700,
        color,
        background: bg,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
