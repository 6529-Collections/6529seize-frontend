import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import {
  MuseumResearchDetail,
  type MuseumResearchDetailEntry,
} from "@/components/museum/research/MuseumResearchDetail";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  MuseumEntityRef,
  MuseumEntityRelations,
} from "@/lib/museum/publication/ia";
import { buildMuseumEntityContext } from "@/lib/museum/publication/ia";
import { museumDocumentKindLabelKey } from "@/lib/museum/publication/documentLabels";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";
import { projectMuseumResearchReading } from "@/lib/museum/researchEditorialProjection";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";
import {
  museumAcquisitionHref,
  museumAcquisitionProgramHref,
  museumArtistHref,
  museumOrganizationHref,
  museumProjectHref,
  museumResearchHref,
  museumWorkHrefForSourceId,
  museumWorkHrefIndex,
} from "@/lib/museum/publication/routes";
import type {
  MuseumMedia,
  MuseumPublication,
  MuseumResearchPublication,
} from "@/lib/museum/publication/types";
import {
  museumResearchEditorialMedia,
  resolveExactWorkMediaById,
} from "../media";
import {
  MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS,
  findMuseumResearchIndexEntry,
  museumResearchGroupCopy,
  type MuseumResearchIndexEntry,
} from "../catalog";

interface MuseumResearchDetailProps {
  readonly params: Promise<{ slug: string }>;
}

const RESEARCH_DETAIL_DESCRIPTION_OVERRIDES: Readonly<
  Record<string, MessageKey>
> = {
  "generative-system-analysis-standard":
    "museum.network.research.generativeSystemDescription",
  "from-public-repository-to-on-chain-museum-record":
    "museum.network.research.repositoryToChainDescription",
};

function typedResearchPublicationForEntry(
  publication: MuseumPublication,
  entry: MuseumResearchIndexEntry
): MuseumResearchPublication | undefined {
  return publication.researchPublications?.find(
    (record) =>
      record.id === entry.id ||
      record.slug === entry.slug ||
      record.publicationUri === entry.publicationUri
  );
}

function researchMediaForEntry(
  publication: MuseumPublication,
  entry: MuseumResearchIndexEntry
): MuseumMedia | undefined {
  const assignedWorkId =
    MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS[entry.id]?.workId;
  if (assignedWorkId !== undefined) {
    const assignedMedia = resolveExactWorkMediaById(
      publication,
      assignedWorkId
    ).media;
    if (assignedMedia !== undefined) return assignedMedia;
  }

  const directIds = [
    ...(entry.document?.workIds ?? []),
    ...(entry.document?.artworkIds ?? []),
  ];
  for (const directId of directIds) {
    const work = publication.works?.find(
      (candidate) => candidate.id === directId
    );
    const media = selectMuseumStillMedia(work?.media ?? []);
    if (media !== undefined) return media;
    const artwork = publication.artworks.find(
      (candidate) => candidate.id === directId
    );
    const legacyMedia = selectMuseumStillMedia(artwork?.media ?? []);
    if (legacyMedia !== undefined) return legacyMedia;
  }
  return entry.media;
}

export function researchEditorialMediaForEntry(
  entry: MuseumResearchIndexEntry
): MuseumMedia | undefined {
  const diagrams: Readonly<
    Record<
      string,
      {
        readonly id: string;
        readonly file: string;
        readonly altText: string;
        readonly creditLine: string;
      }
    >
  > = {
    "generative-system-analysis-standard": {
      id: "museum-research-generative-method",
      file: "generative-method.svg",
      altText:
        "A Museum diagram linking a cited source snapshot, an open analysis script, and a deterministic result set.",
      creditLine:
        "6529 Network Museum, Reproducible Generative Analysis, 2026. CC0 1.0.",
    },
    "from-public-repository-to-on-chain-museum-record": {
      id: "museum-research-repository-to-chain",
      file: "repository-to-chain.svg",
      altText:
        "A Museum diagram distinguishing the open record, its cryptographic commitment, the future contract, and the public display.",
      creditLine:
        "6529 Network Museum, From Repository to Chain, 2026. CC0 1.0.",
    },
  };
  const diagram = diagrams[entry.slug];
  if (diagram === undefined) return undefined;
  return museumResearchEditorialMedia({
    id: diagram.id,
    file: diagram.file,
    altText: diagram.altText,
    creditLine: diagram.creditLine,
    licenseLabel: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  });
}

