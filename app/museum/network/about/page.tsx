import type { Metadata } from "next";
import { MuseumNetworkProposition } from "@/components/museum/MuseumNetworkProposition";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

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
  const mission = publicationState.publication.documents.find(
    (document) => document.kind === "founding_principles"
  );
  const openMuseum = publicationState.publication.documents.find(
    (document) => document.kind === "open_museum_statement"
  );
  const transition = publicationState.publication.documents.find(
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
    publicationState.publication.identity.commit,
    mission.sourcePath
  );
  if (missionSourceUrl === null) {
    return <MuseumPublicationUnavailable />;
  }

  return (
    <MuseumNetworkProposition
      commit={publicationState.publication.identity.commit}
      missionSourceUrl={missionSourceUrl}
      openMuseum={openMuseum}
      transition={transition}
    />
  );
}
