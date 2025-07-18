import ConsolidationMappingToolPageClient from './page.client';
import { getAppMetadata } from '@/components/providers/metadata';
import type { Metadata } from 'next';

export default function ConsolidationMappingToolPage() {
  return <ConsolidationMappingToolPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: 'Consolidation Mapping Tool', description: 'Tools' });
}
