import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { MuseumResearchDocumentCardEntry } from "@/components/museum/research/MuseumResearchDocumentCard";
import {
  MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS,
  MUSEUM_RESEARCH_ARTIST_ASSIGNMENTS,
  MUSEUM_RESEARCH_CONTEXT_ENTITY_IDS,
  MUSEUM_RESEARCH_WORK_ASSIGNMENTS,
  type MuseumResearchIndexEntry,
} from "./catalog";
import {
  museumResearchEditorialMedia,
  resolveExactWorkMediaById,
} from "./media";
import {
  museumAcquisitionProgramHref,
  museumArtistHref,
  museumOrganizationHref,
  museumWorkHref,
} from "@/lib/museum/publication/routes";
import type {
  MuseumMedia,
  MuseumPublication,
} from "@/lib/museum/publication/types";
import { VERA_MOLNAR_PUBLIC_PATHS } from "@/lib/museum/publication/veraMolnarPublication";

const MUSEUM_PRACTICE_STUDY_KEY =
  "museum.network.research.museumPracticeStudy" satisfies MessageKey;
const DIGITAL_STEWARDSHIP_STUDY_KEY =
  "museum.network.research.digitalStewardshipStudy" satisfies MessageKey;
const RESEARCH_READ_GUIDE_KEY =
  "museum.network.research.readGuide" satisfies MessageKey;

function museumDiagram({
  id,
  file,
  altText,
  creditLine,
}: {
  readonly id: string;
  readonly file: string;
  readonly altText: string;
  readonly creditLine: string;
}): MuseumMedia {
  return museumResearchEditorialMedia({
    id,
    file,
    altText,
    creditLine,
    licenseLabel: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  });
}

function acquisitionResearchCard({
  entries,
  publication,
  researchId,
  publicTitle,
  subjectLabel,
}: {
  readonly entries: readonly MuseumResearchIndexEntry[];
  readonly publication: MuseumPublication;
  readonly researchId: string;
  readonly publicTitle: string;
  readonly subjectLabel: string;
}): MuseumResearchDocumentCardEntry | undefined {
  const assignment = MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS[researchId];
  if (assignment === undefined) return undefined;
  const entry = entries.find(
    (candidate) => candidate.typed && candidate.id === assignment.researchId
  );
  if (entry === undefined) return undefined;
  const workMedia = resolveExactWorkMediaById(publication, assignment.workId);
  const mediaQualifier =
    researchId === "6529NM-RP-0003"
      ? t(DEFAULT_LOCALE, "museum.network.research.magnumDisplayCaptionSuffix")
      : undefined;
  return {
    ...entry,
    title: publicTitle,
    kindLabel: t(DEFAULT_LOCALE, "museum.network.research.acquisitionEssay"),
    subjectLabels: [subjectLabel],
    statusLabel: t(DEFAULT_LOCALE, assignment.statusKey),
    description: t(DEFAULT_LOCALE, assignment.descriptionKey),
    actionLabel: t(DEFAULT_LOCALE, "museum.network.research.readEssay"),
    ...(mediaQualifier === undefined ? {} : { mediaQualifier }),
    ...(workMedia.media === undefined ? {} : { media: workMedia.media }),
    ...(workMedia.mediaSrcSet === undefined
      ? {}
      : { mediaSrcSet: workMedia.mediaSrcSet }),
  };
}

