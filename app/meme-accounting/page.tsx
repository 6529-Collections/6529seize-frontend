import MemeAccountingPageClient from './page.client';
import { getAppMetadata } from '@/components/providers/metadata';
import type { Metadata } from 'next';

export default function MemeAccountingPage() {
  return <MemeAccountingPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: 'Meme Accounting', description: 'Tools' });
}
