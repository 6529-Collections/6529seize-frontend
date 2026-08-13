import type { Metadata } from "next";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumDirectoryArtistsPage } from "@/components/museum/directory/MuseumDirectoryPages";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { buildMuseumDirectoryModel } from "@/components/museum/directory/MuseumDirectoryData";
import { museumDirectoryPublication } from "@/lib/museum/publication/collectionSemantics";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.artists.title"),
    description: t(DEFAULT_LOCALE, "museum.network.artists.description"),
  }),
  alternates: { canonical: "/museum/network/artists" },
};

export default async function MuseumArtistsPage() {
  const { publicationState } = await getMuseumPublicationBundle();
  const publication = publicationState.publication;
  if (publication === null) return <MuseumPublicationUnavailable />;

  const model = buildMuseumDirectoryModel(
    museumDirectoryPublication(publication)
  );
  if (model === null || model.artists.length === 0) {
    return <MuseumPublicationUnavailable />;
  }

  return <MuseumDirectoryArtistsPage model={model} />;
}