function veraAcquisitionResearchCard(
  publication: MuseumPublication,
  entries: readonly MuseumResearchIndexEntry[]
): MuseumResearchDocumentCardEntry | undefined {
  const entry = entries.find(
    (candidate) =>
      candidate.sourcePath === VERA_MOLNAR_PUBLIC_PATHS.acquisitionEssay
  );
  if (entry === undefined) return undefined;
  const workMedia = resolveExactWorkMediaById(publication, "6529NM-W-0029");
  return {
    ...entry,
    title: "A Gift of Themes and Variations #210",
    kindLabel: t(DEFAULT_LOCALE, "museum.network.research.acquisitionEssay"),
    subjectLabels: ["Vera Molnár", "Martin Grasser"],
    statusLabel: t(
      DEFAULT_LOCALE,
      "museum.network.research.permanentCollection"
    ),
    description: t(
      DEFAULT_LOCALE,
      "museum.network.research.veraGiftDescription"
    ),
    actionLabel: t(DEFAULT_LOCALE, "museum.network.research.readEssay"),
    ...(workMedia.media === undefined ? {} : { media: workMedia.media }),
    ...(workMedia.mediaSrcSet === undefined
      ? {}
      : { mediaSrcSet: workMedia.mediaSrcSet }),
  };
}

function exactWorkCard(
  publication: MuseumPublication,
  workId: string,
  description: string
): MuseumResearchDocumentCardEntry | undefined {
  const work = publication.works?.find((candidate) => candidate.id === workId);
  if (work === undefined) return undefined;
  const artist = publication.artists.find(
    (candidate) => candidate.id === work.artistId
  );
  const workMedia = resolveExactWorkMediaById(publication, workId);
  return {
    id: `research-work:${work.id}`,
    slug: work.slug,
    href: museumWorkHref(work.id),
    title: work.title,
    kindLabel: t(DEFAULT_LOCALE, "museum.network.research.workStudy"),
    ...(artist === undefined ? {} : { subjectLabels: [artist.preferredName] }),
    description,
    actionLabel: t(DEFAULT_LOCALE, "museum.network.research.viewWork"),
    ...(workMedia.media === undefined ? {} : { media: workMedia.media }),
    ...(workMedia.mediaSrcSet === undefined
      ? {}
      : { mediaSrcSet: workMedia.mediaSrcSet }),
  };
}

function exactArtistCard(
  publication: MuseumPublication,
  artistId: string,
  workId: string,
  description: string
): MuseumResearchDocumentCardEntry | undefined {
  const artist = publication.artists.find(
    (candidate) => candidate.id === artistId
  );
  if (artist === undefined) return undefined;
  const workMedia = resolveExactWorkMediaById(publication, workId);
  const editorialMedia = researchArtistEditorialMedia(artistId);
  const media = editorialMedia?.media ?? workMedia.media;
  const mediaSrcSet = editorialMedia?.mediaSrcSet ?? workMedia.mediaSrcSet;
  return {
    id: `research-artist:${artist.id}`,
    slug: artist.slug,
    href: museumArtistHref(artist.slug),
    title: artist.preferredName,
    kindLabel: t(DEFAULT_LOCALE, "museum.network.research.artistStudy"),
    description,
    actionLabel: t(DEFAULT_LOCALE, "museum.network.research.readArtistProfile"),
    ...(media === undefined ? {} : { media }),
    ...(mediaSrcSet === undefined ? {} : { mediaSrcSet }),
    ...(editorialMedia === undefined
      ? {}
      : {
          mediaQualifier: t(
            DEFAULT_LOCALE,
            "museum.network.research.editorialIllustration"
          ),
          mediaSourceHref: editorialMedia.sourceHref,
          mediaSourceLabel: t(
            DEFAULT_LOCALE,
            "museum.network.research.viewImageSource"
          ),
        }),
  };
}

