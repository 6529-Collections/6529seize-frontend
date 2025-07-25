import MemeLabPageClient from './page.client';
import { getAppMetadata } from '@/components/providers/metadata';
import type { Metadata } from 'next';

export default function MemeLabPage() {
  return <MemeLabPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: 'Meme Lab',
    description: 'Collections',
    ogImage: `${process.env.BASE_ENDPOINT}/meme-lab.jpg`,
  });
}
