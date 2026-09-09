import type { Metadata } from "next";
import { MuseumNetworkProposition } from "@/components/museum/MuseumNetworkProposition";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication";
import {
  isMuseumPermanentCollectionWork,
  MUSEUM_MAGNUM_ACQUISITION_ID,
} from "@/lib/museum/publication/collectionSemantics";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import type { MuseumPublication } from "@/lib/museum/publication/types";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.proposition.title"),
    description: t(DEFAULT_LOCALE, "museum.network.proposition.metadata"),
  }),
  alternates: { canonical: "/museum/network/about" },
};

export default async function MuseumAboutPage() {
  const publicationState = await getMuseumPublicationState();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const publication = publicationState.publication;
  const mission = publication.documents.find(
    (document) => document.kind === "founding_principles"
  );
  const openMuseum = publication.documents.find(
    (document) => document.kind === "open_museum_statement"
  );
  const transition = publication.documents.find(
    (document) => document.kind === "onchain_transition"
  );
  if (
    mission === undefined ||
    openMuseum === undefined ||
    transition === undefined
  ) {
    return <MuseumPublicationUnavailable />;
  }
  const missionSourceUrl = buildImmutableMuseumBlobUrl(
    publication.identity.commit,
    mission.sourcePath
  );
  if (missionSourceUrl === null) {
    return <MuseumPublicationUnavailable />;
  }

  return (
    <MuseumNetworkProposition
      commit={publication.identity.commit}
      missionSourceUrl={missionSourceUrl}
      openMuseum={openMuseum}
      transition={transition}
      featuredWorks={selectAboutWorks(publication)}
    />
  );
}

function selectAboutWorks(publication: MuseumPublication) {
  const works = publication.works ?? [];
  const withMedia = works.filter(
    (work) =>
      selectMuseumStillMedia(work.media) !== undefined ||
      work.presentationMedia?.[0] !== undefined
  );
  const collectionWorks = withMedia.filter(isMuseumPermanentCollectionWork);
  const selected = new Set<string>();
  const result: {
    readonly work: (typeof collectionWorks)[number];
    readonly artistName?: string;
  }[] = [];
  const add = (work: (typeof collectionWorks)[number] | undefined) => {
    if (work === undefined || selected.has(work.id)) return;
    selected.add(work.id);
    const artistName = publication.artists.find(
      (artist) => artist.id === work.artistId
    )?.preferredName;
    result.push({
      work,
      ...(artistName === undefined ? {} : { artistName }),
    });
  };
  const caseyArtistId = publication.artists.find(
    (artist) => artist.slug === "casey-reas"
  )?.id;

  if (caseyArtistId !== undefined) {
    add(collectionWorks.find((work) => work.artistId === caseyArtistId));
  }
  add(
    collectionWorks.find((work) =>
      work.acquisitionIds.includes(MUSEUM_MAGNUM_ACQUISITION_ID)
    )
  );
  for (const work of collectionWorks) {
    if (result.length >= 3) break;
    add(work);
  }
  return result;
}
