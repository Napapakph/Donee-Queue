'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import HomePage from '../page';
import { useAppStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';

export default function GuestProfilePage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  
  // We'll temporarily store the viewed user's data in local state 
  // and pass it to a modified HomePage or use a specialized view.
  const [targetData, setTargetData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;
      
      try {
        // 1. Find user by slug
        const { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (pErr || !profile) {
          setError('User not found');
          setLoading(false);
          return;
        }

        const userId = profile.id;

        // 2. Fetch all other public info
        const [wt, sc, qc] = await Promise.all([
          supabase.from('work_types').select('*').eq('user_id', userId).eq('visible', true),
          supabase.from('scale_types').select('*').eq('user_id', userId),
          supabase.from('queue_cards').select('*').eq('user_id', userId).eq('is_public', true)
        ]);

        setTargetData({
          profile: {
            displayName: profile.display_name,
            slug: profile.slug,
            avatar: profile.avatar,
            bio: profile.bio,
            contactChannels: profile.contact_channels || [],
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
          role: 'guest'
        });
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" size={48} color="var(--accent)" />
    </div>
  );

  if (error || !targetData) return (
    <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>404</h1>
      <p style={{ color: 'var(--text-secondary)' }}>{error || 'Profile not found'}</p>
    </div>
  );

  // We need to pass this data to HomePage
  // I'll modify HomePage to accept optional external data
  return <HomePage externalData={targetData} slug={slug as string} />;
}
