import { getAppMetadata } from '@/components/providers/metadata';

import BuidlPageClient from './page.client';

import type { Metadata } from 'next';

export default function BuidlPage() {
  return <BuidlPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: 'BUIDL' });
}
