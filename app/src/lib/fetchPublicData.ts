import { createClient } from './supabase/client';

export async function fetchPublicData(slug: string) {
  const supabase = createClient();

  // 1. Find user by slug
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (pErr || !profile) return null;

  const userId = profile.id;

  // 2. Fetch all other public info
  const [wt, sc, qc, img, plat] = await Promise.all([
    supabase.from('work_types').select('*').eq('user_id', userId).eq('visible', true),
    supabase.from('scale_types').select('*').eq('user_id', userId),
    supabase.from('queue_cards').select('*').eq('user_id', userId).eq('is_public', true),
    supabase.from('showcase_images').select('*').eq('user_id', userId),
    supabase.from('platforms').select('*').eq('user_id', userId)
  ]);

  return {
    profile: {
      displayName: profile.display_name,
      slug: profile.slug,
      avatar: profile.avatar,
      bio: profile.bio,
      contactChannels: profile.contact_channels || [],
      tos: profile.tos || '',
      commissionStatus: profile.commission_status || 'open',
    },
    settings: {
      currency: '฿',
      ...profile.app_settings,
    },
    queueCards: (qc.data || []).map((c: any) => ({
      id: c.id,
      customerName: c.customer_name,
      platformId: c.platform_id,
      workTypeId: c.work_type_id,
      scaleTypeId: c.scale_type_id,
      description: c.description || '',
      price: Number(c.price || 0),
      isCommercial: c.is_commercial,
      isPublic: c.is_public,
      isNSFW: c.is_nsfw,
      quantity: c.quantity || 1,
      briefReceived: c.brief_received,
      paymentStatus: c.payment_status,
      commissionDate: c.commission_date,
      deadlineDate: c.deadline_date,
      progress: c.progress,
      notes: c.notes || '',
      images: c.images || [],
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    })),
    workTypes: (wt.data || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      basePrice: Number(w.base_price || 0),
      estimatedDurationDays: w.estimated_duration_days || 1,
      visible: w.visible,
      examples: w.examples || [],
    })),
    scaleTypes: (sc.data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      priceModifier: Number(s.price_modifier || 0),
      priceModifierType: s.price_modifier_type,
      durationModifierDays: s.duration_modifier_days || 0,
      examples: s.examples || [],
    })),
    showcaseImages: (img.data || []).map((i: any) => ({
      id: i.id,
      url: i.url,
      caption: i.caption,
      isNSFW: i.is_nsfw,
    })),
    platforms: (plat.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
    })),
    role: 'guest'
  };
}
