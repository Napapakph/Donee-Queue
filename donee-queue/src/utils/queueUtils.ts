import { differenceInDays, parseISO, isValid } from 'date-fns';
import { Board, Column, DashboardSummary, Row } from '@/types';

/** Find which column id matches a label hint */
function findColId(columns: Column[], hints: string[]): string | undefined {
  return columns.find((c) =>
    hints.some((h) => c.label.toLowerCase().includes(h.toLowerCase())),
  )?.id;
}

/** Days until a deadline string (ISO or yyyy-MM-dd). Negative = overdue. */
export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = parseISO(String(dateStr));
  if (!isValid(d)) return null;
  return differenceInDays(d, new Date());
}

/** Row urgency class based on deadline days */
export function deadlineClass(dateStr: string | null | undefined): 'danger' | 'warning' | 'safe' | null {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  if (days <= 1) return 'danger';
  if (days <= 3) return 'warning';
  return 'safe';
}

/** Format a date string to a human-friendly relative label */
export function formatDeadlineLabel(dateStr: string | null | undefined): string {
  const days = daysUntil(dateStr);
  if (days === null) return '';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days}d left`;
}

/** Compute dashboard summary from a board */
export function computeSummary(board: Board): DashboardSummary {
  const cols = board.columns;
  const rows = board.rows;

  const priceColId = findColId(cols, ['ราคา', 'price', 'income', 'amount']);
  const doneColId = findColId(cols, ['เสร็จ', 'done', 'complete', 'check']);
  const deadlineColId = findColId(cols, ['deadline', 'due', 'date', 'วันที่']);
  const priorityColId = findColId(cols, ['priority', 'ความสำคัญ']);
  const labelColId = findColId(cols, ['ลูกค้า', 'name', 'client', 'title', 'ชื่อ']);

  let totalIncome = 0;
  let remainingQueue = 0;
  let completedCount = 0;
  let highPriorityCount = 0;
  let urgentTodayCount = 0;
  let nearestDeadline: { label: string; date: string } | null = null;
  let nearestDays = Infinity;

  for (const row of rows) {
    const isDone = doneColId ? Boolean(row.cells[doneColId]) : false;
    const price = priceColId ? Number(row.cells[priceColId] ?? 0) : 0;
    const deadline = deadlineColId ? String(row.cells[deadlineColId] ?? '') : '';
    const priority = priorityColId ? String(row.cells[priorityColId] ?? '') : '';
    const clientLabel = labelColId ? String(row.cells[labelColId] ?? 'Unnamed') : 'Unnamed';

    if (isDone) {
      completedCount++;
      totalIncome += price;
    } else {
      remainingQueue++;

      const days = daysUntil(deadline);
      if (days !== null && days < nearestDays) {
        nearestDays = days;
        nearestDeadline = { label: clientLabel, date: deadline };
      }
      if (days !== null && days <= 1) urgentTodayCount++;
    }

    if (priority === 'high') highPriorityCount++;
  }

  return {
    totalIncome,
    remainingQueue,
    nearestDeadline,
    highPriorityCount,
    completedCount,
    urgentTodayCount,
  };
}
