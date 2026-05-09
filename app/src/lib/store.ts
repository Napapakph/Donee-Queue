'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserRole, WorkType, ScaleType, CommissionStatus,
  Platform, QueueCard, ProgressStage, IncomeEntry, ExpenseEntry,
  TaxDeductionType, UserProfile, AppSettings, Notification, ContactChannel
} from './types';
// ── Simple UUID shim ──────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Default settings ──────────────────────────────────────────────────────────
const defaultSettings: AppSettings = {
  accentColor: '#a855f7',
  secondaryColor: '#6366f1',
  textColor: '#ffffff',
  theme: 'dark',
  language: 'th',
  presetTheme: 'midnight-purple',
  bgType: 'gradient',
  bgColor1: '#0d0d14',
  bgColor2: '#1a0a2e',
  bgGradientDirection: '135deg',
  bgPattern: 'none',
  bgBlur: 0,
  bgOpacity: 100,
  particlesEnabled: true,
  pageTransitions: true,
  cardHoverAnimations: true,
  glassmorphismIntensity: 60,
  warningThresholdPercent: 70,
  currency: '฿',
  dateFormat: 'DD/MM/YYYY',
  defaultCardPublic: true,
  nsfwBlurForGuests: true,
  showIncomeSummaryToGuests: false,
  watermarkType: 'none',
  watermarkText: 'DO NOT REPOST',
};

const defaultProfile: UserProfile = {
  displayName: 'My Art Studio',
  avatar: undefined,
  bio: 'Welcome to my commission page! I create custom artwork with love ✨',
  contactChannels: [],
};

// ── Seed data ──────────────────────────────────────────────────────────────────
const seedWorkTypes: WorkType[] = [
  { id: 'wt1', name: 'Rough Sketch', description: 'Quick pencil sketch', basePrice: 300, estimatedDurationDays: 2, visible: true },
  { id: 'wt2', name: 'Line Art', description: 'Clean inked linework', basePrice: 600, estimatedDurationDays: 4, visible: true },
  { id: 'wt3', name: 'Full Color', description: 'Fully rendered colored artwork', basePrice: 1200, estimatedDurationDays: 7, visible: true },
  { id: 'wt4', name: 'Omakase', description: 'Leave it to the artist', basePrice: 900, estimatedDurationDays: 5, visible: true },
];

const seedScaleTypes: ScaleType[] = [
  { id: 'sc1', name: 'Bust', priceModifier: 0, priceModifierType: 'flat', durationModifierDays: 0 },
  { id: 'sc2', name: 'Half Body', priceModifier: 20, priceModifierType: 'percentage', durationModifierDays: 1 },
  { id: 'sc3', name: 'Full Body', priceModifier: 50, priceModifierType: 'percentage', durationModifierDays: 2 },
  { id: 'sc4', name: 'Chibi', priceModifier: -10, priceModifierType: 'percentage', durationModifierDays: -1 },
];

const seedPlatforms: Platform[] = [
  { id: 'p1', name: 'Twitter / X' },
  { id: 'p2', name: 'Instagram' },
  { id: 'p3', name: 'Discord' },
  { id: 'p4', name: 'VGen' },
  { id: 'p5', name: 'Pixiv' },
  { id: 'p6', name: 'Email' },
  { id: 'p7', name: 'DeviantArt' },
];

// ── Store interface ───────────────────────────────────────────────────────────
interface AppState {
  // Auth / Role
  role: UserRole;
  isPro: boolean;
  setRole: (r: UserRole) => void;

