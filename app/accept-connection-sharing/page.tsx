import AcceptConnectionSharingPageClient, { AcceptConnectionSharing } from './page.client';
import { getAppMetadata } from '@/components/providers/metadata';
import type { Metadata } from 'next';

export default function AcceptConnectionSharingPage() {
  return <AcceptConnectionSharingPageClient />;
}

export { AcceptConnectionSharing };

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: 'Accept Connection Sharing' });
}