function researchArtistEditorialMedia(artistId: string):
  | {
      readonly media: MuseumMedia;
      readonly mediaSrcSet: string;
      readonly sourceHref: string;
    }
  | undefined {
  if (artistId === "6529NM-ART-0022") {
    return {
      media: museumResearchEditorialMedia({
        id: "museum-research-data-architecture-groundplan",
        file: "data-architecture-1600.webp",
        altText:
          "Pieter Jansz. Saenredam's measured groundplan of the Church of Saint John in 's-Hertogenbosch, 1632.",
        creditLine:
          "Pieter Jansz. Saenredam, Groundplan of the Church of Saint John in 's-Hertogenbosch, 1632. The Metropolitan Museum of Art. Public Domain.",
        licenseLabel: "Public Domain Mark 1.0",
        licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      }),
      mediaSrcSet:
        "/museum/research/editorial/data-architecture-800.webp 800w, /museum/research/editorial/data-architecture-1600.webp 1600w",
      sourceHref: "https://www.metmuseum.org/art/collection/search/419541",
    };
  }
  if (artistId === "6529NM-ART-0023") {
    return {
      media: museumResearchEditorialMedia({
        id: "museum-research-rights-printmaking-workshop",
        file: "rights-1600.webp",
        altText:
          "Pellegrino dal Colle's eighteenth-century print after Francesco Maggiotto showing a printmaking workshop.",
        creditLine:
          "Pellegrino dal Colle, after Francesco Maggiotto, The Printmaking Workshop, 1750–1800. The Metropolitan Museum of Art. Public Domain.",
        licenseLabel: "Public Domain Mark 1.0",
        licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      }),
      mediaSrcSet:
        "/museum/research/editorial/rights-800.webp 800w, /museum/research/editorial/rights-1600.webp 1600w",
      sourceHref: "https://www.metmuseum.org/art/collection/search/415528",
    };
  }
  return undefined;
}

function researchStewardshipCards(): readonly MuseumResearchDocumentCardEntry[] {
  const diagramQualifier = t(
    DEFAULT_LOCALE,
    "museum.network.research.museumDiagram"
  );
  return [
    {
      id: "research-stewardship:inside-system",
      slug: "inside-system",
      href: "/museum/network/projects/century/system",
      title: t(DEFAULT_LOCALE, "museum.network.research.insideSystemTitle"),
      kindLabel: t(DEFAULT_LOCALE, DIGITAL_STEWARDSHIP_STUDY_KEY),
      description: t(
        DEFAULT_LOCALE,
        "museum.network.research.insideSystemDescription"
      ),
      actionLabel: t(DEFAULT_LOCALE, "museum.network.research.openSystemStudy"),
      mediaQualifier: diagramQualifier,
      media: museumDiagram({
        id: "museum-research-inside-system",
        file: "inside-system.svg",
        altText:
          "A Museum diagram connecting an executable work's token, code, runtime, display, and care layers.",
        creditLine: "6529 Network Museum, Inside the System, 2026. CC0 1.0.",
      }),
    },
    {
      id: "research-stewardship:rights",
      slug: "rights",
      href: "/museum/network/research/rights",
      title: t(DEFAULT_LOCALE, "museum.network.research.rightsTitle"),
      kindLabel: t(DEFAULT_LOCALE, DIGITAL_STEWARDSHIP_STUDY_KEY),
      description: t(
        DEFAULT_LOCALE,
        "museum.network.research.rightsDescription"
      ),
      actionLabel: t(DEFAULT_LOCALE, RESEARCH_READ_GUIDE_KEY),
      mediaQualifier: diagramQualifier,
      media: museumDiagram({
        id: "museum-research-rights-and-licenses",
        file: "rights-and-licenses.svg",
        altText:
          "A Museum diagram separating token title, copyright, display, reproduction, and preservation permissions.",
        creditLine: "6529 Network Museum, Rights and Licenses, 2026. CC0 1.0.",
      }),
    },
    {
      id: "research-stewardship:data-architecture",
      slug: "data-architecture",
      href: "/museum/network/research/data-architecture",
      title: t(DEFAULT_LOCALE, "museum.network.research.dataArchitectureTitle"),
      kindLabel: t(DEFAULT_LOCALE, DIGITAL_STEWARDSHIP_STUDY_KEY),
      description: t(
        DEFAULT_LOCALE,
        "museum.network.research.dataArchitectureDescription"
      ),
      actionLabel: t(DEFAULT_LOCALE, RESEARCH_READ_GUIDE_KEY),
      mediaQualifier: diagramQualifier,
      media: museumDiagram({
        id: "museum-research-public-record-architecture",
        file: "public-record-architecture.svg",
        altText:
          "A Museum diagram connecting artists, works, projects, acquisitions, programs, rights, custody, and sources.",
        creditLine:
          "6529 Network Museum, Data Architecture and the Public Record, 2026. CC0 1.0.",
      }),
    },
    {
      id: "research-stewardship:generative-method",
      slug: "generative-system-analysis-standard",
      href: "/museum/network/research/generative-system-analysis-standard",
      title: t(DEFAULT_LOCALE, "museum.network.research.generativeMethodTitle"),
      kindLabel: t(DEFAULT_LOCALE, DIGITAL_STEWARDSHIP_STUDY_KEY),
      description: t(
        DEFAULT_LOCALE,
        "museum.network.research.generativeMethodDescription"
      ),
      actionLabel: t(DEFAULT_LOCALE, "museum.network.research.readMethod"),
      mediaQualifier: diagramQualifier,
      media: museumDiagram({
        id: "museum-research-generative-method",
        file: "generative-method.svg",
        altText:
          "A Museum diagram linking a cited source snapshot, an open analysis script, and a deterministic result set.",
        creditLine:
          "6529 Network Museum, Reproducible Generative Analysis, 2026. CC0 1.0.",
      }),
    },
  ];
}