  // Profile
  profile: UserProfile;
  updateProfile: (p: Partial<UserProfile>) => void;
  addContactChannel: (c: Omit<ContactChannel, 'id'>) => void;
  updateContactChannel: (id: string, c: Partial<ContactChannel>) => void;
  removeContactChannel: (id: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;

  // Commission Art
  workTypes: WorkType[];
  addWorkType: (w: Omit<WorkType, 'id'> & { id?: string }) => void;
  updateWorkType: (id: string, w: Partial<WorkType>) => void;
  removeWorkType: (id: string) => void;

  scaleTypes: ScaleType[];
  addScaleType: (s: Omit<ScaleType, 'id'> & { id?: string }) => void;
  updateScaleType: (id: string, s: Partial<ScaleType>) => void;
  removeScaleType: (id: string) => void;

  commissionStatus: CommissionStatus;
  setCommissionStatus: (s: CommissionStatus) => void;
  tos: string;
  setTos: (t: string) => void;
  showcaseImages: { id: string; url: string; caption: string; workTypeTag?: string; isNSFW: boolean }[];
  addShowcaseImage: (img: { url: string; caption: string; workTypeTag?: string; isNSFW: boolean; id?: string }) => void;
  updateShowcaseImage: (id: string, img: Partial<{ caption: string; isNSFW: boolean; workTypeTag: string }>) => void;
  removeShowcaseImage: (id: string) => void;

  // Platforms
  platforms: Platform[];
  addPlatform: (p: Omit<Platform, 'id'>) => void;
  removePlatform: (id: string) => void;

  // Queue
  queueCards: QueueCard[];
  addCard: (c: Omit<QueueCard, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  updateCard: (id: string, c: Partial<QueueCard>) => void;
  removeCard: (id: string) => void;
  updateCardProgress: (id: string, stage: ProgressStage) => void;

  // Finance
  incomeEntries: IncomeEntry[];
  addIncomeEntry: (e: Omit<IncomeEntry, 'id'> & { id?: string }) => void;
  updateIncomeEntry: (id: string, e: Partial<IncomeEntry>) => void;
  removeIncomeEntry: (id: string) => void;

  expenseEntries: ExpenseEntry[];
  addExpenseEntry: (e: Omit<ExpenseEntry, 'id'> & { id?: string }) => void;
  updateExpenseEntry: (id: string, e: Partial<ExpenseEntry>) => void;
  removeExpenseEntry: (id: string) => void;

  taxDeductionTypes: TaxDeductionType[];
  addTaxType: (t: Omit<TaxDeductionType, 'id'> & { id?: string }) => void;
  updateTaxType: (id: string, t: Partial<TaxDeductionType>) => void;
  removeTaxType: (id: string) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  // Busy Days
  toggleBusyDay: (date: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Auth ──
      role: 'user' as UserRole,
      isPro: false,
      setRole: (r) => set({ role: r }),

      // ── Profile ──
      profile: defaultProfile,
      updateProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      addContactChannel: (c) => set((s) => ({
        profile: {
          ...s.profile,
          contactChannels: [...s.profile.contactChannels, { ...c, id: uid() }],
        },
      })),
      updateContactChannel: (id, c) => set((s) => ({
        profile: {
          ...s.profile,
          contactChannels: s.profile.contactChannels.map((ch) =>
            ch.id === id ? { ...ch, ...c } : ch
          ),
        },
      })),
      removeContactChannel: (id) => set((s) => ({
        profile: {
          ...s.profile,
          contactChannels: s.profile.contactChannels.filter((ch) => ch.id !== id),
        },
      })),

      // ── Settings ──
      settings: defaultSettings,
      updateSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),

      // ── Work Types ──
      workTypes: seedWorkTypes,
      addWorkType: (w) => set((s) => ({ workTypes: [...s.workTypes, { id: uid(), ...w }] })),
      updateWorkType: (id, w) => set((s) => ({
        workTypes: s.workTypes.map((t) => (t.id === id ? { ...t, ...w } : t)),
      })),
      removeWorkType: (id) => set((s) => ({ workTypes: s.workTypes.filter((t) => t.id !== id) })),

      // ── Scale Types ──
      scaleTypes: seedScaleTypes,
      addScaleType: (sc) => set((s) => ({ scaleTypes: [...s.scaleTypes, { id: uid(), ...sc }] })),
      updateScaleType: (id, sc) => set((s) => ({
        scaleTypes: s.scaleTypes.map((t) => (t.id === id ? { ...t, ...sc } : t)),
      })),
      removeScaleType: (id) => set((s) => ({ scaleTypes: s.scaleTypes.filter((t) => t.id !== id) })),

      // ── Commission Art ──
      commissionStatus: 'open',
      setCommissionStatus: (s) => set({ commissionStatus: s }),
      tos: '## Terms of Service\n\nPlease read my TOS before commissioning. Payment is required upfront. No refunds after work has begun.',
      setTos: (t) => set({ tos: t }),
      showcaseImages: [],
      addShowcaseImage: (img) => set((s) => ({
        showcaseImages: [...s.showcaseImages, { id: uid(), ...img }],
      })),
      updateShowcaseImage: (id, img) => set((s) => ({
        showcaseImages: s.showcaseImages.map((i) => (i.id === id ? { ...i, ...img } : i)),
      })),
      removeShowcaseImage: (id) => set((s) => ({
        showcaseImages: s.showcaseImages.filter((i) => i.id !== id),
      })),

      // ── Platforms ──
      platforms: seedPlatforms,
      addPlatform: (p) => set((s) => ({ platforms: [...s.platforms, { ...p, id: uid() }] })),
      removePlatform: (id) => set((s) => ({ platforms: s.platforms.filter((p) => p.id !== id) })),

      // ── Queue ──
      queueCards: [],
      addCard: (c) => {
        const now = new Date().toISOString();
        set((s) => ({
          queueCards: [...s.queueCards, { id: uid(), createdAt: now, updatedAt: now, ...c }],
        }));
      },
      updateCard: (id, c) => {
        const now = new Date().toISOString();
        set((s) => ({
          queueCards: s.queueCards.map((card) =>
            card.id === id ? { ...card, ...c, updatedAt: now } : card
          ),
        }));
        // If payment becomes 'paid', sync income
        const updated = { ...get().queueCards.find((c2) => c2.id === id), ...c };
        if (c.paymentStatus === 'paid') {
          const existing = get().incomeEntries.find((e) => e.queueCardId === id);
          if (!existing) {
            get().addIncomeEntry({
              date: updated.commissionDate || new Date().toISOString().slice(0, 10),
              amount: (updated.price || 0) * (updated.quantity || 1),
              source: updated.customerName || '',
              category: 'Commission',
              isFromQueue: true,
              queueCardId: id,
            });
          }
        }
      },
      removeCard: (id) => set((s) => ({
        queueCards: s.queueCards.filter((c) => c.id !== id),
      })),
      updateCardProgress: (id, stage) => {
        get().updateCard(id, { progress: stage });
      },

      // ── Income ──
      incomeEntries: [],
      addIncomeEntry: (e) => set((s) => ({
        incomeEntries: [...s.incomeEntries, { id: uid(), ...e }],
      })),
      updateIncomeEntry: (id, e) => set((s) => ({
        incomeEntries: s.incomeEntries.map((entry) =>
          entry.id === id ? { ...entry, ...e } : entry
        ),
      })),
      removeIncomeEntry: (id) => set((s) => ({
        incomeEntries: s.incomeEntries.filter((e) => e.id !== id),
      })),

      // ── Expenses ──
      expenseEntries: [],
      addExpenseEntry: (e) => set((s) => ({
        expenseEntries: [...s.expenseEntries, { id: uid(), ...e }],
      })),
      updateExpenseEntry: (id, e) => set((s) => ({
        expenseEntries: s.expenseEntries.map((entry) =>
          entry.id === id ? { ...entry, ...e } : entry
        ),
      })),
      removeExpenseEntry: (id) => set((s) => ({
        expenseEntries: s.expenseEntries.filter((e) => e.id !== id),
      })),

      // ── Tax ──
      taxDeductionTypes: [],
      addTaxType: (t) => set((s) => ({
        taxDeductionTypes: [...s.taxDeductionTypes, { id: uid(), ...t }],
      })),
      updateTaxType: (id, t) => set((s) => ({
        taxDeductionTypes: s.taxDeductionTypes.map((tt) =>
          tt.id === id ? { ...tt, ...t } : tt
        ),
      })),
      removeTaxType: (id) => set((s) => ({
        taxDeductionTypes: s.taxDeductionTypes.filter((t) => t.id !== id),
      })),

      // ── Notifications ──
      notifications: [],
      addNotification: (n) => set((s) => ({
        notifications: [
          { ...n, id: uid(), createdAt: new Date().toISOString() },
          ...s.notifications,
        ],
      })),
      markNotificationRead: (id) => set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),
      toggleBusyDay: (date) => set((s) => {
        const current = s.profile.busyDays || [];
        const next = current.includes(date)
          ? current.filter((d) => d !== date)
          : [...current, date];
        return {
          profile: { ...s.profile, busyDays: next }
        };
      }),
    }),
    {
      name: 'donee-queue-storage',
    }
  )
);
