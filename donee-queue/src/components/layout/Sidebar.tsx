'use client';
import React, { useMemo } from 'react';
import { Board } from '@/types';
import { computeSummary, formatDeadlineLabel } from '@/utils/queueUtils';
import { useBoardContext } from '@/context/BoardContext';
import SummaryCard from '@/components/ui/SummaryCard';

interface SidebarProps {
  board: Board | null;
}

export default function Sidebar({ board }: SidebarProps) {
  const { boards, activeBoardId, setActiveBoardId, createBoard } = useBoardContext();

  const summary = useMemo(() => (board ? computeSummary(board) : null), [board]);

  async function handleNewBoard() {
    const name = prompt('Board name:', 'New Queue');
    if (name?.trim()) await createBoard(name.trim());
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo">
        <span className="sidebar__logo-icon">✦</span>
        <span className="sidebar__logo-text">Donee Queue</span>
      </div>

      {/* Board list */}
      <div className="sidebar__section">
        <p className="sidebar__section-label">Boards</p>
        <ul className="sidebar__board-list">
          {boards.map((b) => (
            <li key={b.id}>
              <button
                className={`sidebar__board-btn ${b.id === activeBoardId ? 'sidebar__board-btn--active' : ''}`}
                onClick={() => setActiveBoardId(b.id)}
              >
                📋 {b.name}
              </button>
            </li>
          ))}
        </ul>
        <button className="sidebar__add-board-btn" onClick={handleNewBoard}>
          + New Board
        </button>
      </div>

      <div className="sidebar__divider" />

      {/* Dashboard summary */}
      {summary && (
        <div className="sidebar__section">
          <p className="sidebar__section-label">📊 Dashboard</p>

          {summary.urgentTodayCount > 0 && (
            <div className="insight-banner">
              🚨 You have <strong>{summary.urgentTodayCount}</strong> urgent task{summary.urgentTodayCount > 1 ? 's' : ''} today!
            </div>
          )}

          <div className="sidebar__cards">
            <SummaryCard
              icon="💰"
              label="Total Income"
              value={`${summary.totalIncome.toLocaleString()} ฿`}
              sub={`from ${summary.completedCount} completed`}
              accent="blue"
            />
            <SummaryCard
              icon="📋"
              label="Remaining Queue"
              value={summary.remainingQueue}
              sub="tasks left"
              accent="purple"
            />
            <SummaryCard
              icon="⏰"
              label="Nearest Deadline"
              value={summary.nearestDeadline?.label ?? '—'}
              sub={
                summary.nearestDeadline
                  ? formatDeadlineLabel(summary.nearestDeadline.date)
                  : 'No upcoming'
              }
              accent="pink"
            />
            <SummaryCard
              icon="🔥"
              label="High Priority"
              value={summary.highPriorityCount}
              sub="tasks"
              accent="red"
            />
          </div>
        </div>
      )}
    </aside>
  );
}
