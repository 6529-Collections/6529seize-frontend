import type { Metadata } from "next";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumDirectoryWorksPage } from "@/components/museum/directory/MuseumDirectoryPages";
import { buildMuseumDirectoryModel } from "@/components/museum/directory/MuseumDirectoryData";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { museumDirectoryPublication } from "@/lib/museum/publication/collectionSemantics";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.works.title"),
    description: t(DEFAULT_LOCALE, "museum.network.works.description"),
  }),
  alternates: { canonical: "/museum/network/works" },
};

export default async function MuseumWorksPage() {
  const { publicationState } = await getMuseumPublicationBundle();
  const publication = publicationState.publication;
  if (publication === null) return <MuseumPublicationUnavailable />;

  const model = buildMuseumDirectoryModel(
    museumDirectoryPublication(publication)
  );
  if (model === null || model.works.length === 0) {
    return <MuseumPublicationUnavailable />;
  }

  return <MuseumDirectoryWorksPage model={model} />;
}
