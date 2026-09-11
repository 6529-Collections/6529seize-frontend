import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { museumDocumentKindLabelKey } from "@/lib/museum/publication/documentLabels";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";
import type {
  MuseumMedia,
  MuseumPublication,
  MuseumPublicDocument,
} from "@/lib/museum/publication/types";
import { proposalPresentationMedia } from "./media";

export type MuseumResearchGroup =
  | "art"
  | "collection"
  | "stewardship"
  | "practice";

export interface MuseumResearchIndexEntry {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly group: MuseumResearchGroup;
  readonly sourcePath: string;
  readonly typed: boolean;
  readonly document?: MuseumPublicDocument;
  readonly publicationUri?: string;
  readonly media?: MuseumMedia;
  readonly kindLabel?: string;
  readonly subjectLabels?: readonly string[];
  readonly description?: string;
}

interface MuseumResearchAcquisitionAssignment {
  readonly researchId: string;
  readonly workId: string;
  readonly descriptionKey: MessageKey;
  readonly statusKey: MessageKey;
  readonly qualifierKey: MessageKey;
  readonly selectedSections: readonly string[];
}

export const MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS: Readonly<
  Record<string, MuseumResearchAcquisitionAssignment>
> = {
  "6529NM-RP-0001": {
    researchId: "6529NM-RP-0001",
    workId: "6529NM-W-0006",
    descriptionKey: "museum.network.research.systemDescription",
    statusKey: "museum.network.research.permanentCollection",
    qualifierKey: "museum.network.research.generativeSurrogateQualifier",
    selectedSections: [
      "Casey Reas in the 6529 Network Museum",
      "I. A collection begins with difference",
      "III. Behavior becomes drawing",
      "IV. The room and the cosmos",
      "VII. Into public study",
    ],
  },
  "6529NM-RP-0003": {
    researchId: "6529NM-RP-0003",
    workId: "6529NM-W-0024",
    descriptionKey: "museum.network.research.magnumDescription",
    statusKey: "museum.network.research.permanentCollection",
    qualifierKey: "museum.network.research.magnumDisplayQualifier",
    selectedSections: [
      "Five Photographs of Borders, Access, and Afterlives, 1952–2016",
      "A border named from a distance",
      "Armed presence in sacred architecture",
      "Smoke, access, and the interrupted event",
      "The ruin after destruction",
      "The case and its limit",
    ],
  },
  "6529NM-RP-0002": {
    researchId: "6529NM-RP-0002",
    workId: "6529NM-W-0008",
    descriptionKey: "museum.network.research.keysGatesDescription",
    statusKey: "museum.network.research.acquisitionInProgress",
    qualifierKey: "museum.network.research.keysGatesDisplayQualifier",
    selectedSections: [
      "Apertures and exits",
      "Managed movement",
      "Residual infrastructures",
      "Bodies and interfaces",
      "A material comparison",
    ],
  },
};

interface MuseumResearchArtistAssignment {
  readonly artistId: string;
  readonly workId: string;
  readonly descriptionKey: MessageKey;
}

export const MUSEUM_RESEARCH_ARTIST_ASSIGNMENTS: readonly MuseumResearchArtistAssignment[] =
  [
    {
      artistId: "6529NM-ART-0022",
      workId: "6529NM-W-0029",
      descriptionKey: "museum.network.research.artistVeraDescription",
    },
    {
      artistId: "6529NM-ART-0023",
      workId: "6529NM-W-0029",
      descriptionKey: "museum.network.research.artistMartinDescription",
    },
    {
      artistId: "6529NM-ART-0001",
      workId: "6529NM-W-0007",
      descriptionKey: "museum.network.research.artistCaseyDescription",
    },
    {
      artistId: "6529NM-ART-0018",
      workId: "6529NM-W-0025",
      descriptionKey: "museum.network.research.artistTowellDescription",
    },
    {
      artistId: "6529NM-ART-0020",
      workId: "6529NM-W-0027",
      descriptionKey: "museum.network.research.artistSamanDescription",
    },
    {
      artistId: "6529NM-ART-0003",
      workId: "6529NM-W-0009",
      descriptionKey: "museum.network.research.artistHugoFazDescription",
    },
    {
      artistId: "6529NM-ART-0004",
      workId: "6529NM-W-0010",
      descriptionKey: "museum.network.research.artistNasimDescription",
    },
    {
      artistId: "6529NM-ART-0015",
      workId: "6529NM-W-0022",
      descriptionKey: "museum.network.research.artistShamsDescription",
    },
  ];

