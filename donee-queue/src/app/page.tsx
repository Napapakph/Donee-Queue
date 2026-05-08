'use client';
import React, { useState } from 'react';
import { useBoardContext } from '@/context/BoardContext';
import Sidebar from '@/components/layout/Sidebar';
import Table from '@/components/table/Table';

export default function HomePage() {
  const { activeBoard, loading, updateBoardName } = useBoardContext();
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState('');

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading your queue…</p>
      </div>
    );
  }

  function startEditName() {
    if (!activeBoard) return;
    setNameVal(activeBoard.name);
    setEditingName(true);
  }

  function saveEditName() {
    if (activeBoard && nameVal.trim()) {
      updateBoardName(activeBoard.id, nameVal.trim());
    }
    setEditingName(false);
  }

  return (
    <div className="app-shell">
      <Sidebar board={activeBoard} />

      <main className="main-content">
        {activeBoard ? (
          <>
            {/* Board header */}
            <div className="board-header">
              {editingName ? (
                <input
                  className="board-name-input"
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  onBlur={saveEditName}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEditName(); if (e.key === 'Escape') setEditingName(false); }}
                  autoFocus
                />
              ) : (
                <h1 className="board-name" onClick={startEditName} title="Click to rename">
                  {activeBoard.name}
                  <span className="board-name-edit-hint">✎</span>
                </h1>
              )}
              <p className="board-meta">
                {activeBoard.rows.length} rows · {activeBoard.columns.length} columns
              </p>
            </div>

            <Table board={activeBoard} />
          </>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
            <h2>No board selected</h2>
            <p>Create a new board from the sidebar to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}
