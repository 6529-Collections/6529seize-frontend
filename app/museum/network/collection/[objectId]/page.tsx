import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getMuseumObjectMetadata,
} from "@/components/museum/MuseumObjectPage";
import { museumCollectionWorkHrefForSourceId } from "@/lib/museum/publication/ia";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";

interface MuseumObjectRouteProps {
  readonly params: Promise<{ objectId: string }>;
}

export async function generateMetadata({
  params,
}: MuseumObjectRouteProps): Promise<Metadata> {
  const { objectId } = await params;
  const [metadata, { publicationState, view }] = await Promise.all([
    getMuseumObjectMetadata(objectId),
    getMuseumPublicationBundle(),
  ]);
  const href =
    publicationState.publication === null
      ? null
      : museumCollectionWorkHrefForSourceId(publicationState.publication, objectId, view);
  return {
    ...metadata,
    ...(href === null ? {} : { alternates: { canonical: href } }),
  };
}

export default async function MuseumCollectionObjectRoute({
  params,
}: MuseumObjectRouteProps) {
  const { objectId } = await params;
  const { publicationState, view } = await getMuseumPublicationBundle();
  if (publicationState.publication === null) notFound();
  const href = museumCollectionWorkHrefForSourceId(
    publicationState.publication,
    objectId,
    view
  );
  if (href === null) notFound();
  permanentRedirect(href);
}
