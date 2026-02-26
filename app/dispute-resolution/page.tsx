import { getAppMetadata } from '@/components/providers/metadata';

import DisputeResolutionPageClient from './page.client';

import type { Metadata } from 'next';

export default function DisputeResolutionPage() {
  return <DisputeResolutionPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: 'Dispute Resolution' });
}
