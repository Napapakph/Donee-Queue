// ─── Column Types ────────────────────────────────────────────────────────────
export type ColumnType = 'text' | 'number' | 'dropdown' | 'checkbox' | 'date';

export interface Column {
  id: string;
  label: string;
  type: ColumnType;
  options?: string[]; // for dropdown
  width?: number;
}

// ─── Row / Cell ───────────────────────────────────────────────────────────────
export type CellValue = string | number | boolean | null;

export interface Row {
  id: string;
  cells: Record<string, CellValue>; // columnId → value
  createdAt: string;
  order: number;
}

// ─── Priority / Status ───────────────────────────────────────────────────────
export type Priority = 'low' | 'medium' | 'high';
export type Status = 'pending' | 'in_progress' | 'done';

// ─── Board ────────────────────────────────────────────────────────────────────
export interface Board {
  id: string;
  name: string;
  columns: Column[];
  rows: Row[];
  createdAt: string;
  updatedAt: string;
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────
export interface DashboardSummary {
  totalIncome: number;
  remainingQueue: number;
  nearestDeadline: { label: string; date: string } | null;
  highPriorityCount: number;
  completedCount: number;
  urgentTodayCount: number;
}

// ─── Supabase DB Row types ────────────────────────────────────────────────────
export interface DbBoard {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DbColumn {
  id: string;
  board_id: string;
  label: string;
  type: ColumnType;
  options: string[] | null;
  width: number | null;
  order: number;
}

export interface DbRow {
  id: string;
  board_id: string;
  cells: Record<string, CellValue>;
  order: number;
  created_at: string;
}