interface MuseumResearchWorkAssignment {
  readonly workId: string;
  readonly descriptionKey: MessageKey;
}

export const MUSEUM_RESEARCH_WORK_ASSIGNMENTS: readonly MuseumResearchWorkAssignment[] =
  [
    {
      workId: "6529NM-W-0029",
      descriptionKey: "museum.network.research.workThemesDescription",
    },
    {
      workId: "6529NM-W-0004",
      descriptionKey: "museum.network.research.workPreProcessDescription",
    },
    {
      workId: "6529NM-W-0005",
      descriptionKey: "museum.network.research.workPhototaxisDescription",
    },
    {
      workId: "6529NM-W-0026",
      descriptionKey: "museum.network.research.workBarAmDescription",
    },
    {
      workId: "6529NM-W-0028",
      descriptionKey: "museum.network.research.workMeloniDescription",
    },
    {
      workId: "6529NM-W-0011",
      descriptionKey: "museum.network.research.workNoKeyDescription",
    },
    {
      workId: "6529NM-W-0014",
      descriptionKey: "museum.network.research.workCostOpenDescription",
    },
  ];

export const MUSEUM_RESEARCH_CONTEXT_ENTITY_IDS = {
  magnumOrganizationId: "6529NM-ORG-0002",
  keysAndGatesProgramId: "6529NM-AP-ENT-0002",
} as const;

function researchGroup(value: string): MuseumResearchGroup {
  const normalized = value.toLocaleLowerCase();
  if (/(?:artist|project|work|close|reading)/u.test(normalized)) {
    return "art";
  }
  if (
    /(?:collection|acquisition|gift|accession|program|object)/u.test(normalized)
  ) {
    return "collection";
  }
  if (/(?:institution|scholarship|editorial|practice)/u.test(normalized)) {
    return "practice";
  }
  return "stewardship";
}

function documentGroup(document: MuseumPublicDocument): MuseumResearchGroup {
  if (
    document.kind === "artist_practice" ||
    document.kind === "project_essay"
  ) {
    return "art";
  }
  if (
    document.kind === "collection_essay" ||
    document.kind === "gift_narrative" ||
    document.kind === "object_entry" ||
    document.kind === "acquisition_essay" ||
    document.kind === "program_essay" ||
    document.kind === "curatorial_accession_review" ||
    document.kind === "accession_certificate" ||
    document.kind === "gift_acceptance_authorization" ||
    document.kind === "technical_condition_review" ||
    document.kind === "title_rights_accession_review" ||
    document.kind === "custody_title_compliance_diligence"
  ) {
    return "collection";
  }
  if (
    document.kind === "institutional_practice_study" ||
    document.kind === "institutional_practice_adjacent" ||
    document.kind === "institution_profile" ||
    document.kind === "scholarship_editorial_standard" ||
    document.kind === "institutional_practice_source_register"
  ) {
    return "practice";
  }
  return "stewardship";
}

function museumResearchSlugPart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

