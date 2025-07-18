import GasPageClient from './page.client';
import { getAppMetadata } from '@/components/providers/metadata';
import type { Metadata } from 'next';

export default function GasPage() {
  return <GasPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: 'Meme Gas', description: 'Tools' });
}
