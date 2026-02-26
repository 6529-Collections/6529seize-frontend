import { getAppMetadata } from '@/components/providers/metadata';

import DelegationMappingToolPageClient from './page.client';

import type { Metadata } from 'next';

export default function DelegationMappingToolPage() {
  return <DelegationMappingToolPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: 'Delegation Mapping Tool', description: 'Tools' });
}