function museumResearchSlugHash(value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function uniqueMuseumResearchDocumentSlug(
  document: MuseumPublicDocument,
  usedSlugs: Set<string>
): string {
  const base =
    museumResearchSlugPart(document.title) ||
    `research-document-${museumResearchSlugHash(document.id)}`;
  if (!usedSlugs.has(base)) return base;

  const disambiguated = `${base}-${museumResearchSlugHash(document.id)}`;
  if (!usedSlugs.has(disambiguated)) return disambiguated;

  let suffix = 2;
  let candidate = `${disambiguated}-${suffix}`;
  while (usedSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${disambiguated}-${suffix}`;
  }
  return candidate;
}

function researchMedia(
  publication: MuseumPublication,
  document: MuseumPublicDocument,
  subjectIds: readonly string[] = []
): MuseumMedia | undefined {
  const acquisitionWorkIds = [
    ...(document.acquisitionIds ?? []),
    ...subjectIds,
  ].flatMap((acquisitionId) => {
    const canonicalId =
      publication.acquisitionAliases?.find(
        (alias) => alias.alias === acquisitionId
      )?.acquisitionId ?? acquisitionId;
    return (
      publication.curatedAcquisitions?.find(
        (acquisition) => acquisition.id === canonicalId
      )?.workIds ?? []
    );
  });
  const programWorkIds = [
    ...(document.programIds ?? []),
    ...subjectIds,
  ].flatMap((programId) => {
    const canonicalId =
      publication.entityGraph?.identityInventory.programAliases.find(
        (alias) => alias.alias === programId
      )?.programId ?? programId;
    const acquisitionIds =
      publication.acquisitionPrograms?.find(
        (program) => program.id === canonicalId
      )?.acquisitionIds ?? [];
    return acquisitionIds.flatMap(
      (acquisitionId) =>
        publication.curatedAcquisitions?.find(
          (acquisition) => acquisition.id === acquisitionId
        )?.workIds ?? []
    );
  });
  const sourceIds = [
    ...(document.workIds ?? []),
    ...document.artworkIds,
    ...acquisitionWorkIds,
    ...programWorkIds,
    ...document.projectIds.flatMap((projectId) => {
      const project = publication.projects.find(
        (candidate) => candidate.id === projectId
      );
      return [...(project?.workIds ?? []), ...(project?.artworkIds ?? [])];
    }),
    ...document.artistIds.flatMap((artistId) => {
      const artist = publication.artists.find(
        (candidate) => candidate.id === artistId
      );
      return [...(artist?.workIds ?? []), ...(artist?.artworkIds ?? [])];
    }),
  ];
  const aliases = publication.workAliases ?? [];
  const orderedIds = [
    ...new Set(
      sourceIds.flatMap((sourceId) => {
        const alias = aliases.find(
          (candidate) => candidate.sourceObjectId === sourceId
        );
        return alias === undefined ? [sourceId] : [alias.workId, sourceId];
      })
    ),
  ];
  for (const id of orderedIds) {
    const work = publication.works?.find((candidate) => candidate.id === id);
    const typedMedia = selectMuseumStillMedia(work?.media ?? []);
    if (typedMedia !== undefined) return typedMedia;
    const proposalMedia = work?.presentationMedia?.[0];
    if (proposalMedia !== undefined) {
      const reviewedProposalMedia = proposalPresentationMedia(
        id,
        proposalMedia
      );
      if (reviewedProposalMedia !== undefined) return reviewedProposalMedia;
    }
    const artwork = publication.artworks.find(
      (candidate) => candidate.id === id
    );
    const legacyMedia = selectMuseumStillMedia(artwork?.media ?? []);
    if (legacyMedia !== undefined) return legacyMedia;
  }
  return undefined;
}

function museumResearchKnownLabel(
  publication: MuseumPublication,
  id: string
): string | undefined {
  const graphLabel = publication.entityGraph?.entities.find(
    (entity) => entity.id === id
  )?.label;
  if (graphLabel !== undefined) return graphLabel;

  return (
    publication.artists.find((artist) => artist.id === id)?.preferredName ??
    publication.projects.find((project) => project.id === id)?.title ??
    publication.organizations?.find((organization) => organization.id === id)
      ?.preferredName ??
    publication.works?.find((work) => work.id === id)?.title ??
    publication.artworks.find((artwork) => artwork.id === id)?.title ??
    publication.curatedAcquisitions?.find(
      (acquisition) => acquisition.id === id
    )?.title ??
    publication.acquisitionPrograms?.find((program) => program.id === id)?.title
  );
}

function researchSubjectLabels(
  publication: MuseumPublication,
  document: MuseumPublicDocument,
  subjectIds: readonly string[] = []
): readonly string[] {
  const associatedIds = [
    ...subjectIds,
    ...document.artistIds,
    ...document.projectIds,
    ...(document.workIds ?? []),
    ...document.artworkIds,
    ...(document.acquisitionIds ?? []),
    ...(document.programIds ?? []),
    ...(document.organizationIds ?? []),
  ];
  return [...new Set(associatedIds)]
    .map((id) => museumResearchKnownLabel(publication, id))
    .filter(
      (label): label is string => label !== undefined && label.length > 0
    );
}

function museumResearchEditorialTitle(
  title: string,
  subjectLabels: readonly string[]
): string {
  if (!/^(?:6529NM|OUT-|RP-|RESEARCH-|[0-9a-f]{24,})/iu.test(title)) {
    return title;
  }
  return (
    subjectLabels[0] ??
    t(DEFAULT_LOCALE, "museum.network.research.fallbackTitle")
  );
}

function museumResearchDescription(
  document: MuseumPublicDocument,
  kindLabel: string,
  subjectLabels: readonly string[]
): string {
  const firstParagraph = document.markdown
    .split(/\n\s*\n/u)
    .map((paragraph) =>
      paragraph
        .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
        .replace(/[*_`]/gu, "")
        .replace(/\s+/gu, " ")
        .trim()
    )
    .find(
      (paragraph) =>
        paragraph.length > 0 &&
        !paragraph.startsWith("#") &&
        !paragraph.startsWith("|") &&
        !paragraph.startsWith("-")
    );
  if (firstParagraph !== undefined) {
    const characters = Array.from(firstParagraph);
    if (characters.length <= 220) return firstParagraph;
    const excerpt = characters.slice(0, 217).join("").trimEnd();
    const finalWordBoundary = excerpt.lastIndexOf(" ");
    const wordSafeExcerpt =
      finalWordBoundary >= 160
        ? excerpt.slice(0, finalWordBoundary).trimEnd()
        : excerpt;
    return `${wordSafeExcerpt}...`;
  }
  if (subjectLabels.length > 0) {
    return t(
      DEFAULT_LOCALE,
      "museum.network.research.fallbackDescriptionWithSubjects",
      { kind: kindLabel, subjects: subjectLabels.join(", ") }
    );
  }
  return t(DEFAULT_LOCALE, "museum.network.research.fallbackDescription", {
    kind: kindLabel,
  });
}

