// ─── Roles ───────────────────────────────────────────────────────────────────
export type UserRole = 'guest' | 'user' | 'admin';

// ─── Work Types & Scales ──────────────────────────────────────────────────────
export interface WorkType {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  estimatedDurationDays: number;
  examples?: string[]; // image URLs
  visible: boolean;
}

export interface ScaleType {
  id: string;
  name: string;
  priceModifier: number;
  priceModifierType: 'flat' | 'percentage';
  durationModifierDays: number;
  examples?: string[];
}

export type CommissionStatus = 'open' | 'closed' | 'waitlist';

export type ProgressStage =
  | 'Waiting'
  | 'Sketching'
  | 'Adding Details'
  | 'Complete';

export type PaymentStatus = 'unpaid' | 'deposit' | 'paid';

export interface Platform {
  id: string;
  name: string;
  icon?: string;
}

// ─── Queue Card ───────────────────────────────────────────────────────────────
export interface QueueCard {
  id: string;
  customerName: string;
  platformId: string;
  workTypeId: string;
  scaleTypeId?: string;
  description: string;
  price: number;
  isCommercial: boolean;
  isPublic: boolean;
  isNSFW: boolean;
  quantity: number;
  briefReceived: boolean;
  paymentStatus: PaymentStatus;
  commissionDate: string; // ISO date
  commissionTime?: string; // HH:mm format
  deadlineDate: string;   // ISO date
  progress: ProgressStage;
  notes: string;
  images: string[]; // URLs / data URIs
  createdAt: string;
  updatedAt: string;
}

// ─── Analytics / Finance ─────────────────────────────────────────────────────
export interface IncomeEntry {
  id: string;
  date: string;
  amount: number;
  source: string;
  category: string;
  isFromQueue: boolean;
  queueCardId?: string;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  receipt?: string;
}

export interface TaxDeductionType {
  id: string;
  name: string;
  type: 'percentage' | 'flat';
  value: number; // % or flat amount
  appliesToCategory: string; // expense category
}

// ─── User Profile ─────────────────────────────────────────────────────────────
export type SocialPlatform =
  | 'vgen' | 'gumroad' | 'kofi' | 'patreon' | 'facebook'
  | 'deviantart' | 'x' | 'instagram' | 'bluesky' | 'pixiv'
  | 'artstation' | 'discord' | 'email' | 'website' | 'youtube'
  | 'tiktok' | 'twitch' | 'custom';

export interface ContactChannel {
  id: string;
  platform: SocialPlatform;
  label?: string;
  url: string;
  visible: boolean; // show to guests
}

export interface SettingsPayload {
  settings: Partial<AppSettings>;
  profile: Partial<UserProfile>;
  contactChannels: any[];
}

export function parseExample(ex: string): { full: string, thumb: string } {
  try {
    if (ex.startsWith('{')) {
      const p = JSON.parse(ex);
      if (p.full && p.thumb) return p;
    }
  } catch (e) { }
  return { full: ex, thumb: ex };
}

export interface UserProfile {
  displayName: string;
  slug?: string;
  avatar?: string;
  bio: string;
  contactChannels: ContactChannel[];
  busyDays?: string[]; // Array of ISO date strings (YYYY-MM-DD)
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export interface AppSettings {
  // Theme
  accentColor: string;
  secondaryColor: string;
  textColor: string;
  theme: 'dark' | 'light';
  language: 'en' | 'th';
  presetTheme: string;
  // Background
  bgType: 'solid' | 'gradient' | 'pattern' | 'image';
  bgColor1: string;
  bgColor2: string;
  bgGradientDirection: string;
  bgPattern: 'none' | 'dots' | 'grid' | 'noise';
  bgImage?: string;
  bgBlur: number;
  bgOpacity: number;
  // Effects
  particlesEnabled: boolean;
  pageTransitions: boolean;
  cardHoverAnimations: boolean;
  glassmorphismIntensity: number;
  // Deadline
  warningThresholdPercent: number;
  // Locale
  currency: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  // Queue defaults
  defaultCardPublic: boolean;
  nsfwBlurForGuests: boolean;
  showIncomeSummaryToGuests: boolean;
  // Watermark
  watermarkType: 'none' | 'text' | 'image';
  watermarkText?: string;
  watermarkImage?: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ─── App User ─────────────────────────────────────────────────────────────────
export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  isPro: boolean;
  profile: UserProfile;
  settings: AppSettings;
  notifications: Notification[];
}
