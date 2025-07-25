import LabCollectionClient from './page.client';
import { getAppMetadata } from '@/components/providers/metadata';
import type { Metadata } from 'next';

export default async function MemeLabCollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const name = collection.replaceAll('-', ' ');
  return <LabCollectionClient name={name} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection } = await params;
  const name = collection.replaceAll('-', ' ');
  return getAppMetadata({ title: name, description: 'Meme Lab' });
}
