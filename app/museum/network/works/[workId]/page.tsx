import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { MuseumObjectPage, getMuseumObjectMetadata } from "@/components/museum/MuseumObjectPage";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import {
  isMuseumCanonicalWorkId,
  museumWorkHref,
} from "@/lib/museum/publication/routes";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import type { MuseumView } from "@/lib/museum/types";

interface MuseumWorkRouteProps {
  readonly params: Promise<{ workId: string }>;
}

function resolveCanonicalWorkId(
  publication: Awaited<ReturnType<typeof getMuseumPublicationBundle>>["publicationState"]["publication"],
  requestedId: string,
  view: MuseumView | null = null
): string | null {
  if (publication === null) return null;
  if (publication.works?.some((work) => work.id === requestedId)) {
    return requestedId;
  }
  const alias = publication.workAliases?.find(
    (candidate) => candidate.sourceObjectId === requestedId
  );
  if (alias !== undefined && isMuseumCanonicalWorkId(alias.workId)) {
    return alias.workId;
  }
  if (publication.works !== undefined) return null;
  const isLegacyWork =
    publication.artworks.some((artwork) => artwork.id === requestedId) ||
    view?.objects.some((object) => object.objectId === requestedId) === true;
  if (isLegacyWork || isMuseumCanonicalWorkId(requestedId)) {
    return requestedId;
  }
  return null;
}

export async function generateMetadata({
  params,
}: MuseumWorkRouteProps): Promise<Metadata> {
  const { workId } = await params;
  const { publicationState, view } = await getMuseumPublicationBundle();
  const canonicalId = resolveCanonicalWorkId(
    publicationState.publication,
    workId,
    view
  );
  const metadata = await getMuseumObjectMetadata(canonicalId ?? workId);
  return {
    ...metadata,
    ...(canonicalId === null
      ? {}
      : { alternates: { canonical: museumWorkHref(canonicalId) } }),
  };
}

export default async function MuseumWorkRoute({
  params,
}: MuseumWorkRouteProps) {
  const { workId } = await params;
  const { publicationState, view } = await getMuseumPublicationBundle();
  const publication = publicationState.publication;
  if (publication === null) return <MuseumPublicationUnavailable />;
  const canonicalId = resolveCanonicalWorkId(publication, workId, view);
  if (canonicalId === null) notFound();
  if (canonicalId !== workId) {
    permanentRedirect(museumWorkHref(canonicalId));
  }
  return (
    <MuseumObjectPage
      objectId={canonicalId}
      publication={publication}
      view={view}
    />
  );
}
