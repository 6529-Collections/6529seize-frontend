import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getMuseumGiftMetadata,
} from "@/components/museum/MuseumGiftPage";
import { museumAcquisitionHrefForLegacyRoute } from "@/lib/museum/publication/routes";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";

interface MuseumGiftRouteProps {
  readonly params: Promise<{ accessionId: string }>;
}

export async function generateMetadata({
  params,
}: MuseumGiftRouteProps): Promise<Metadata> {
  const { accessionId } = await params;
  const metadata = getMuseumGiftMetadata(accessionId);
  const { publicationState } = await getMuseumPublicationBundle();
  const href =
    publicationState.publication === null
      ? null
      : museumAcquisitionHrefForLegacyRoute(
          publicationState.publication,
          accessionId,
          "/museum/network/gifts/"
        );
  return href === null
    ? metadata
    : { ...metadata, alternates: { canonical: href } };
}

export default async function MuseumGiftRoute({
  params,
}: MuseumGiftRouteProps) {
  const { accessionId } = await params;
  const { publicationState } = await getMuseumPublicationBundle();
  if (publicationState.publication === null) notFound();
  const href = museumAcquisitionHrefForLegacyRoute(
    publicationState.publication,
    accessionId,
    "/museum/network/gifts/"
  );
  if (href === null) notFound();
  permanentRedirect(href);
}
