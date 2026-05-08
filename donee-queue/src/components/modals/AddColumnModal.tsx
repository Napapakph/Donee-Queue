'use client';
import React, { useState } from 'react';
import { Column } from '@/types';
import { useBoardContext } from '@/context/BoardContext';
import Modal from '@/components/ui/Modal';

interface Props {
  boardId: string;
  onClose: () => void;
}

const COL_TYPES: Column['type'][] = ['text', 'number', 'dropdown', 'checkbox', 'date'];

export default function AddColumnModal({ boardId, onClose }: Props) {
  const { addColumn } = useBoardContext();
  const [label, setLabel] = useState('');
  const [type, setType] = useState<Column['type']>('text');
  const [options, setOptions] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    const opts = type === 'dropdown' ? options.split(',').map((o) => o.trim()).filter(Boolean) : undefined;
    addColumn(boardId, label.trim(), type, opts);
    onClose();
  }

  return (
    <Modal title="Add Column" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Column Name</label>
          <input
            className="form-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Notes"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Type</label>
          <select
            className="form-input"
            value={type}
            onChange={(e) => setType(e.target.value as Column['type'])}
          >
            {COL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {type === 'dropdown' && (
          <div className="form-group">
            <label className="form-label">Options (comma-separated)</label>
            <input
              className="form-input"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder="Option A, Option B, Option C"
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add Column</button>
        </div>
      </form>
    </Modal>
  );
}
