import type { Metadata } from "next";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import {
  buildMuseumAcquisitionLandingRecords,
  MuseumAcquisitionLandingPage,
} from "@/components/museum/acquisition/MuseumAcquisitionLanding";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { buildMuseumAcquisitionIndex } from "@/lib/museum/publication/ia";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.acquisitions.title"),
    description: t(DEFAULT_LOCALE, "museum.network.acquisitions.description"),
  }),
  alternates: { canonical: "/museum/network/acquisitions" },
};

export default async function MuseumAcquisitionsPage() {
  const { publicationState, view } = await getMuseumPublicationBundle();
  const publication = publicationState.publication;
  if (
    publication?.curatedAcquisitions === undefined ||
    publication.works === undefined
  ) {
    return <MuseumPublicationUnavailable />;
  }

  const acquisitions = buildMuseumAcquisitionIndex(publication, view);
  const records = buildMuseumAcquisitionLandingRecords(
    publication,
    acquisitions,
    view
  );
  if (records.length === 0) return <MuseumPublicationUnavailable />;
  return <MuseumAcquisitionLandingPage records={records} />;
}
