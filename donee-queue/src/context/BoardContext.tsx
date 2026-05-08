'use client';
/**
 * BoardContext – global state for all boards, columns, and rows.
 * Falls back to localStore when Supabase is not configured.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Board, CellValue, Column, Row } from '@/types';
import { getLocalStore, setLocalStore } from '@/utils/localStore';

// Dynamically typed reference to avoid module crash when Supabase is absent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let svc: any = null;

const USE_SUPABASE =
  typeof process !== 'undefined' &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

// ─── Context shape ────────────────────────────────────────────────────────────
interface BoardContextValue {
  boards: Board[];
  activeBoard: Board | null;
  activeBoardId: string | null;
  loading: boolean;
  setActiveBoardId: (id: string) => void;
  createBoard: (name: string) => Promise<void>;
  updateBoardName: (id: string, name: string) => void;
  deleteBoard: (id: string) => void;
  addColumn: (boardId: string, label: string, type: Column['type'], options?: string[]) => void;
  deleteColumn: (boardId: string, columnId: string) => void;
  addRow: (boardId: string) => void;
  updateCell: (boardId: string, rowId: string, colId: string, value: CellValue) => void;
  deleteRow: (boardId: string, rowId: string) => void;
  reorderRows: (boardId: string, newRows: Row[]) => void;
}

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pendingCells = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Load initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (USE_SUPABASE) {
          if (!svc) svc = await import('@/services/boardService');
          const data = await svc.fetchBoards();
          setBoards(data);
          if (data.length) setActiveBoardId(data[0].id);
        } else {
          const local = getLocalStore();
          setBoards(local);
          if (local.length) setActiveBoardId(local[0].id);
        }
      } catch (e) {
        console.error('Failed to load boards', e);
        const local = getLocalStore();
        setBoards(local);
        if (local.length) setActiveBoardId(local[0].id);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);


  // ── Helpers ────────────────────────────────────────────────────────────────
  const updateLocalBoards = useCallback((updated: Board[]) => {
    setBoards(updated);
    if (!USE_SUPABASE) setLocalStore(updated);
  }, []);

  // ── Board actions ──────────────────────────────────────────────────────────
  const createBoard = useCallback(async (name: string) => {
    if (USE_SUPABASE) {
      if (!svc) svc = await import('@/services/boardService');
      const board = await svc.createBoard(name);
      setBoards((prev) => {
        const next = [...prev, board];
        setActiveBoardId(board.id);
        return next;
      });
    } else {
      const id = uuidv4();
      const cols: Column[] = [
        { id: uuidv4(), label: 'ลูกค้า', type: 'text', width: 200 },
        { id: uuidv4(), label: 'ราคา (฿)', type: 'number', width: 120 },
        { id: uuidv4(), label: 'สถานะ', type: 'dropdown', options: ['pending', 'in_progress', 'done'], width: 140 },
        { id: uuidv4(), label: 'Deadline', type: 'date', width: 140 },
        { id: uuidv4(), label: 'Priority', type: 'dropdown', options: ['low', 'medium', 'high'], width: 130 },
        { id: uuidv4(), label: 'เสร็จแล้ว', type: 'checkbox', width: 100 },
      ];
      const board: Board = {
        id,
        name,
        columns: cols,
        rows: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const next = [...boards, board];
      updateLocalBoards(next);
      setActiveBoardId(id);
    }
  }, [boards, updateLocalBoards]);

  const updateBoardName = useCallback((id: string, name: string) => {
    const next = boards.map((b) => (b.id === id ? { ...b, name } : b));
    updateLocalBoards(next);
    if (USE_SUPABASE) {
      (async () => { if (!svc) svc = await import('@/services/boardService'); svc.updateBoardName(id, name).catch(console.error); })();
    }
  }, [boards, updateLocalBoards]);

  const deleteBoard = useCallback((id: string) => {
    const next = boards.filter((b) => b.id !== id);
    updateLocalBoards(next);
    if (activeBoardId === id) setActiveBoardId(next[0]?.id ?? null);
    if (USE_SUPABASE) {
      (async () => { if (!svc) svc = await import('@/services/boardService'); svc.deleteBoard(id).catch(console.error); })();
    }
  }, [boards, activeBoardId, updateLocalBoards]);

  // ── Column actions ─────────────────────────────────────────────────────────
  const addColumn = useCallback(
    (boardId: string, label: string, type: Column['type'], options?: string[]) => {
      const col: Column = { id: uuidv4(), label, type, options, width: 160 };
      const next = boards.map((b) =>
        b.id === boardId ? { ...b, columns: [...b.columns, col] } : b,
      );
      updateLocalBoards(next);
      if (USE_SUPABASE) {
        (async () => {
          if (!svc) svc = await import('@/services/boardService');
          const order = boards.find((b) => b.id === boardId)?.columns.length ?? 0;
          svc.addColumn(boardId, label, type, options, order).catch(console.error);
        })();
      }
    },
    [boards, updateLocalBoards],
  );

  const deleteColumn = useCallback(
    (boardId: string, columnId: string) => {
      const next = boards.map((b) =>
        b.id === boardId
          ? {
              ...b,
              columns: b.columns.filter((c) => c.id !== columnId),
              rows: b.rows.map((r) => {
                const cells = { ...r.cells };
                delete cells[columnId];
                return { ...r, cells };
              }),
            }
          : b,
      );
      updateLocalBoards(next);
      if (USE_SUPABASE) {
        (async () => { if (!svc) svc = await import('@/services/boardService'); svc.deleteColumn(columnId).catch(console.error); })();
      }
    },
    [boards, updateLocalBoards],
  );

  // ── Row actions ────────────────────────────────────────────────────────────
  const addRow = useCallback(
    (boardId: string) => {
      const board = boards.find((b) => b.id === boardId);
      const order = (board?.rows.length ?? 0);
      const row: Row = {
        id: uuidv4(),
        cells: {},
        order,
        createdAt: new Date().toISOString(),
      };
      const next = boards.map((b) =>
        b.id === boardId ? { ...b, rows: [...b.rows, row] } : b,
      );
      updateLocalBoards(next);
      if (USE_SUPABASE) {
        (async () => { if (!svc) svc = await import('@/services/boardService'); svc.addRow(boardId, order).catch(console.error); })();
      }
    },
    [boards, updateLocalBoards],
  );

  const updateCell = useCallback(
    (boardId: string, rowId: string, colId: string, value: CellValue) => {
      const next = boards.map((b) =>
        b.id === boardId
          ? {
              ...b,
              rows: b.rows.map((r) =>
                r.id === rowId
                  ? { ...r, cells: { ...r.cells, [colId]: value } }
                  : r,
              ),
            }
          : b,
      );
      updateLocalBoards(next);

      if (USE_SUPABASE) {
        // Debounce Supabase writes
        const key = `${rowId}`;
        const existing = pendingCells.current.get(key);
        if (existing) clearTimeout(existing);
        const t = setTimeout(() => {
          const updatedBoard = next.find((b) => b.id === boardId);
          const updatedRow = updatedBoard?.rows.find((r) => r.id === rowId);
          if (updatedRow) {
            (async () => { if (!svc) svc = await import('@/services/boardService'); svc.updateRowCells(rowId, updatedRow.cells).catch(console.error); })();
          }
          pendingCells.current.delete(key);
        }, 600);
        pendingCells.current.set(key, t);
      }
    },
    [boards, updateLocalBoards],
  );

  const deleteRow = useCallback(
    (boardId: string, rowId: string) => {
      const next = boards.map((b) =>
        b.id === boardId
          ? { ...b, rows: b.rows.filter((r) => r.id !== rowId) }
          : b,
      );
      updateLocalBoards(next);
      if (USE_SUPABASE) {
        (async () => { if (!svc) svc = await import('@/services/boardService'); svc.deleteRow(rowId).catch(console.error); })();
      }
    },
    [boards, updateLocalBoards],
  );

  const reorderRows = useCallback(
    (boardId: string, newRows: Row[]) => {
      const ordered = newRows.map((r, i) => ({ ...r, order: i }));
      const next = boards.map((b) =>
        b.id === boardId ? { ...b, rows: ordered } : b,
      );
      updateLocalBoards(next);
      if (USE_SUPABASE) {
        (async () => { if (!svc) svc = await import('@/services/boardService'); svc.reorderRows(ordered.map((r: Row) => ({ id: r.id, order: r.order }))).catch(console.error); })();
      }
    },
    [boards, updateLocalBoards],
  );

  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? null;

  return (
    <BoardContext.Provider
      value={{
        boards,
        activeBoard,
        activeBoardId,
        loading,
        setActiveBoardId,
        createBoard,
        updateBoardName,
        deleteBoard,
        addColumn,
        deleteColumn,
        addRow,
        updateCell,
        deleteRow,
        reorderRows,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoardContext() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoardContext must be used within BoardProvider');
  return ctx;
}
