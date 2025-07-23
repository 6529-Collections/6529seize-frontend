import MemeLabPageClient from './page.client';
import { getSharedAppServerSideProps } from '@/components/the-memes/MemeShared';
import { MEMELAB_CONTRACT } from '@/constants';
import type { Metadata } from 'next';

export default async function MemeLabPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus: string }>;
}) {
  const { id } = await params;
  await searchParams; // ensure awaited
  return <MemeLabPageClient nftId={id} />;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { focus } = await searchParams;
  return getSharedAppServerSideProps(MEMELAB_CONTRACT, id, focus);
}
