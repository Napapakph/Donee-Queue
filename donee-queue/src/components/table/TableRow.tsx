'use client';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Board, Column, Row } from '@/types';
import { useBoardContext } from '@/context/BoardContext';
import { deadlineClass } from '@/utils/queueUtils';
import TableCell from './TableCell';

interface TableRowProps {
  board: Board;
  row: Row;
  columns: Column[];
  index: number;
}

const DEADLINE_BG: Record<string, string> = {
  danger: 'rgba(255,179,179,0.18)',
  warning: 'rgba(255,233,168,0.18)',
  safe: 'transparent',
};

export default function TableRow({ board, row, columns, index }: TableRowProps) {
  const { updateCell, deleteRow } = useBoardContext();
  const [hovered, setHovered] = React.useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  // Find deadline column value for row highlight
  const deadlineCol = columns.find((c) => c.type === 'date' || c.label.toLowerCase().includes('deadline'));
  const deadlineVal = deadlineCol ? String(row.cells[deadlineCol.id] ?? '') : '';
  const dClass = deadlineClass(deadlineVal);
  const rowBg = dClass ? DEADLINE_BG[dClass] : 'transparent';

  return (
    <tr
      ref={setNodeRef}
      style={{ ...style, background: hovered ? 'rgba(167,199,231,0.12)' : rowBg }}
      className={`table-row ${isDragging ? 'table-row--dragging' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Row number */}
      <td className="table-cell table-cell--num">{index + 1}</td>

      {/* Drag handle */}
      <td className="table-cell table-cell--drag" {...attributes} {...listeners}>
        <span className="drag-handle" title="Drag to reorder">⠿</span>
      </td>

      {/* Data cells */}
      {columns.map((col) => (
        <TableCell
          key={col.id}
          column={col}
          value={row.cells[col.id] ?? null}
          onChange={(val) => updateCell(board.id, row.id, col.id, val)}
        />
      ))}

      {/* Delete row */}
      <td className="table-cell table-cell--action">
        {hovered && (
          <button
            className="row-delete-btn"
            title="Delete row"
            onClick={() => deleteRow(board.id, row.id)}
          >
            🗑
          </button>
        )}
      </td>
    </tr>
  );
}
