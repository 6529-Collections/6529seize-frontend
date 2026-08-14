import type { Metadata } from "next";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumResearchLanding } from "@/components/museum/research/MuseumResearchLanding";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";
import { museumDocumentKindLabelKey } from "@/lib/museum/publication/documentLabels";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { museumResearchHref } from "@/lib/museum/publication/routes";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";
import type {
  MuseumExternalProposalPresentationMedia,
  MuseumMedia,
  MuseumPublication,
  MuseumPublicDocument,
} from "@/lib/museum/publication/types";

export const metadata: Metadata = {
  ...getAppMetadata({
    title: t(DEFAULT_LOCALE, "museum.network.research.indexTitle"),
    description: t(DEFAULT_LOCALE, "museum.network.research.indexDescription"),
  }),
  alternates: { canonical: "/museum/network/research" },
};

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

function proposalPresentationMedia(
  workId: string,
  media: MuseumExternalProposalPresentationMedia
): MuseumMedia {
  const delivery =
    media.variants?.find((variant) => variant.width >= 1280) ??
    media.variants?.at(-1);
  return {
    id: media.id,
    artworkId: workId,
    kind: "still",
    role: "source",
    mediaType: media.mediaMimeType,
    width: delivery?.width ?? media.width,
    height: delivery?.height ?? media.height,
    altText: media.altText,
    credit: {
      creditLine: media.credit.creditLine,
      licenseLabel: media.rights.licenseLabel,
      licenseUrl: media.rights.licenseUrl,
      rightsExpressionId: null,
      sourcePath: media.credit.sourcePath,
    },
    sourcePath: media.source.mediaRecordPath,
    custody: "upstream",
    url: delivery?.url ?? media.mediaUrl,
    preservationStatus: "not_retained",
    sha256: null,
    upstreamProvider: "museum_public_derivative",
  };
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
    ...acquisitionWorkIds,
    ...programWorkIds,
    ...(document.workIds ?? []),
    ...document.artworkIds,
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
      return proposalPresentationMedia(id, proposalMedia);
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
  return subjectLabels[0] ?? "Research record";
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
    return `${kindLabel} concerning ${subjectLabels.join(", ")}.`;
  }
  return `${kindLabel} from the Museum's published research record.`;
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
): MuseumPublicDocument | undefined {
  const matches = publication.documents.filter(
    (document) =>
      buildImmutableMuseumBlobUrl(
        publication.identity.commit,
        document.sourcePath
      ) === record.publicationUri
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function buildMuseumResearchIndex(
  publication: MuseumPublication
): readonly MuseumResearchIndexEntry[] {
  const typed = publication.researchPublications ?? [];
  const typedEntries = typed.flatMap((record) => {
    const document = typedResearchDocument(publication, record);
    const immutablePublicationUri =
      document === undefined
        ? null
        : buildImmutableMuseumBlobUrl(
            publication.identity.commit,
            document.sourcePath
          );
    if (
      document === undefined ||
      immutablePublicationUri === null ||
      immutablePublicationUri !== record.publicationUri
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
        document.kind !== "open_museum_statement"
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

function researchGroupEntries(
  entries: readonly MuseumResearchIndexEntry[],
  group: MuseumResearchGroup
) {
  return entries.filter((entry) => entry.group === group);
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
    // Keep the complete group here. The landing component orders illustrated
    // entries before applying its three-card editorial limit.
    entries: researchGroupEntries(entries, group),
  };
}

function researchBrowseGroupView(group: ReturnType<typeof researchGroupView>) {
  return {
    ...group,
    entries: group.entries.map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      title: entry.title,
      sourcePath: entry.sourcePath,
      ...(entry.kindLabel === undefined ? {} : { kindLabel: entry.kindLabel }),
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
  };
}

function researchEntrySubjectText(entry: MuseumResearchIndexEntry): string {
  return [entry.title, ...(entry.subjectLabels ?? [])]
    .join(" ")
    .toLocaleLowerCase();
}

function selectResearchLaunchEntries(
  entries: readonly MuseumResearchIndexEntry[],
  featuredId: string
): readonly MuseumResearchIndexEntry[] {
  const illustrated = entries.filter(
    (entry) => entry.id !== featuredId && entry.media !== undefined
  );
  const subjectPatterns = [
    /magnum|seymour|towell|bar-am|saman|cartagena|salgado|meloni/iu,
    /keys\s*(?:and|&)\s*gates|selected[_ -]unminted/iu,
    /casey|reas/iu,
    /museum practice|institutional/iu,
  ];
  const selected: MuseumResearchIndexEntry[] = [];
  for (const pattern of subjectPatterns) {
    const match = illustrated.find(
      (entry) =>
        !selected.some((selectedEntry) => selectedEntry.id === entry.id) &&
        pattern.test(researchEntrySubjectText(entry))
    );
    if (match !== undefined) selected.push(match);
    if (selected.length === 2) return selected;
  }
  for (const entry of illustrated) {
    if (!selected.some((selectedEntry) => selectedEntry.id === entry.id)) {
      selected.push(entry);
    }
    if (selected.length === 2) break;
  }
  return selected;
}

function researchSectionEyebrow(group: MuseumResearchGroup): string {
  switch (group) {
    case "collection":
      return t(
        DEFAULT_LOCALE,
        "museum.network.research.sectionEyebrow.collection"
      );
    case "stewardship":
      return t(
        DEFAULT_LOCALE,
        "museum.network.research.sectionEyebrow.stewardship"
      );
    case "practice":
      return t(
        DEFAULT_LOCALE,
        "museum.network.research.sectionEyebrow.practice"
      );
    case "art":
      return t(DEFAULT_LOCALE, "museum.network.research.sectionEyebrow.art");
  }
}

export default async function MuseumResearchPage() {
  const publication = (await getMuseumPublicationState()).publication;
  if (publication === null) return <MuseumPublicationUnavailable />;
  const entries = buildMuseumResearchIndex(publication);
  const featuredEntry =
    entries.find(
      (entry) => entry.group === "art" && entry.media !== undefined
    ) ??
    entries.find((entry) => entry.group === "art") ??
    entries.find(
      (entry) => entry.group === "collection" && entry.media !== undefined
    ) ??
    entries.find((entry) => entry.media !== undefined) ??
    entries[0];
  if (featuredEntry === undefined) return <MuseumPublicationUnavailable />;
  const launchEntries = selectResearchLaunchEntries(entries, featuredEntry.id);
  const launchIds = new Set([
    featuredEntry.id,
    ...launchEntries.map((entry) => entry.id),
  ]);
  const groups = MUSEUM_RESEARCH_GROUPS.map(([group]) =>
    researchGroupView(entries, group)
  ).filter((group) => group.entries.length > 0);

  return (
    <MuseumResearchLanding
      eyebrow={t(DEFAULT_LOCALE, "museum.network.research.indexEyebrow")}
      title={t(DEFAULT_LOCALE, "museum.network.research.indexTitle")}
      description={t(
        DEFAULT_LOCALE,
        "museum.network.research.indexDescription"
      )}
      featured={{
        href: museumResearchHref(featuredEntry.slug),
        eyebrow: t(DEFAULT_LOCALE, "museum.network.research.featuredLabel"),
        title: featuredEntry.title,
        description:
          featuredEntry.description ??
          t(DEFAULT_LOCALE, "museum.network.research.featuredDescription"),
        media: featuredEntry.media,
        actionLabel: t(DEFAULT_LOCALE, "museum.network.research.readStudy"),
      }}
      launchEntries={launchEntries}
      launchEyebrow={t(
        DEFAULT_LOCALE,
        "museum.network.research.selectedEyebrow"
      )}
      launchTitle={t(DEFAULT_LOCALE, "museum.network.research.selectedTitle")}
      launchDescription={t(
        DEFAULT_LOCALE,
        "museum.network.research.selectedDescription"
      )}
      sections={groups.map((group) => ({
        ...group,
        eyebrow: researchSectionEyebrow(group.id),
        entries: group.entries.filter((entry) => !launchIds.has(entry.id)),
      }))}
      browseGroups={groups.map(researchBrowseGroupView)}
      browseTitle={t(DEFAULT_LOCALE, "museum.network.research.browseTitle")}
      browseDescription={t(
        DEFAULT_LOCALE,
        "museum.network.research.browseDescription"
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
      }}
    />
  );
}
