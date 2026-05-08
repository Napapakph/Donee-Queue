'use client';
import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Board } from '@/types';
import { useBoardContext } from '@/context/BoardContext';
import ColumnHeader from './ColumnHeader';
import TableRow from './TableRow';
import AddColumnModal from '@/components/modals/AddColumnModal';

type SortKey = 'none' | 'deadline' | 'priority';

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

interface Props {
  board: Board;
}

export default function Table({ board }: Props) {
  const { addRow, reorderRows } = useBoardContext();
  const [showAddCol, setShowAddCol] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('none');
  const [filterDone, setFilterDone] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Sort rows
  const deadlineColId = board.columns.find(
    (c) => c.type === 'date' || c.label.toLowerCase().includes('deadline'),
  )?.id;
  const priorityColId = board.columns.find(
    (c) => c.label.toLowerCase().includes('priority'),
  )?.id;
  const doneColId = board.columns.find(
    (c) => c.type === 'checkbox' || c.label.toLowerCase().includes('เสร็จ'),
  )?.id;

  let displayRows = [...board.rows];

  if (filterDone && doneColId) {
    displayRows = displayRows.filter((r) => !r.cells[doneColId]);
  }

  if (sortKey === 'deadline' && deadlineColId) {
    displayRows.sort((a, b) => {
      const da = String(a.cells[deadlineColId] ?? 'z');
      const db = String(b.cells[deadlineColId] ?? 'z');
      return da.localeCompare(db);
    });
  } else if (sortKey === 'priority' && priorityColId) {
    displayRows.sort((a, b) => {
      const pa = PRIORITY_ORDER[String(a.cells[priorityColId] ?? 'low')] ?? 3;
      const pb = PRIORITY_ORDER[String(b.cells[priorityColId] ?? 'low')] ?? 3;
      return pa - pb;
    });
  } else {
    displayRows.sort((a, b) => a.order - b.order);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = board.rows.findIndex((r) => r.id === active.id);
    const newIdx = board.rows.findIndex((r) => r.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const moved = arrayMove([...board.rows].sort((a, b) => a.order - b.order), oldIdx, newIdx);
    reorderRows(board.id, moved);
  }

  return (
    <div className="table-wrapper">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="table-toolbar__sort">
          <button
            className={`toolbar-btn ${sortKey === 'deadline' ? 'toolbar-btn--active' : ''}`}
            onClick={() => setSortKey((s) => s === 'deadline' ? 'none' : 'deadline')}
          >
            📅 Sort by Deadline
          </button>
          <button
            className={`toolbar-btn ${sortKey === 'priority' ? 'toolbar-btn--active' : ''}`}
            onClick={() => setSortKey((s) => s === 'priority' ? 'none' : 'priority')}
          >
            🔥 Sort by Priority
          </button>
          <button
            className={`toolbar-btn ${filterDone ? 'toolbar-btn--active' : ''}`}
            onClick={() => setFilterDone((f) => !f)}
          >
            ☑ Hide Done
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="toolbar-btn toolbar-btn--primary" onClick={() => setShowAddCol(true)}>
            + Add Column
          </button>
          <button className="toolbar-btn toolbar-btn--primary" onClick={() => addRow(board.id)}>
            + Add Row
          </button>
        </div>
      </div>

      {/* Table */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={displayRows.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
      <div className="table-scroll">
        <table className="queue-table">
          <thead>
            <tr>
              <th className="col-header col-header--num">#</th>
              <th className="col-header col-header--drag"></th>
              {board.columns.map((col) => (
                <ColumnHeader key={col.id} column={col} boardId={board.id} />
              ))}
              <th className="col-header col-header--action"></th>
            </tr>
          </thead>

          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td
                  colSpan={board.columns.length + 3}
                  style={{ textAlign: 'center', padding: '48px', color: '#aaa' }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                  <p style={{ margin: 0, fontSize: '14px' }}>No queue items yet. Click <strong>+ Add Row</strong> to start.</p>
                </td>
              </tr>
            ) : (
              displayRows.map((row, i) => (
                <TableRow
                  key={row.id}
                  board={board}
                  row={row}
                  columns={board.columns}
                  index={i}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
        </SortableContext>
      </DndContext>

      {showAddCol && (
        <AddColumnModal boardId={board.id} onClose={() => setShowAddCol(false)} />
      )}
    </div>
  );
}
