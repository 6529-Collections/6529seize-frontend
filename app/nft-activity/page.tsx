import { getAppMetadata } from '@/components/providers/metadata';

import NFTActivityPageClient from './page.client';

import type { Metadata } from 'next';

export default function NFTActivityPage() {
  return <NFTActivityPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: 'NFT Activity', description: 'Network' });
}
