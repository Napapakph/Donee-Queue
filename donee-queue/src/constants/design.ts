// ─── Design tokens ────────────────────────────────────────────────────────────
export const COLORS = {
  background: '#FAFCFF',
  primary: '#A7C7E7',
  secondary: '#B8A1FF',
  accentPink: '#FFC6D9',
  accentYellow: '#FFF1A8',
  text: '#2B2D42',
  border: '#E6EAF2',
  // Status
  deadlineNear: '#FFB3B3',
  deadlineMedium: '#FFE9A8',
  deadlineSafe: '#C7F5D9',
  // Priority badge backgrounds
  highBg: '#FFD6F5',
  mediumBg: '#FFF1A8',
  lowBg: '#C7F5D9',
} as const;

export const PRIORITY_COLORS: Record<string, string> = {
  high: '#B8A1FF',
  medium: '#F9C74F',
  low: '#90BE6D',
};

export const STATUS_OPTIONS = ['pending', 'in_progress', 'done'] as const;
export const PRIORITY_OPTIONS = ['low', 'medium', 'high'] as const;
