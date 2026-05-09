'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CommissionPage from '../../commission/page';
import { Loader2 } from 'lucide-react';
import { fetchPublicData } from '@/lib/fetchPublicData';

export default function GuestCommissionPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [targetData, setTargetData] = useState<any>(null);

  useEffect(() => {
    async function init() {
      if (!slug) return;
      const data = await fetchPublicData(slug as string);
      setTargetData(data);
      setLoading(false);
    }
    init();
  }, [slug]);

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" size={48} color="var(--accent)" />
    </div>
  );

  if (!targetData) return <div>User not found</div>;

  return <CommissionPage externalData={targetData} />;
}