function researchPracticeCards(): readonly MuseumResearchDocumentCardEntry[] {
  const editorialQualifier = t(
    DEFAULT_LOCALE,
    "museum.network.research.editorialIllustration"
  );
  const imageSourceLabel = t(
    DEFAULT_LOCALE,
    "museum.network.research.viewImageSource"
  );
  const publicDomainMarkUri =
    "https://creativecommons.org/publicdomain/mark/1.0/";
  const practice = [
    {
      id: "research-practice:museums-to-learn",
      slug: "institutional-practice",
      href: "/museum/network/research/institutional-practice",
      title: t(DEFAULT_LOCALE, "museum.network.research.museumsToLearnTitle"),
      kindLabel: t(DEFAULT_LOCALE, MUSEUM_PRACTICE_STUDY_KEY),
      description: t(
        DEFAULT_LOCALE,
        "museum.network.research.museumsToLearnDescription"
      ),
      actionLabel: t(DEFAULT_LOCALE, "museum.network.research.readStudy"),
      mediaQualifier: editorialQualifier,
      mediaSrcSet:
        "/museum/research/editorial/museums-to-learn-800.webp 800w, /museum/research/editorial/museums-to-learn-1600.webp 1600w",
      mediaSourceHref: "https://siarchives.si.edu/collections/siris_arc_401640",
      mediaSourceLabel: imageSourceLabel,
      media: museumResearchEditorialMedia({
        id: "museum-research-museums-to-learn",
        file: "museums-to-learn-1600.webp",
        altText:
          "Visitors in the Gallery of Art in the Smithsonian Institution Building in 1857.",
        creditLine:
          "United States National Museum Photographic Laboratory, Gallery of Art, Smithsonian Institution Building, 1857 (copied in the 1950s); the source mount labels the depicted gallery ‘ca. 1860.’ Smithsonian Institution Archives. CC0.",
        licenseLabel: "CC0 1.0",
        licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      }),
    },
    {
      id: "research-practice:scholarship-writing",
      slug: "scholarship-and-writing",
      href: "/museum/network/research/scholarship-and-writing",
      title: t(
        DEFAULT_LOCALE,
        "museum.network.research.scholarshipWritingTitle"
      ),
      kindLabel: t(DEFAULT_LOCALE, "museum.network.research.editorialStandard"),
      description: t(
        DEFAULT_LOCALE,
        "museum.network.research.scholarshipWritingDescription"
      ),
      actionLabel: t(DEFAULT_LOCALE, "museum.network.research.readStandard"),
      mediaQualifier: editorialQualifier,
      mediaSrcSet:
        "/museum/research/editorial/scholarship-and-writing-800.webp 800w, /museum/research/editorial/scholarship-and-writing-1600.webp 1600w",
      mediaSourceHref:
        "https://www.rijksmuseum.nl/en/collection/object/Woman-Reading-a-Letter--8e9e02c8045362ffb2171b2fb52953ba",
      mediaSourceLabel: imageSourceLabel,
      media: museumResearchEditorialMedia({
        id: "museum-research-scholarship-writing",
        file: "scholarship-and-writing-1600.webp",
        altText: "Johannes Vermeer's Woman Reading a Letter, circa 1663.",
        creditLine:
          "Johannes Vermeer, Woman Reading a Letter, c. 1663. Rijksmuseum. Public Domain Mark 1.0.",
        licenseLabel: "Public Domain Mark 1.0",
        licenseUrl: publicDomainMarkUri,
      }),
    },
    {
      id: "research-practice:open-museum",
      slug: "open-museum",
      href: "/museum/network/about",
      title: t(DEFAULT_LOCALE, "museum.network.research.openMuseumTitle"),
      kindLabel: t(DEFAULT_LOCALE, MUSEUM_PRACTICE_STUDY_KEY),
      description: t(
        DEFAULT_LOCALE,
        "museum.network.research.openMuseumDescription"
      ),
      actionLabel: t(DEFAULT_LOCALE, "museum.network.research.readAboutMuseum"),
      mediaQualifier: editorialQualifier,
      mediaSrcSet:
        "/museum/research/editorial/open-museum-800.webp 800w, /museum/research/editorial/open-museum-1600.webp 1600w",
      mediaSourceHref: "https://siarchives.si.edu/collections/siris_arc_401663",
      mediaSourceLabel: imageSourceLabel,
      media: museumResearchEditorialMedia({
        id: "museum-research-open-museum",
        file: "open-museum-1600.webp",
        altText:
          "The Great Hall of the Smithsonian Institution Building in 1857.",
        creditLine:
          "United States National Museum Photographic Laboratory, The Museum, Great Hall, 1857. Smithsonian Institution Archives. CC0.",
        licenseLabel: "CC0 1.0",
        licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      }),
    },
  ];
  return [
    ...practice.slice(0, 3),
    {
      id: "research-practice:repository-to-chain",
      slug: "from-public-repository-to-on-chain-museum-record",
      href: "/museum/network/research/from-public-repository-to-on-chain-museum-record",
      title: t(
        DEFAULT_LOCALE,
        "museum.network.research.repositoryToChainTitle"
      ),
      kindLabel: t(DEFAULT_LOCALE, MUSEUM_PRACTICE_STUDY_KEY),
      description: t(
        DEFAULT_LOCALE,
        "museum.network.research.repositoryToChainDescription"
      ),
      actionLabel: t(DEFAULT_LOCALE, "museum.network.research.readTransition"),
      mediaQualifier: t(
        DEFAULT_LOCALE,
        "museum.network.research.museumDiagram"
      ),
      media: museumDiagram({
        id: "museum-research-repository-to-chain",
        file: "repository-to-chain.svg",
        altText:
          "A Museum diagram distinguishing the open record, its cryptographic commitment, the future contract, and the public display.",
        creditLine:
          "6529 Network Museum, From Repository to Chain, 2026. CC0 1.0.",
      }),
    },
  ];
}

