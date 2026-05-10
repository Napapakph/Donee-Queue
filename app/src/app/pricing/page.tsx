import PricingPage from '@/components/pricing/PricingPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing System — Donee Queue',
  description: 'Manage your commission categories and pricing tiers.',
};

export default function Page() {
  return <PricingPage />;
}