export function researchEditorialMobileMediaForEntry(
  entry: MuseumResearchIndexEntry
): MuseumMedia | undefined {
  const diagrams: Readonly<
    Record<string, { readonly id: string; readonly file: string }>
  > = {
    "generative-system-analysis-standard": {
      id: "museum-research-generative-method",
      file: "generative-method-mobile.svg",
    },
    "from-public-repository-to-on-chain-museum-record": {
      id: "museum-research-repository-to-chain",
      file: "repository-to-chain-mobile.svg",
    },
  };
  const diagram = diagrams[entry.slug];
  const desktop = researchEditorialMediaForEntry(entry);
  if (diagram === undefined || desktop === undefined) return undefined;
  return museumResearchEditorialMedia({
    id: diagram.id,
    file: diagram.file,
    altText: desktop.altText ?? entry.title,
    creditLine: desktop.credit.creditLine,
    licenseLabel: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  });
}

function researchMediaSrcSetForEntry(
  publication: MuseumPublication,
  entry: MuseumResearchIndexEntry
): string | undefined {
  const assignedWorkId =
    MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS[entry.id]?.workId;
  return assignedWorkId === undefined
    ? undefined
    : resolveExactWorkMediaById(publication, assignedWorkId).mediaSrcSet;
}

function sourcePath(paths: readonly string[] | undefined): string | undefined {
  return paths?.find((path) => path.trim().length > 0);
}

function sourcePathField(
  paths: readonly string[] | undefined
): { readonly sourcePath: string } | Record<string, never> {
  const value = sourcePath(paths);
  return value === undefined ? {} : { sourcePath: value };
}

function governedMediaField(
  media: MuseumMedia | undefined,
  title: string,
  srcSet?: string
):
  | {
      readonly media: {
        readonly kind: "governed";
        readonly src: string;
        readonly width: number | null;
        readonly height: number | null;
        readonly alt: string;
        readonly creditLine: string;
        readonly srcSet?: string;
        readonly sizes?: string;
      };
    }
  | Record<string, never> {
  return media === undefined
    ? {}
    : {
        media: {
          kind: "governed",
          src: media.url,
          width: media.width,
          height: media.height,
          alt: media.altText ?? title,
          creditLine: media.credit.creditLine,
          ...(srcSet === undefined
            ? {}
            : {
                srcSet,
                sizes:
                  "(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw",
              }),
        },
      };
}

function researchKindLabel(entry: MuseumResearchIndexEntry): string {
  if (MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS[entry.id] !== undefined) {
    return t(DEFAULT_LOCALE, "museum.network.research.acquisitionEssay");
  }
  if (entry.document === undefined) {
    return t(
      DEFAULT_LOCALE,
      "museum.network.research.documentKind.sourceRecord"
    );
  }
  return t(
    DEFAULT_LOCALE,
    museumDocumentKindLabelKey(entry.document.kind) as MessageKey
  );
}

function researchWorkRef(
  publication: MuseumPublication,
  id: string,
  relation: string
): MuseumEntityRef | null | undefined {
  const work =
    publication.works?.find((candidate) => candidate.id === id) ??
    publication.works?.find((candidate) =>
      publication.workAliases?.some(
        (alias) => alias.sourceObjectId === id && alias.workId === candidate.id
      )
    );
  if (work !== undefined) {
    const href = museumWorkHrefForSourceId(publication, work.id);
    if (href === null) return null;
    const stableMedia = resolveExactWorkMediaById(publication, work.id);
    return {
      kind: "work",
      id: work.id,
      label: work.title,
      href,
      relation,
      status: work.status,
      statusAsOf: work.statusAsOf,
      ...sourcePathField(work.sourcePaths),
      sourceCommit: publication.identity.commit,
      ...governedMediaField(
        stableMedia.media ?? selectMuseumStillMedia(work.media),
        work.title,
        stableMedia.mediaSrcSet
      ),
    };
  }

  const artwork = publication.artworks.find((candidate) => candidate.id === id);
  if (artwork === undefined) return undefined;
  const href = museumWorkHrefForSourceId(publication, artwork.id);
  if (href === null) return null;
  return {
    kind: "work",
    id: artwork.id,
    label: artwork.title,
    href,
    relation,
    ...governedMediaField(selectMuseumStillMedia(artwork.media), artwork.title),
  };
}

