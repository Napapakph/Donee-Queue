/**
 * localStore – in-memory mock store that mirrors Supabase API shape.
 * Used when NEXT_PUBLIC_SUPABASE_URL is not set.
 */
import { v4 as uuidv4 } from 'uuid';
import { Board, Column, Row } from '@/types';

const DEFAULT_COLUMNS: Column[] = [
  { id: uuidv4(), label: 'ลูกค้า', type: 'text', width: 200 },
  { id: uuidv4(), label: 'ราคา (฿)', type: 'number', width: 120 },
  { id: uuidv4(), label: 'สถานะ', type: 'dropdown', options: ['pending', 'in_progress', 'done'], width: 140 },
  { id: uuidv4(), label: 'Deadline', type: 'date', width: 140 },
  { id: uuidv4(), label: 'Priority', type: 'dropdown', options: ['low', 'medium', 'high'], width: 130 },
  { id: uuidv4(), label: 'เสร็จแล้ว', type: 'checkbox', width: 100 },
];

function makeSeedRows(columns: Column[]): Row[] {
  const colMap: Record<string, string> = {};
  columns.forEach((c) => { colMap[c.label] = c.id; });

  const seed = [
    { ลูกค้า: 'Client Alpha', 'ราคา (฿)': 5000, สถานะ: 'done', Deadline: '2026-05-06', Priority: 'high', เสร็จแล้ว: true },
    { ลูกค้า: 'Client Beta', 'ราคา (฿)': 3200, สถานะ: 'in_progress', Deadline: '2026-05-07', Priority: 'high', เสร็จแล้ว: false },
    { ลูกค้า: 'Client Gamma', 'ราคา (฿)': 1800, สถานะ: 'pending', Deadline: '2026-05-10', Priority: 'medium', เสร็จแล้ว: false },
    { ลูกค้า: 'Client Delta', 'ราคา (฿)': 750, สถานะ: 'pending', Deadline: '2026-05-15', Priority: 'low', เสร็จแล้ว: false },
    { ลูกค้า: 'Client Epsilon', 'ราคา (฿)': 2500, สถานะ: 'in_progress', Deadline: '2026-05-08', Priority: 'medium', เสร็จแล้ว: false },
  ];

  return seed.map((s, i) => {
    const cells: Record<string, unknown> = {};
    Object.entries(s).forEach(([key, val]) => {
      const colId = colMap[key];
      if (colId) cells[colId] = val;
    });
    return {
      id: uuidv4(),
      cells,
      order: i,
      createdAt: new Date().toISOString(),
    };
  });
}

let _store: Board[] | null = null;

export function getLocalStore(): Board[] {
  if (!_store) {
    const cols = DEFAULT_COLUMNS.map((c) => ({ ...c, id: uuidv4() }));
    _store = [
      {
        id: uuidv4(),
        name: 'Main Queue',
        columns: cols,
        rows: makeSeedRows(cols),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
  return _store;
}

export function setLocalStore(boards: Board[]): void {
  _store = boards;
}
