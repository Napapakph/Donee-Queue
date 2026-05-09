'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import HomePage from '../page';
import { Loader2 } from 'lucide-react';
import { fetchPublicData } from '@/lib/fetchPublicData';

export default function GuestProfilePage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetData, setTargetData] = useState<any>(null);

  useEffect(() => {
    async function init() {
      if (!slug) return;
      const data = await fetchPublicData(slug as string);
      if (!data) setError('Profile not found');
      else setTargetData(data);
      setLoading(false);
    }
    init();
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

  return <HomePage externalData={targetData} slug={slug as string} />;
}