function researchArtistRef(
  publication: MuseumPublication,
  id: string,
  relation: string
): MuseumEntityRef | undefined {
  const artist = publication.artists.find((candidate) => candidate.id === id);
  if (artist === undefined) return undefined;
  return {
    kind: "artist",
    id: artist.id,
    label: artist.preferredName,
    href: museumArtistHref(artist.slug),
    relation,
    ...sourcePathField(artist.sourcePaths),
    sourceCommit: publication.identity.commit,
  };
}

function researchProjectRef(
  publication: MuseumPublication,
  id: string,
  relation: string
): MuseumEntityRef | undefined {
  const project = publication.projects.find((candidate) => candidate.id === id);
  if (project === undefined) return undefined;
  return {
    kind: "project",
    id: project.id,
    label: project.title,
    href: museumProjectHref(project.slug),
    relation,
    ...sourcePathField(project.sourcePaths),
    sourceCommit: publication.identity.commit,
  };
}

function researchAcquisitionRef(
  publication: MuseumPublication,
  id: string,
  relation: string
): MuseumEntityRef | undefined {
  const acquisition = publication.curatedAcquisitions?.find(
    (candidate) => candidate.id === id
  );
  if (acquisition === undefined) return undefined;
  return {
    kind: "curated_acquisition",
    id: acquisition.id,
    label: acquisition.title,
    href: museumAcquisitionHref(acquisition.slug),
    relation,
    status: acquisition.status,
    statusAsOf: acquisition.statusAsOf,
    ...sourcePathField(acquisition.sourcePaths),
    sourceCommit: publication.identity.commit,
  };
}

function researchProgramRef(
  publication: MuseumPublication,
  id: string,
  relation: string
): MuseumEntityRef | undefined {
  const program = publication.acquisitionPrograms?.find(
    (candidate) => candidate.id === id
  );
  if (program === undefined) return undefined;
  return {
    kind: "acquisition_program",
    id: program.id,
    label: program.title,
    href: museumAcquisitionProgramHref(program.slug),
    relation,
    status: program.status,
    statusAsOf: program.statusAsOf,
    ...sourcePathField(program.sourcePaths),
    sourceCommit: publication.identity.commit,
  };
}

function researchOrganizationRef(
  publication: MuseumPublication,
  id: string,
  relation: string
): MuseumEntityRef | undefined {
  const organization = publication.organizations?.find(
    (candidate) => candidate.id === id
  );
  if (organization === undefined) return undefined;
  return {
    kind: "organization",
    id: organization.id,
    label: organization.preferredName,
    href: museumOrganizationHref(organization.slug),
    relation,
    ...sourcePathField(organization.sourcePaths),
    sourceCommit: publication.identity.commit,
  };
}

function researchEntityRef(
  publication: MuseumPublication,
  id: string,
  relation: string
): MuseumEntityRef | null {
  const resolvers = [
    () => researchWorkRef(publication, id, relation),
    () => researchArtistRef(publication, id, relation),
    () => researchProjectRef(publication, id, relation),
    () => researchAcquisitionRef(publication, id, relation),
    () => researchProgramRef(publication, id, relation),
    () => researchOrganizationRef(publication, id, relation),
  ] as const;
  for (const resolve of resolvers) {
    const result = resolve();
    if (result !== undefined) return result;
  }
  return null;
}

function addResearchRelation(
  bucket: MuseumEntityRef[],
  seen: Set<string>,
  relation: MuseumEntityRef | null
): void {
  if (relation === null) return;
  const key = relation.kind + ":" + relation.id + ":" + relation.href;
  if (seen.has(key)) return;
  seen.add(key);
  bucket.push(relation);
}

