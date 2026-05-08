'use client';
import React from 'react';

interface SummaryCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'blue' | 'purple' | 'pink' | 'yellow' | 'green' | 'red';
}

const ACCENT_MAP: Record<string, string> = {
  blue: 'var(--primary)',
  purple: 'var(--secondary)',
  pink: 'var(--accent-pink)',
  yellow: 'var(--accent-yellow)',
  green: '#C7F5D9',
  red: '#FFB3B3',
};

export default function SummaryCard({ icon, label, value, sub, accent = 'blue' }: SummaryCardProps) {
  const bg = ACCENT_MAP[accent] ?? ACCENT_MAP.blue;
  return (
    <div className="summary-card" style={{ borderLeft: `4px solid ${bg}` }}>
      <div className="summary-card__icon">{icon}</div>
      <div className="summary-card__body">
        <p className="summary-card__label">{label}</p>
        <p className="summary-card__value">{value}</p>
        {sub && <p className="summary-card__sub">{sub}</p>}
      </div>
    </div>
  );
}