function researchEntryFields(
  publication: MuseumPublication,
  document: MuseumPublicDocument,
  subjectIds: readonly string[] = []
): {
  readonly title: string;
  readonly kindLabel: string;
  readonly subjectLabels: readonly string[];
  readonly description: string;
} {
  const kindLabel = t(
    DEFAULT_LOCALE,
    museumDocumentKindLabelKey(document.kind)
  );
  const subjectLabels = researchSubjectLabels(
    publication,
    document,
    subjectIds
  );
  return {
    title: museumResearchEditorialTitle(document.title, subjectLabels),
    kindLabel,
    subjectLabels,
    description: museumResearchDescription(document, kindLabel, subjectLabels),
  };
}

function typedResearchDocument(
  publication: MuseumPublication,
  record: NonNullable<MuseumPublication["researchPublications"]>[number]
):
  | {
      readonly document: MuseumPublicDocument;
      readonly publicationUri: string;
    }
  | undefined {
  const publicationUri = record.publicationUri;
  const matches = publication.documents.filter(
    (document) =>
      buildImmutableMuseumBlobUrl(
        publication.identity.commit,
        document.sourcePath
      ) === publicationUri
  );
  return matches.length === 1
    ? { document: matches[0]!, publicationUri }
    : undefined;
}

export function buildMuseumResearchIndex(
  publication: MuseumPublication
): readonly MuseumResearchIndexEntry[] {
  const typed = publication.researchPublications ?? [];
  const typedEntries = typed.flatMap((record) => {
    const manuscript = typedResearchDocument(publication, record);
    const document = manuscript?.document;
    const immutablePublicationUri = manuscript?.publicationUri ?? null;
    if (
      document === undefined ||
      immutablePublicationUri === null ||
      buildImmutableMuseumBlobUrl(
        publication.identity.commit,
        document.sourcePath
      ) !== immutablePublicationUri
    ) {
      return [];
    }
    const media = researchMedia(publication, document, record.subjectIds);
    const fields = researchEntryFields(
      publication,
      document,
      record.subjectIds
    );
    return [
      {
        id: record.id,
        slug: record.slug,
        ...fields,
        title: museumResearchEditorialTitle(record.title, fields.subjectLabels),
        group: researchGroup(record.publicationKind),
        sourcePath: record.sourcePath,
        typed: true,
        publicationUri: immutablePublicationUri,
        document,
        ...(media === undefined ? {} : { media }),
      },
    ];
  });
  const representedDocumentIds = new Set(
    typedEntries.map((entry) => entry.document.id)
  );
  const usedSlugs = new Set(typedEntries.map((entry) => entry.slug));
  const documentEntries = publication.documents
    .filter(
      (document) =>
        document.kind !== "founding_principles" &&
        document.kind !== "open_museum_statement" &&
        !document.sourcePath.startsWith(
          "records/proposed-gifts/6529NM-PG-2026-002/public/"
        )
    )
    .filter((document) => !representedDocumentIds.has(document.id))
    .map((document) => {
      const media = researchMedia(publication, document);
      const slug = uniqueMuseumResearchDocumentSlug(document, usedSlugs);
      usedSlugs.add(slug);
      return {
        id: document.id,
        slug,
        ...researchEntryFields(publication, document),
        group: documentGroup(document),
        sourcePath: document.sourcePath,
        typed: false,
        document,
        ...(media === undefined ? {} : { media }),
      };
    });
  return [...typedEntries, ...documentEntries];
}

