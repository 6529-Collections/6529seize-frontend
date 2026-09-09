import type { Metadata } from "next";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumResearchLanding } from "@/components/museum/research/MuseumResearchLanding";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import {
  buildMuseumResearchBrowseGroups,
  buildMuseumResearchIndex,
  MUSEUM_RESEARCH_GROUPS,
  researchEditorialEntries,
} from "./catalog";
import { buildMuseumResearchLandingCards } from "./cards";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.research.indexTitle"),
    description: t(DEFAULT_LOCALE, "museum.network.research.indexDescription"),
  }),
  alternates: { canonical: "/museum/network/research" },
};

export default async function MuseumResearchPage() {
  const publication = (await getMuseumPublicationState()).publication;
  if (publication === null) return <MuseumPublicationUnavailable />;

  const entries = buildMuseumResearchIndex(publication);
  const browseGroups = buildMuseumResearchBrowseGroups(
    researchEditorialEntries(entries)
  );
  if (browseGroups.length !== MUSEUM_RESEARCH_GROUPS.length) {
    return <MuseumPublicationUnavailable />;
  }

  const cards = buildMuseumResearchLandingCards(publication, entries);
  if (cards === undefined) return <MuseumPublicationUnavailable />;

  return (
    <MuseumResearchLanding
      eyebrow={t(DEFAULT_LOCALE, "museum.network.research.indexEyebrow")}
      title={t(DEFAULT_LOCALE, "museum.network.research.indexTitle")}
      description={t(
        DEFAULT_LOCALE,
        "museum.network.research.indexDescription"
      )}
      sections={[
        {
          id: "acquisition-scholarship",
          eyebrow: t(
            DEFAULT_LOCALE,
            "museum.network.research.acquisitionEyebrow"
          ),
          title: t(DEFAULT_LOCALE, "museum.network.research.acquisitionTitle"),
          description: t(
            DEFAULT_LOCALE,
            "museum.network.research.acquisitionDescription"
          ),
          entries: cards.acquisitionCards,
          columns: 2,
        },
        {
          id: "artists",
          eyebrow: t(DEFAULT_LOCALE, "museum.network.research.artistEyebrow"),
          title: t(DEFAULT_LOCALE, "museum.network.research.artistTitle"),
          description: t(
            DEFAULT_LOCALE,
            "museum.network.research.artistDescription"
          ),
          entries: cards.artistCards,
          columns: 3,
        },
        {
          id: "works",
          eyebrow: t(DEFAULT_LOCALE, "museum.network.research.workEyebrow"),
          title: t(DEFAULT_LOCALE, "museum.network.research.workTitle"),
          description: t(
            DEFAULT_LOCALE,
            "museum.network.research.workDescription"
          ),
          entries: cards.workCards,
          columns: 3,
        },
        {
          id: "contexts",
          eyebrow: t(DEFAULT_LOCALE, "museum.network.research.contextEyebrow"),
          title: t(DEFAULT_LOCALE, "museum.network.research.contextTitle"),
          description: t(
            DEFAULT_LOCALE,
            "museum.network.research.contextDescription"
          ),
          entries: cards.contextCards,
          columns: 2,
        },
        {
          id: "digital-art-stewardship",
          eyebrow: t(
            DEFAULT_LOCALE,
            "museum.network.research.sectionEyebrow.stewardship"
          ),
          title: t(
            DEFAULT_LOCALE,
            "museum.network.research.digitalArtStewardship"
          ),
          description: t(
            DEFAULT_LOCALE,
            "museum.network.research.digitalArtStewardshipDescription"
          ),
          entries: cards.stewardshipCards,
          columns: 2,
        },
        {
          id: "museum-practice",
          eyebrow: t(DEFAULT_LOCALE, "museum.network.research.practiceEyebrow"),
          title: t(DEFAULT_LOCALE, "museum.network.research.practiceTitle"),
          description: t(
            DEFAULT_LOCALE,
            "museum.network.research.practiceDescription"
          ),
          entries: cards.practiceCards,
          columns: 2,
        },
      ]}
      browseGroups={browseGroups}
      browseTitle={t(DEFAULT_LOCALE, "museum.network.research.browseTitle")}
      browseDescription={t(
        DEFAULT_LOCALE,
        "museum.network.research.browseDescription"
      )}
      browseOpenLabel={t(
        DEFAULT_LOCALE,
        "museum.network.research.browseOpenLabel"
      )}
      browseLabels={{
        eyebrow: t(DEFAULT_LOCALE, "museum.network.research.referenceEyebrow"),
        searchLabel: t(DEFAULT_LOCALE, "museum.network.research.searchLabel"),
        searchPlaceholder: t(
          DEFAULT_LOCALE,
          "museum.network.research.searchPlaceholder"
        ),
        filterLabel: t(DEFAULT_LOCALE, "museum.network.research.filterLabel"),
        allSubjectsLabel: t(
          DEFAULT_LOCALE,
          "museum.network.research.allSubjectsLabel"
        ),
        noResultsLabel: t(
          DEFAULT_LOCALE,
          "museum.network.research.noResultsLabel"
        ),
        resultCountOne: t(
          DEFAULT_LOCALE,
          "museum.network.research.resultCountOne",
          { count: "{count}" }
        ),
        resultCountOther: t(
          DEFAULT_LOCALE,
          "museum.network.research.resultCountOther",
          { count: "{count}" }
        ),
        sourceLabel: t(DEFAULT_LOCALE, "museum.network.research.sourceLabel"),
        opensInNewTab: t(
          DEFAULT_LOCALE,
          "museum.network.research.opensInNewTab"
        ),
      }}
    />
  );
}
