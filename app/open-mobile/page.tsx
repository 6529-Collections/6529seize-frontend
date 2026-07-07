import OpenMobilePageClient from './page.client';
import { getAppMetadata } from '@/components/providers/metadata';
import type { Metadata } from 'next';

export default function OpenMobilePage() {
  return <OpenMobilePageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: 'Open Mobile' });
}
