/**
 * boardService – backend API calls for boards, columns, and rows.
 * All Supabase interaction is isolated here.
 */
import { supabase } from '@/lib/supabase/client';
import { Board, Column, Row, DbBoard, DbColumn, DbRow } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ─── Default columns when creating a new board ───────────────────────────────
const DEFAULT_COLUMNS: Omit<Column, 'id'>[] = [
  { label: 'ลูกค้า', type: 'text', width: 180 },
  { label: 'ราคา (฿)', type: 'number', width: 120 },
  { label: 'สถานะ', type: 'dropdown', options: ['pending', 'in_progress', 'done'], width: 140 },
  { label: 'Deadline', type: 'date', width: 140 },
  { label: 'Priority', type: 'dropdown', options: ['low', 'medium', 'high'], width: 130 },
  { label: 'เสร็จแล้ว', type: 'checkbox', width: 100 },
];

// ─── Map DB types → app types ─────────────────────────────────────────────────
function mapDbColumn(c: DbColumn): Column {
  return {
    id: c.id,
    label: c.label,
    type: c.type,
    options: c.options ?? undefined,
    width: c.width ?? 160,
  };
}

function mapDbRow(r: DbRow): Row {
  return {
    id: r.id,
    cells: r.cells,
    order: r.order,
    createdAt: r.created_at,
  };
}

// ─── Board CRUD ───────────────────────────────────────────────────────────────
export async function fetchBoards(): Promise<Board[]> {
  const { data: boards, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!boards?.length) return [];

  const result: Board[] = [];

  for (const b of boards as DbBoard[]) {
    const [{ data: cols }, { data: rowsData }] = await Promise.all([
      supabase.from('columns').select('*').eq('board_id', b.id).order('order'),
      supabase.from('rows').select('*').eq('board_id', b.id).order('order'),
    ]);

    result.push({
      id: b.id,
      name: b.name,
      columns: (cols as DbColumn[] ?? []).map(mapDbColumn),
      rows: (rowsData as DbRow[] ?? []).map(mapDbRow),
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    });
  }

  return result;
}

export async function createBoard(name: string): Promise<Board> {
  const { data, error } = await supabase
    .from('boards')
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  const board = data as DbBoard;

  // Insert default columns
  const colsToInsert = DEFAULT_COLUMNS.map((col, i) => ({
    id: uuidv4(),
    board_id: board.id,
    label: col.label,
    type: col.type,
    options: col.options ?? null,
    width: col.width ?? 160,
    order: i,
  }));

  const { data: cols, error: colErr } = await supabase
    .from('columns')
    .insert(colsToInsert)
    .select();

  if (colErr) throw colErr;

  return {
    id: board.id,
    name: board.name,
    columns: (cols as DbColumn[]).map(mapDbColumn),
    rows: [],
    createdAt: board.created_at,
    updatedAt: board.updated_at,
  };
}

export async function updateBoardName(boardId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('boards')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', boardId);
  if (error) throw error;
}

export async function deleteBoard(boardId: string): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', boardId);
  if (error) throw error;
}

// ─── Column CRUD ──────────────────────────────────────────────────────────────
export async function addColumn(
  boardId: string,
  label: string,
  type: Column['type'],
  options?: string[],
  order = 0,
): Promise<Column> {
  const { data, error } = await supabase
    .from('columns')
    .insert({ board_id: boardId, label, type, options: options ?? null, order, width: 160 })
    .select()
    .single();

  if (error) throw error;
  return mapDbColumn(data as DbColumn);
}

export async function deleteColumn(columnId: string): Promise<void> {
  const { error } = await supabase.from('columns').delete().eq('id', columnId);
  if (error) throw error;
}

// ─── Row CRUD ─────────────────────────────────────────────────────────────────
export async function addRow(boardId: string, order: number): Promise<Row> {
  const { data, error } = await supabase
    .from('rows')
    .insert({ board_id: boardId, cells: {}, order })
    .select()
    .single();

  if (error) throw error;
  return mapDbRow(data as DbRow);
}

export async function updateRowCells(
  rowId: string,
  cells: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from('rows').update({ cells }).eq('id', rowId);
  if (error) throw error;
}

export async function reorderRows(
  rows: { id: string; order: number }[],
): Promise<void> {
  const updates = rows.map((r) =>
    supabase.from('rows').update({ order: r.order }).eq('id', r.id),
  );
  await Promise.all(updates);
}

export async function deleteRow(rowId: string): Promise<void> {
  const { error } = await supabase.from('rows').delete().eq('id', rowId);
  if (error) throw error;
}
