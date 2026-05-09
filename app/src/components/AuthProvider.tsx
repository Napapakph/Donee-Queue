'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  syncFromSupabase: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  signOut: async () => {}, syncFromSupabase: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    updateProfile, updateSettings, setRole,
    workTypes, scaleTypes, platforms, queueCards, settings,
  } = useAppStore();

  // ── Load data from Supabase into store ─────────────────────────────────────
  const syncFromSupabase = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;

    // Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single();
    if (profile) {
      updateProfile({
        displayName: profile.display_name,
        avatar: profile.avatar,
        bio: profile.bio,
        contactChannels: profile.contact_channels || [],
      });
      if (profile.app_settings && Object.keys(profile.app_settings).length > 0) {
        updateSettings(profile.app_settings);
      }
      if (profile.commission_status) {
        useAppStore.getState().setCommissionStatus(profile.commission_status);
      }
      if (profile.tos) useAppStore.getState().setTos(profile.tos);
      if (profile.is_pro) useAppStore.setState({ isPro: true });
    }

    // Work types
    const { data: wts } = await supabase.from('work_types').select('*').eq('user_id', u.id);
    if (wts?.length) {
      useAppStore.setState({
        workTypes: wts.map((w: any) => ({
          id: w.id, name: w.name, description: w.description,
          basePrice: w.base_price, estimatedDurationDays: w.estimated_duration_days, visible: w.visible,
          examples: w.examples || [],
        })),
      });
    }

    // Scale types
    const { data: scs } = await supabase.from('scale_types').select('*').eq('user_id', u.id);
    if (scs?.length) {
      useAppStore.setState({
        scaleTypes: scs.map((s: any) => ({
          id: s.id, name: s.name, priceModifier: s.price_modifier,
          priceModifierType: s.price_modifier_type, durationModifierDays: s.duration_modifier_days,
          examples: s.examples || [],
        })),
      });
    }

    // Platforms
    const { data: plats } = await supabase.from('platforms').select('*').eq('user_id', u.id);
    if (plats?.length) {
      useAppStore.setState({ platforms: plats.map((p: any) => ({ id: p.id, name: p.name })) });
    }

    // Showcase images
    const { data: images } = await supabase.from('showcase_images').select('*').eq('user_id', u.id).order('sort_order', { ascending: true });
    if (images) {
      useAppStore.setState({
        showcaseImages: images.map((i: any) => ({
          id: i.id, url: i.url, caption: i.caption, workTypeTag: i.work_type_tag, isNSFW: i.is_nsfw,
        })),
      });
    }

    // Queue cards
    const { data: cards } = await supabase.from('queue_cards').select('*').eq('user_id', u.id);
    if (cards) {
      useAppStore.setState({
        queueCards: cards.map((c: any) => ({
          id: c.id, customerName: c.customer_name, platformId: c.platform_id,
          workTypeId: c.work_type_id, scaleTypeId: c.scale_type_id,
          description: c.description, price: c.price, isCommercial: c.is_commercial,
          isPublic: c.is_public, isNSFW: c.is_nsfw, quantity: c.quantity,
          briefReceived: c.brief_received, paymentStatus: c.payment_status,
          commissionDate: c.commission_date, deadlineDate: c.deadline_date,
          progress: c.progress, notes: c.notes, images: c.images || [],
          createdAt: c.created_at, updatedAt: c.updated_at,
        })),
      });
    }

    // Income
    const { data: income } = await supabase.from('income_entries').select('*').eq('user_id', u.id);
    if (income) {
      useAppStore.setState({
        incomeEntries: income.map((e: any) => ({
          id: e.id, date: e.date, amount: e.amount, source: e.source,
          category: e.category, isFromQueue: e.is_from_queue, queueCardId: e.queue_card_id,
        })),
      });
    }

    // Expenses
    const { data: expenses } = await supabase.from('expense_entries').select('*').eq('user_id', u.id);
    if (expenses) {
      useAppStore.setState({
        expenseEntries: expenses.map((e: any) => ({
          id: e.id, date: e.date, amount: e.amount, category: e.category,
          description: e.description, receipt: e.receipt,
        })),
      });
    }

    // Tax types
    const { data: taxes } = await supabase.from('tax_deduction_types').select('*').eq('user_id', u.id);
    if (taxes) {
      useAppStore.setState({
        taxDeductionTypes: taxes.map((t: any) => ({
          id: t.id, name: t.name, type: t.type, value: t.value, appliesToCategory: t.applies_to_category,
        })),
      });
    }

    // Notifications
    const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', u.id).order('created_at', { ascending: false });
    if (notifs) {
      useAppStore.setState({
        notifications: notifs.map((n: any) => ({
          id: n.id, userId: n.user_id, title: n.title, message: n.message,
          read: n.read, createdAt: n.created_at,
        })),
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole('guest');
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u) {
        setRole('admin');
        syncFromSupabase();
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setRole(u ? 'admin' : 'guest');
      if (u) syncFromSupabase();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, syncFromSupabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
