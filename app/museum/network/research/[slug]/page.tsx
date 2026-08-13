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
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
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
  buildMuseumResearchIndex,
  museumResearchGroupCopy,
  type MuseumResearchIndexEntry,
} from "../page";

interface MuseumResearchDetailProps {
  readonly params: Promise<{ slug: string }>;
}

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

function researchSubjectIds(
  publication: MuseumPublication,
  entry: MuseumResearchIndexEntry,
  typed: MuseumResearchPublication | undefined
): readonly string[] {
  const ids = new Set<string>();
  const add = (values: readonly string[] | undefined) => {
    values?.forEach((value) => {
      if (value.trim().length > 0) ids.add(value);
    });
  };

  add(typed?.subjectIds);
  if (typed !== undefined) {
    publication.relations
      ?.filter(
        (relation) =>
          relation.from.id === typed.id &&
          relation.relation === "publication_interprets_entity"
      )
      .forEach((relation) => ids.add(relation.to.id));
  }
  const document = entry.document;
  if (document !== undefined) {
    add(document.artistIds);
    add(document.projectIds);
    add(document.artworkIds);
    add(document.workIds);
    add(document.acquisitionIds);
    add(document.programIds);
    add(document.organizationIds);
  }
  return [...ids];
}

function researchMediaForEntry(
  publication: MuseumPublication,
  entry: MuseumResearchIndexEntry,
  typed: MuseumResearchPublication | undefined
): MuseumMedia | undefined {
  const workIds = new Set<string>();
  const artworkIds = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string): void => {
    if (id.trim().length === 0 || visited.has(id)) return;
    visited.add(id);

    const work = publication.works?.find((candidate) => candidate.id === id);
    if (work !== undefined) {
      workIds.add(work.id);
      return;
    }
    const alias = publication.workAliases?.find(
      (candidate) => candidate.sourceObjectId === id
    );
    if (alias !== undefined) {
      workIds.add(alias.workId);
      return;
    }
    const artwork = publication.artworks.find(
      (candidate) => candidate.id === id
    );
    if (artwork !== undefined) {
      artworkIds.add(artwork.id);
      return;
    }

    const artist = publication.artists.find((candidate) => candidate.id === id);
    if (artist !== undefined) {
      artist.workIds?.forEach(visit);
      artist.artworkIds.forEach(visit);
      return;
    }
    const project = publication.projects.find(
      (candidate) => candidate.id === id
    );
    if (project !== undefined) {
      project.workIds?.forEach(visit);
      project.artworkIds.forEach(visit);
      (project.artistIds ?? [project.artistId]).forEach(visit);
      return;
    }
    const acquisition = publication.curatedAcquisitions?.find(
      (candidate) => candidate.id === id
    );
    if (acquisition !== undefined) {
      acquisition.workIds.forEach(visit);
      acquisition.projectIds.forEach(visit);
      acquisition.artistIds.forEach(visit);
      return;
    }
    const program = publication.acquisitionPrograms?.find(
      (candidate) => candidate.id === id
    );
    if (program !== undefined) {
      program.acquisitionIds.forEach(visit);
      return;
    }
    const organization = publication.organizations?.find(
      (candidate) => candidate.id === id
    );
    if (organization !== undefined) {
      organization.projectIds.forEach(visit);
      organization.artworkIds.forEach(visit);
    }
  };

  researchSubjectIds(publication, entry, typed).forEach(visit);
  for (const workId of workIds) {
    const work = publication.works?.find(
      (candidate) => candidate.id === workId
    );
    const media =
      work === undefined ? undefined : selectMuseumStillMedia(work.media);
    if (media !== undefined) return media;
  }
  for (const artworkId of artworkIds) {
    const artwork = publication.artworks.find(
      (candidate) => candidate.id === artworkId
    );
    const media =
      artwork === undefined ? undefined : selectMuseumStillMedia(artwork.media);
    if (media !== undefined) return media;
  }
  return entry.media;
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
  title: string
):
  | {
      readonly media: {
        readonly kind: "governed";
        readonly src: string;
        readonly width: number | null;
        readonly height: number | null;
        readonly alt: string;
        readonly creditLine: string;
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
        },
      };
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
      ...governedMediaField(selectMuseumStillMedia(work.media), work.title),
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
): MuseumResearchDetailEntry {
  const typed = typedResearchPublicationForEntry(publication, entry);
  const relations = buildMuseumResearchRelations(publication, entry);
  const media = researchMediaForEntry(publication, entry, typed);
  const groupCopy = museumResearchGroupCopy(entry.group);
  const kindLabel =
    entry.document === undefined
      ? t(DEFAULT_LOCALE, "museum.network.research.documentKind.sourceRecord")
      : t(
          DEFAULT_LOCALE,
          museumDocumentKindLabelKey(entry.document.kind) as MessageKey
        );
  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    categoryLabel: groupCopy.label,
    categoryDescription: groupCopy.description,
    kindLabel,
    sourcePath: entry.sourcePath,
    ...(entry.document === undefined ? {} : { document: entry.document }),
    ...(entry.publicationUri === undefined
      ? {}
      : { publicationUri: entry.publicationUri }),
    ...(media === undefined ? {} : { media }),
    primaryRelations: relations.primaryRelations,
    secondaryRelations: relations.secondaryRelations,
  };
}

async function findEntry(slug: string): Promise<{
  readonly entry: MuseumResearchDetailEntry;
  readonly publication: NonNullable<
    Awaited<ReturnType<typeof getMuseumPublicationState>>["publication"]
  >;
} | null> {
  const publication = (await getMuseumPublicationState()).publication;
  if (publication === null) return null;
  const entry = buildMuseumResearchIndex(publication).find(
    (candidate) => candidate.slug === slug
  );
  return entry === undefined
    ? null
    : {
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
      found?.entry.title ??
      t(DEFAULT_LOCALE, "museum.network.research.indexTitle"),
    description:
      found?.entry.categoryDescription ??
      t(DEFAULT_LOCALE, "museum.network.research.indexDescription"),
  });
  return found === null
    ? metadata
    : {
        ...metadata,
        alternates: { canonical: museumResearchHref(found.entry.slug) },
      };
}

export default async function MuseumResearchDetailPage({
  params,
}: MuseumResearchDetailProps) {
  const { slug } = await params;
  const found = await findEntry(slug);
  if (found === null) notFound();
  const { entry, publication } = found;
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
