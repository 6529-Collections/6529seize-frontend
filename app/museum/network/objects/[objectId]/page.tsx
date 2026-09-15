import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getMuseumObjectMetadata } from "@/components/museum/MuseumObjectPage";
import { museumWorkHrefForSourceId } from "@/lib/museum/publication/routes";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";

interface MuseumObjectLegacyRouteProps {
  readonly params: Promise<{ objectId: string }>;
}

export async function generateMetadata({
  params,
}: MuseumObjectLegacyRouteProps): Promise<Metadata> {
  const { objectId } = await params;
  const { publicationState } = await getMuseumPublicationBundle();
  return getMuseumObjectMetadata(objectId, publicationState);
}

export default async function MuseumObjectLegacyRoute({
  params,
}: MuseumObjectLegacyRouteProps) {
  const { objectId } = await params;
  const { publicationState, view } = await getMuseumPublicationBundle();
  if (publicationState.publication === null) notFound();
  const href = museumWorkHrefForSourceId(
    publicationState.publication,
    objectId,
    view
  );
  if (href === null) notFound();
  permanentRedirect(href);
}
