import BuidlPageClient from './page.client';
import { getAppMetadata } from '@/components/providers/metadata';
import type { Metadata } from 'next';

export default function BuidlPage() {
  return <BuidlPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: 'BUIDL' });
}
