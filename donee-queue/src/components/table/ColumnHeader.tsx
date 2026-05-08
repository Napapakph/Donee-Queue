'use client';
import React from 'react';
import { Column } from '@/types';
import { useBoardContext } from '@/context/BoardContext';

interface ColumnHeaderProps {
  column: Column;
  boardId: string;
}

const TYPE_ICONS: Record<string, string> = {
  text: '𝐓',
  number: '#',
  dropdown: '▾',
  checkbox: '☑',
  date: '📅',
};

export default function ColumnHeader({ column, boardId }: ColumnHeaderProps) {
  const { deleteColumn } = useBoardContext();
  const [hovered, setHovered] = React.useState(false);

  return (
    <th
      className="col-header"
      style={{ width: column.width }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="col-header__inner">
        <span className="col-header__type-icon" title={column.type}>
          {TYPE_ICONS[column.type] ?? '?'}
        </span>
        <span className="col-header__label">{column.label}</span>
        {hovered && column.label !== 'เสร็จแล้ว' && (
          <button
            className="col-header__delete"
            title="Delete column"
            onClick={() => {
              if (confirm(`Delete column "${column.label}"?`)) {
                deleteColumn(boardId, column.id);
              }
            }}
          >
            ×
          </button>
        )}
      </div>
    </th>
  );
}