interface MuseumResearchLandingCards {
  readonly acquisitionCards: readonly MuseumResearchDocumentCardEntry[];
  readonly artistCards: readonly MuseumResearchDocumentCardEntry[];
  readonly workCards: readonly MuseumResearchDocumentCardEntry[];
  readonly contextCards: readonly MuseumResearchDocumentCardEntry[];
  readonly stewardshipCards: readonly MuseumResearchDocumentCardEntry[];
  readonly practiceCards: readonly MuseumResearchDocumentCardEntry[];
}

export function buildMuseumResearchLandingCards(
  publication: MuseumPublication,
  entries: readonly MuseumResearchIndexEntry[]
): MuseumResearchLandingCards | undefined {
  const acquisitionCards = [
    veraAcquisitionResearchCard(publication, entries),
    acquisitionResearchCard({
      entries,
      publication,
      researchId: "6529NM-RP-0001",
      publicTitle: "The System in Seven States",
      subjectLabel: "Casey Reas",
    }),
    acquisitionResearchCard({
      entries,
      publication,
      researchId: "6529NM-RP-0003",
      publicTitle: "Conflict at Its Edges",
      subjectLabel: "Magnum Photos",
    }),
    acquisitionResearchCard({
      entries,
      publication,
      researchId: "6529NM-RP-0002",
      publicTitle: "Access, Control, and Exit",
      subjectLabel: "Keys and Gates",
    }),
  ].filter(
    (entry): entry is MuseumResearchDocumentCardEntry => entry !== undefined
  );
  if (
    Object.keys(MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS).length !== 3 ||
    acquisitionCards.length !== 4
  ) {
    return undefined;
  }

  const artistCards = MUSEUM_RESEARCH_ARTIST_ASSIGNMENTS.map((assignment) =>
    exactArtistCard(
      publication,
      assignment.artistId,
      assignment.workId,
      t(DEFAULT_LOCALE, assignment.descriptionKey)
    )
  ).filter(
    (entry): entry is MuseumResearchDocumentCardEntry => entry !== undefined
  );
  if (artistCards.length !== MUSEUM_RESEARCH_ARTIST_ASSIGNMENTS.length) {
    return undefined;
  }

  const workCards = MUSEUM_RESEARCH_WORK_ASSIGNMENTS.map((assignment) =>
    exactWorkCard(
      publication,
      assignment.workId,
      t(DEFAULT_LOCALE, assignment.descriptionKey)
    )
  ).filter(
    (entry): entry is MuseumResearchDocumentCardEntry => entry !== undefined
  );
  if (workCards.length !== MUSEUM_RESEARCH_WORK_ASSIGNMENTS.length) {
    return undefined;
  }

  const magnum = publication.organizations?.find(
    (organization) =>
      organization.id ===
      MUSEUM_RESEARCH_CONTEXT_ENTITY_IDS.magnumOrganizationId
  );
  const keysAndGates = publication.acquisitionPrograms?.find(
    (program) =>
      program.id === MUSEUM_RESEARCH_CONTEXT_ENTITY_IDS.keysAndGatesProgramId
  );
  if (magnum === undefined || keysAndGates === undefined) return undefined;
  const contextCards: MuseumResearchDocumentCardEntry[] = [
    {
      id: `research-context:${magnum.id}`,
      slug: magnum.slug,
      href: museumOrganizationHref(magnum.slug),
      title: magnum.preferredName,
      kindLabel: t(DEFAULT_LOCALE, "museum.network.research.organizationStudy"),
      description: t(
        DEFAULT_LOCALE,
        "museum.network.research.magnumOrganizationDescription"
      ),
      actionLabel: t(
        DEFAULT_LOCALE,
        "museum.network.research.readOrganizationProfile"
      ),
    },
    {
      id: `research-context:${keysAndGates.id}`,
      slug: keysAndGates.slug,
      href: museumAcquisitionProgramHref(keysAndGates.slug),
      title: keysAndGates.title,
      kindLabel: t(DEFAULT_LOCALE, "museum.network.research.programStudy"),
      description: t(
        DEFAULT_LOCALE,
        "museum.network.research.keysGatesProgramDescription"
      ),
      actionLabel: t(DEFAULT_LOCALE, "museum.network.research.readProgram"),
    },
  ];
  if (contextCards.length !== 2) return undefined;
  const stewardshipCards = researchStewardshipCards();
  const practiceCards = researchPracticeCards();
  if (stewardshipCards.length !== 4 || practiceCards.length !== 4) {
    return undefined;
  }

  return {
    acquisitionCards,
    artistCards,
    workCards,
    contextCards,
    stewardshipCards,
    practiceCards,
  };
}
