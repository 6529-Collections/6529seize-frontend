import NFTActivityPageClient from './page.client';
import { getAppMetadata } from '@/components/providers/metadata';
import type { Metadata } from 'next';

export default function NFTActivityPage() {
  return <NFTActivityPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: 'NFT Activity', description: 'Network' });
}
