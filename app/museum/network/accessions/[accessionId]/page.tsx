import type { Metadata } from "next";
import {
  getMuseumGiftMetadata,
  MuseumGiftPage,
} from "@/components/museum/MuseumGiftPage";

interface MuseumAccessionLegacyRouteProps {
  readonly params: Promise<{ accessionId: string }>;
}

export async function generateMetadata({
  params,
}: MuseumAccessionLegacyRouteProps): Promise<Metadata> {
  const { accessionId } = await params;
  return getMuseumGiftMetadata(accessionId);
}

export default async function MuseumAccessionLegacyRoute({
  params,
}: MuseumAccessionLegacyRouteProps) {
  const { accessionId } = await params;
  return <MuseumGiftPage accessionId={accessionId} />;
}
