import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  MuseumObjectPage,
  getMuseumObjectMetadata,
} from "@/components/museum/MuseumObjectPage";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildMuseumWorkPageJsonLd } from "@/lib/structured-data/museum";
import { applyMuseumCollectionSemantics } from "@/lib/museum/publication/collectionSemantics";
import {
  isMuseumCanonicalWorkId,
  museumWorkHref,
} from "@/lib/museum/publication/routes";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";

interface MuseumWorkRouteProps {
  readonly params: Promise<{ workId: string }>;
}

function resolveCanonicalWorkId(
  publication: Awaited<
    ReturnType<typeof getMuseumPublicationBundle>
  >["publicationState"]["publication"],
  requestedId: string
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
  return null;
}

export async function generateMetadata({
  params,
}: MuseumWorkRouteProps): Promise<Metadata> {
  const { workId } = await params;
  const { publicationState } = await getMuseumPublicationBundle();
  const canonicalId = resolveCanonicalWorkId(
    publicationState.publication,
    workId
  );
  return getMuseumObjectMetadata(canonicalId ?? workId, publicationState);
}

export default async function MuseumWorkRoute({
  params,
}: MuseumWorkRouteProps) {
  const { workId } = await params;
  const { publicationState, view } = await getMuseumPublicationBundle();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const publication = applyMuseumCollectionSemantics(
    publicationState.publication
  );
  const canonicalId = resolveCanonicalWorkId(publication, workId);
  if (canonicalId === null) notFound();
  if (canonicalId !== workId) {
    permanentRedirect(museumWorkHref(canonicalId));
  }
  const work = publication.works?.find(
    (candidate) => candidate.id === canonicalId
  );
  return (
    <>
      {work === undefined ? null : (
        <JsonLdScript
          data={buildMuseumWorkPageJsonLd({
            work,
            path: museumWorkHref(canonicalId),
          })}
        />
      )}
      <MuseumObjectPage
        objectId={canonicalId}
        publication={publication}
        view={view}
      />
    </>
  );
}
