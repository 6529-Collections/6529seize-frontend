import type { Metadata } from "next";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import {
  buildMuseumAcquisitionProgramLandingRecords,
  MuseumAcquisitionProgramsLandingPage,
} from "@/components/museum/acquisition/MuseumAcquisitionProgramsLanding";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { buildMuseumAcquisitionIndex } from "@/lib/museum/publication/ia";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.acquisitionPrograms.title"),
    description: t(
      DEFAULT_LOCALE,
      "museum.network.acquisitionPrograms.description"
    ),
  }),
  alternates: { canonical: "/museum/network/acquisition-programs" },
};

export default async function MuseumAcquisitionProgramsPage() {
  const { publicationState, view } = await getMuseumPublicationBundle();
  const publication = publicationState.publication;
  if (
    publication?.acquisitionPrograms === undefined ||
    publication.works === undefined
  ) {
    return <MuseumPublicationUnavailable />;
  }

  const acquisitions = buildMuseumAcquisitionIndex(publication, view);
  const records = buildMuseumAcquisitionProgramLandingRecords(
    publication,
    publication.acquisitionPrograms,
    acquisitions,
    view
  );
  if (records.length === 0) return <MuseumPublicationUnavailable />;
  return <MuseumAcquisitionProgramsLandingPage records={records} />;
}