function addResearchRelations(
  publication: MuseumPublication,
  bucket: MuseumEntityRef[],
  seen: Set<string>,
  ids: readonly string[],
  relation: string
): void {
  for (const id of ids) {
    addResearchRelation(
      bucket,
      seen,
      researchEntityRef(publication, id, relation)
    );
  }
}

export function buildMuseumResearchRelations(
  publication: MuseumPublication,
  entry: MuseumResearchIndexEntry
): MuseumEntityRelations {
  const typed = typedResearchPublicationForEntry(publication, entry);
  const primaryRelations: MuseumEntityRef[] = [];
  const secondaryRelations: MuseumEntityRef[] = [];
  const seen = new Set<string>();
  const typedSubjectIds = new Set(typed?.subjectIds ?? []);

  if (typed !== undefined) {
    publication.relations
      ?.filter(
        (relation) =>
          relation.from.id === typed.id &&
          relation.relation === "publication_interprets_entity"
      )
      .forEach((relation) => typedSubjectIds.add(relation.to.id));
  }
  addResearchRelations(
    publication,
    primaryRelations,
    seen,
    [...typedSubjectIds],
    "Interprets"
  );

  const document = entry.document;
  if (document !== undefined) {
    addResearchRelations(
      publication,
      primaryRelations,
      seen,
      document.artistIds,
      "Related artist"
    );
    addResearchRelations(
      publication,
      primaryRelations,
      seen,
      document.projectIds,
      "Related project"
    );
    addResearchRelations(
      publication,
      primaryRelations,
      seen,
      [...(document.workIds ?? []), ...document.artworkIds],
      "Related work"
    );
    addResearchRelations(
      publication,
      primaryRelations,
      seen,
      document.acquisitionIds ?? [],
      "Related acquisition"
    );
    addResearchRelations(
      publication,
      primaryRelations,
      seen,
      document.programIds ?? [],
      "Related program"
    );
    addResearchRelations(
      publication,
      primaryRelations,
      seen,
      document.organizationIds ?? [],
      "Related organization"
    );
  }

  addResearchRelations(
    publication,
    secondaryRelations,
    seen,
    typed?.authorIds ?? [],
    "Author"
  );

  return { primaryRelations, secondaryRelations };
}

export function buildMuseumResearchDetailEntry(
  publication: MuseumPublication,
  entry: MuseumResearchIndexEntry
): MuseumResearchDetailEntry | null {
  const relations = buildMuseumResearchRelations(publication, entry);
  const media =
    researchMediaForEntry(publication, entry) ??
    researchEditorialMediaForEntry(entry);
  const mediaSrcSet = researchMediaSrcSetForEntry(publication, entry);
  const groupCopy = museumResearchGroupCopy(entry.group);
  const kindLabel = researchKindLabel(entry);
  const acquisition = MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS[entry.id];
  let statusLabel: string | undefined;
  if (acquisition !== undefined) {
    statusLabel = t(DEFAULT_LOCALE, acquisition.statusKey);
  }
  const requestedSections = acquisition?.selectedSections;
  if (requestedSections !== undefined && entry.document === undefined) {
    return null;
  }
  const selectedMarkdown =
    requestedSections === undefined
      ? undefined
      : projectMuseumResearchReading(
          entry.document?.markdown ?? "",
          requestedSections
        );
  if (requestedSections !== undefined && selectedMarkdown === null) {
    return null;
  }
  const editorialDiagram = researchEditorialMediaForEntry(entry);
  const mobileMedia = researchEditorialMobileMediaForEntry(entry);
  const mediaQualifier =
    (acquisition === undefined
      ? undefined
      : t(DEFAULT_LOCALE, acquisition.qualifierKey)) ??
    (editorialDiagram === undefined
      ? undefined
      : t(DEFAULT_LOCALE, "museum.network.research.museumDiagram"));
  const descriptionOverride = RESEARCH_DETAIL_DESCRIPTION_OVERRIDES[entry.slug];
  const institutionalDisplayHref =
    entry.slug === "conflict-at-its-edges"
      ? buildImmutableMuseumBlobUrl(
          publication.identity.commit,
          "records/accessions/6529NM.2026.002/public/web-presentation-authority.md"
        )
      : null;
  if (
    entry.slug === "conflict-at-its-edges" &&
    institutionalDisplayHref === null
  ) {
    return null;
  }
  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    categoryLabel: groupCopy.label,
    categoryDescription: groupCopy.description,
    description:
      (descriptionOverride === undefined
        ? undefined
        : t(DEFAULT_LOCALE, descriptionOverride)) ??
      (acquisition === undefined
        ? undefined
        : t(DEFAULT_LOCALE, acquisition.descriptionKey)) ??
      entry.description ??
      groupCopy.description,
    kindLabel,
    ...(statusLabel === undefined ? {} : { statusLabel }),
    sourcePath: entry.sourcePath,
    ...(entry.document === undefined ? {} : { document: entry.document }),
    ...(entry.publicationUri === undefined
      ? {}
      : { publicationUri: entry.publicationUri }),
    ...(media === undefined ? {} : { media }),
    ...(mobileMedia === undefined ? {} : { mobileMedia }),
    ...(mediaSrcSet === undefined ? {} : { mediaSrcSet }),
    ...(mediaQualifier === undefined ? {} : { mediaQualifier }),
    ...(institutionalDisplayHref === null
      ? {}
      : {
          institutionalDisplay: {
            statement: t(
              DEFAULT_LOCALE,
              "museum.network.research.magnumDisplayBasis"
            ),
            href: institutionalDisplayHref,
            linkLabel: t(
              DEFAULT_LOCALE,
              "museum.network.research.readDisplayBasis"
            ),
          },
        }),
    ...(typeof selectedMarkdown === "string" ? { selectedMarkdown } : {}),
    primaryRelations: relations.primaryRelations,
    secondaryRelations: relations.secondaryRelations,
  };
}