export function findMuseumResearchIndexEntry(
  publication: MuseumPublication,
  slug: string
): MuseumResearchIndexEntry | undefined {
  return buildMuseumResearchIndex(publication).find(
    (entry) => entry.slug === slug
  );
}

export const MUSEUM_RESEARCH_GROUPS: readonly [
  MuseumResearchGroup,
  MessageKey,
  MessageKey,
][] = [
  [
    "art",
    "museum.network.research.artAndArtists",
    "museum.network.research.artAndArtistsDescription",
  ],
  [
    "collection",
    "museum.network.research.collectionAndAcquisitions",
    "museum.network.research.collectionAndAcquisitionsDescription",
  ],
  [
    "stewardship",
    "museum.network.research.digitalArtStewardship",
    "museum.network.research.digitalArtStewardshipDescription",
  ],
  [
    "practice",
    "museum.network.research.museumPractice",
    "museum.network.research.museumPracticeDescription",
  ],
];

export function museumResearchGroupCopy(group: MuseumResearchGroup): {
  readonly label: string;
  readonly description: string;
} {
  const definition = MUSEUM_RESEARCH_GROUPS.find(
    ([candidate]) => candidate === group
  );
  if (definition === undefined) {
    throw new Error(`unknown_museum_research_group:${group}`);
  }
  return {
    label: t(DEFAULT_LOCALE, definition[1]),
    description: t(DEFAULT_LOCALE, definition[2]),
  };
}

const EDITORIAL_DOCUMENT_KINDS = new Set<MuseumPublicDocument["kind"]>([
  "artist_practice",
  "project_essay",
  "collection_essay",
  "acquisition_essay",
  "program_essay",
  "gift_narrative",
  "object_entry",
  "institutional_practice_study",
  "institutional_practice_adjacent",
  "institution_profile",
  "scholarship_editorial_standard",
  "institutional_practice_source_register",
]);

function isEditorialResearchEntry(entry: MuseumResearchIndexEntry): boolean {
  return (
    entry.typed ||
    (entry.document !== undefined &&
      EDITORIAL_DOCUMENT_KINDS.has(entry.document.kind))
  );
}

export function researchEditorialEntries(
  entries: readonly MuseumResearchIndexEntry[]
): readonly MuseumResearchIndexEntry[] {
  return entries.filter(isEditorialResearchEntry);
}

function researchGroupView(
  entries: readonly MuseumResearchIndexEntry[],
  group: MuseumResearchGroup
) {
  const copy = museumResearchGroupCopy(group);
  return {
    id: group,
    title: copy.label,
    description: copy.description,
    entries: entries.filter((entry) => entry.group === group),
  };
}

export function buildMuseumResearchBrowseGroups(
  entries: readonly MuseumResearchIndexEntry[]
) {
  return MUSEUM_RESEARCH_GROUPS.map(([group]) =>
    researchGroupView(entries, group)
  )
    .filter((group) => group.entries.length > 0)
    .map((group) => ({
      ...group,
      entries: group.entries.map((entry) => ({
        id: entry.id,
        slug: entry.slug,
        title: entry.title,
        sourcePath: entry.sourcePath,
        ...(entry.kindLabel === undefined
          ? {}
          : { kindLabel: entry.kindLabel }),
        ...(entry.subjectLabels === undefined
          ? {}
          : { subjectLabels: entry.subjectLabels }),
        ...(entry.description === undefined
          ? {}
          : { description: entry.description }),
        ...(entry.publicationUri === undefined
          ? {}
          : { publicationUri: entry.publicationUri }),
      })),
    }));
}
