import type { Metadata } from "next";
import {
  getMuseumGiftMetadata,
  MuseumGiftPage,
} from "@/components/museum/MuseumGiftPage";

interface MuseumGiftRouteProps {
  readonly params: Promise<{ accessionId: string }>;
}

export async function generateMetadata({
  params,
}: MuseumGiftRouteProps): Promise<Metadata> {
  const { accessionId } = await params;
  return getMuseumGiftMetadata(accessionId);
}

export default async function MuseumGiftRoute({
  params,
}: MuseumGiftRouteProps) {
  const { accessionId } = await params;
  return <MuseumGiftPage accessionId={accessionId} />;
}