async function findEntry(slug: string): Promise<{
  readonly entry: MuseumResearchDetailEntry | null;
  readonly publication: NonNullable<
    Awaited<ReturnType<typeof getMuseumPublicationState>>["publication"]
  >;
} | null> {
  const publication = (await getMuseumPublicationState()).publication;
  if (publication === null) return null;
  const entry = findMuseumResearchIndexEntry(publication, slug);
  if (entry === undefined) return null;
  return {
    entry: buildMuseumResearchDetailEntry(publication, entry),
    publication,
  };
}

export async function generateMetadata({
  params,
}: MuseumResearchDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const found = await findEntry(slug);
  const metadata = getAppMetadata({
    title:
      found?.entry?.title ??
      t(DEFAULT_LOCALE, "museum.network.research.indexTitle"),
    description:
      found?.entry?.description ??
      t(DEFAULT_LOCALE, "museum.network.research.indexDescription"),
  });
  const metadataEntry = found?.entry;
  return metadataEntry === null || metadataEntry === undefined
    ? metadata
    : {
        ...metadata,
        alternates: { canonical: museumResearchHref(metadataEntry.slug) },
      };
}

export default async function MuseumResearchDetailPage({
  params,
}: MuseumResearchDetailProps) {
  const { slug } = await params;
  const found = await findEntry(slug);
  if (found === null) notFound();
  const { entry, publication } = found;
  if (entry === null) return <MuseumPublicationUnavailable />;
  const workHrefs = museumWorkHrefIndex(publication);
  const context = buildMuseumEntityContext({
    kind: "research",
    id: entry.id,
    label: entry.title,
    canonicalHref: museumResearchHref(entry.slug),
    breadcrumbs: [
      { label: "6529 Network Museum", href: "/museum/network" },
      {
        label: t(DEFAULT_LOCALE, "museum.network.research.indexTitle"),
        href: "/museum/network/research",
      },
      { label: entry.title },
    ],
    primaryRelations: entry.primaryRelations,
    secondaryRelations: entry.secondaryRelations,
    sourcePath: entry.sourcePath,
    sourceCommit: publication.identity.commit,
  });
  if (context === null) return <MuseumPublicationUnavailable />;

  return (
    <MuseumResearchDetail
      entry={entry}
      context={context}
      workHrefs={workHrefs}
    />
  );
}
