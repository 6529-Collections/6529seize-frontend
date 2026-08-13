import type { Metadata } from "next";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumResearchLanding } from "@/components/museum/research/MuseumResearchLanding";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { museumResearchHref } from "@/lib/museum/publication/routes";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";
import type {
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

function researchMedia(
  publication: MuseumPublication,
  document: MuseumPublicDocument
): MuseumMedia | undefined {
  const sourceIds = new Set([
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
  ]);
  const workIds = new Set([
    ...sourceIds,
    ...(publication.workAliases ?? [])
      .filter((alias) => sourceIds.has(alias.sourceObjectId))
      .map((alias) => alias.workId),
  ]);
  const typedMedia = (publication.works ?? [])
    .filter((work) => workIds.has(work.id))
    .map((work) => selectMuseumStillMedia(work.media))
    .find((media): media is MuseumMedia => media !== undefined);
  if (typedMedia !== undefined) return typedMedia;
  return publication.artworks
    .filter((artwork) => workIds.has(artwork.id))
    .map((artwork) => selectMuseumStillMedia(artwork.media))
    .find((media): media is MuseumMedia => media !== undefined);
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
    const media = researchMedia(publication, document);
    return [
      {
        id: record.id,
        slug: record.slug,
        title: record.title,
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
        title: document.title,
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

const MUSEUM_RESEARCH_TIERS: readonly [
  string,
  MessageKey,
  MessageKey,
  MessageKey,
  readonly MuseumResearchGroup[],
][] = [
  [
    "scholarship",
    "museum.network.research.scholarshipTierEyebrow",
    "museum.network.research.scholarshipTierTitle",
    "museum.network.research.scholarshipTierDescription",
    ["art", "collection"],
  ],
  [
    "institution",
    "museum.network.research.institutionTierEyebrow",
    "museum.network.research.institutionTierTitle",
    "museum.network.research.institutionTierDescription",
    ["stewardship", "practice"],
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
        description: t(
          DEFAULT_LOCALE,
          "museum.network.research.featuredDescription"
        ),
        media: featuredEntry.media,
        actionLabel: t(DEFAULT_LOCALE, "museum.network.research.readStudy"),
      }}
      tiers={MUSEUM_RESEARCH_TIERS.map(
        ([id, eyebrowKey, titleKey, descriptionKey, groupIds]) => ({
          id,
          eyebrow: t(DEFAULT_LOCALE, eyebrowKey),
          title: t(DEFAULT_LOCALE, titleKey),
          description: t(DEFAULT_LOCALE, descriptionKey),
          groups: groupIds
            .map((group) => researchGroupView(entries, group))
            .filter((group) => group.entries.length > 0),
        })
      ).filter((tier) => tier.groups.length > 0)}
      browseGroups={MUSEUM_RESEARCH_GROUPS.map(([group]) =>
        researchGroupView(entries, group)
      ).filter((group) => group.entries.length > 0)}
      browseTitle={t(DEFAULT_LOCALE, "museum.network.research.browseTitle")}
      browseDescription={t(
        DEFAULT_LOCALE,
        "museum.network.research.browseDescription"
      )}
    />
  );
}
