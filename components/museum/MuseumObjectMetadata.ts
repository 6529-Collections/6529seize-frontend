import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getCaseyArtwork } from "@/lib/museum/casey";
import { getMuseumView } from "@/lib/museum/normalize";
import { museumSlugMatches } from "@/lib/museum/presentation";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import type {
  MuseumPublication,
  MuseumPublicationLoadState,
} from "@/lib/museum/publication/types";
import type { Metadata } from "next";

export async function getMuseumObjectMetadata(
  objectId: string,
  suppliedPublicationState?: MuseumPublicationLoadState
): Promise<Metadata> {
  const publicationState =
    suppliedPublicationState ?? (await getMuseumPublicationState());
  if (publicationState.publication === null) {
    return getAppMetadata(
      {
        title: t(DEFAULT_LOCALE, "museum.network.objects.title"),
        description: t(DEFAULT_LOCALE, "museum.network.objects.description"),
      },
      { robots: { index: false, follow: true } }
    );
  }

  const publication = publicationState.publication;
  const workEntities = publication.entityGraph?.entities.filter(
    (entity) => entity.entityType === "WORK"
  );
  const workEntity =
    workEntities?.find((entity) => entity.id === objectId) ??
    workEntities?.find((entity) => entity.sourceRecordIds.includes(objectId));
  const canonicalEntity =
    workEntity?.entityStatus === "published" &&
    workEntity.pageExposure === "canonical_page" &&
    workEntity.canonicalRoute !== null
      ? workEntity
      : undefined;
  const metadataOptions = {
    canonicalPath: canonicalEntity?.canonicalRoute ?? undefined,
    robots: { index: canonicalEntity !== undefined, follow: true },
  };
  const artwork =
    [objectId, ...(canonicalEntity?.sourceRecordIds ?? [])]
      .map((candidateId) => getCaseyArtwork(candidateId))
      .find((candidate) => candidate !== null) ?? null;
  if (artwork !== null) {
    const artistName = getMuseumWorkArtistName(
      publication,
      canonicalEntity?.id
    );
    const creatorLabel = artistName ? ` by ${artistName}` : "";
    return getAppMetadata(
      {
        title: `${artwork.title}${creatorLabel} — 6529 Network Museum`,
        description: artwork.visualDescription,
      },
      metadataOptions
    );
  }

  const publicWork = publication.works?.find(
    (work) => work.id === (canonicalEntity?.id ?? objectId)
  );
  if (publicWork !== undefined) {
    const artistName = getMuseumWorkArtistName(
      publication,
      canonicalEntity?.id
    );
    const title = artistName
      ? `${publicWork.title} by ${artistName} — 6529 Network Museum`
      : `${publicWork.title} — 6529 Network Museum`;
    return getAppMetadata(
      {
        title,
        description: publicWork.title,
      },
      metadataOptions
    );
  }

  if (publication.entityGraph !== undefined) {
    return getGenericMuseumObjectMetadata();
  }

  const view = await getMuseumView();
  const outcome = view.objects.find((item) =>
    museumSlugMatches(item.objectId, objectId)
  );
  const description =
    outcome === undefined || outcome.scope.trim().length === 0
      ? t(DEFAULT_LOCALE, "museum.network.objects.description")
      : outcome.scope;
  return getAppMetadata(
    {
      title:
        outcome?.title ?? t(DEFAULT_LOCALE, "museum.network.objects.title"),
      description,
    },
    { robots: { index: false, follow: true } }
  );
}

function getGenericMuseumObjectMetadata(): Metadata {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "museum.network.objects.title"),
      description: t(DEFAULT_LOCALE, "museum.network.objects.description"),
    },
    { robots: { index: false, follow: true } }
  );
}

function getMuseumWorkArtistName(
  publication: MuseumPublication,
  workEntityId: string | undefined
): string | undefined {
  if (!workEntityId || !publication.entityGraph) return undefined;
  const relation = publication.entityGraph.relations.find(
    (candidate) =>
      candidate.relationType === "ARTIST_CREATES_WORK" &&
      candidate.targetEntityId === workEntityId
  );
  if (!relation) return undefined;
  return publication.entityGraph.entities.find(
    (entity) =>
      entity.id === relation.sourceEntityId &&
      entity.entityStatus === "published"
  )?.label;
}
