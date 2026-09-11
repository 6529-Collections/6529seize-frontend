import { buildImmutableMuseumBlobUrl, isExactGitCommit } from "./security";
import type {
  MuseumPublicDocument,
  MuseumPublicEntityGraph,
  MuseumPublicEntityRecord,
  MuseumPublicEntityType,
  MuseumPublicWork,
  MuseumPublication,
  MuseumSourceDocument,
} from "./types";
import {
  MARTIN_GRASSER_ARTIST_SLUG,
  VERA_MOLNAR_ARTIST_SLUG,
  VERA_MOLNAR_OBJECT_ID,
  VERA_MOLNAR_PUBLIC_PATHS,
} from "./veraMolnarPublication";

interface MuseumTypedDocumentProjectionInput {
  readonly graph: MuseumPublicEntityGraph;
  readonly publication: MuseumPublication;
  readonly sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>;
}

interface MuseumTypedDocumentProjection {
  readonly documents: readonly MuseumPublicDocument[];
  readonly documentIdsByEntity: ReadonlyMap<string, readonly string[]>;
}

const GITHUB_REPOSITORY_PATH = "/6529-Collections/6529networkmuseum/blob/main/";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pathFromGovernedRepositoryUri(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "github.com" ||
      parsed.username.length > 0 ||
      parsed.password.length > 0 ||
      parsed.port.length > 0 ||
      parsed.search.length > 0 ||
      parsed.hash.length > 0 ||
      !parsed.pathname.startsWith(GITHUB_REPOSITORY_PATH)
    ) {
      return null;
    }
    const path = decodeURIComponent(
      parsed.pathname.slice(GITHUB_REPOSITORY_PATH.length)
    );
    return path.length > 0 ? path : null;
  } catch {
    return null;
  }
}

function collectRepositoryPaths(value: unknown, output: Set<string>): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectRepositoryPaths(item, output));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "uri") {
      const path = pathFromGovernedRepositoryUri(child);
      if (path !== null) output.add(path);
    }
    collectRepositoryPaths(child, output);
  }
}

function collectSourceRecordIds(value: unknown, output: Set<string>): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSourceRecordIds(item, output));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "source_record_id" && typeof child === "string") {
      output.add(child);
    } else if (key === "source_record_ids" && Array.isArray(child)) {
      child.forEach((item) => {
        if (typeof item === "string") output.add(item);
      });
    }
    collectSourceRecordIds(child, output);
  }
}

function sourceRecordMatchesPath(
  sourceRecordId: string,
  path: string
): boolean {
  if (path.includes(sourceRecordId)) return true;
  const outcome = /^(.*?)-(OUT|OBJ)-(\d{3})$/u.exec(sourceRecordId);
  if (outcome !== null) {
    const parent = outcome[1];
    const kind = outcome[2];
    const number = outcome[3];
    if (parent === undefined || kind === undefined || number === undefined) {
      return false;
    }
    const suffix = `${kind}-${number}`;
    return path.includes(parent) && path.includes(suffix);
  }
  return false;
}

function entitySourceRecordIds(
  entity: MuseumPublicEntityRecord,
  graph: MuseumPublicEntityGraph
): Set<string> {
  const ids = new Set(entity.sourceRecordIds);
  collectSourceRecordIds(entity.profile, ids);
  for (const relation of graph.relations) {
    if (
      relation.sourceEntityId === entity.id ||
      relation.targetEntityId === entity.id
    ) {
      relation.sourceRecordIds.forEach((id) => ids.add(id));
    }
  }
  return ids;
}

function entityOwnSourceRecordIds(
  entity: MuseumPublicEntityRecord
): Set<string> {
  const ids = new Set(entity.sourceRecordIds);
  collectSourceRecordIds(entity.profile, ids);
  return ids;
}

function entitySlug(entity: MuseumPublicEntityRecord): string | null {
  return entity.slug?.trim().toLocaleLowerCase() ?? null;
}

function compatibilityDocumentPaths(
  entity: MuseumPublicEntityRecord,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>
): readonly string[] {
  const paths = [...sourceDocuments.keys()];
  const slug = entitySlug(entity);
  if (slug !== null) {
    const slugMatches = paths.filter((path) =>
      path.toLocaleLowerCase().includes(`${slug}.`)
    );
    if (slugMatches.length > 0) return slugMatches;
  }
  const programKind = entity.profile["program_kind"];
  if (
    entity.entityType === "ACQUISITION_PROGRAM" &&
    programKind === "donation_pathway"
  ) {
    return paths.filter((path) =>
      path.endsWith("policies/donation-acceptance.md")
    );
  }
  return [];
}

function candidatePaths(
  entity: MuseumPublicEntityRecord,
  graph: MuseumPublicEntityGraph,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>
): readonly string[] {
  const veraPaths = veraMolnarCandidatePaths(entity, graph);
  if (entity.entityType === "WORK") {
    return uniquePaths([
      ...workCandidatePaths(entity, sourceDocuments),
      ...veraPaths,
    ]).filter((path) => sourceDocuments.has(path));
  }
  if (entity.entityType === "ARTIST") {
    return uniquePaths([
      ...artistCandidatePaths(entity, sourceDocuments),
      ...veraPaths,
    ]).filter((path) => sourceDocuments.has(path));
  }
  if (entity.entityType === "PROJECT_OR_SERIES") {
    return uniquePaths([
      ...projectCandidatePaths(entity, sourceDocuments),
      ...veraPaths,
    ]).filter((path) => sourceDocuments.has(path));
  }
  const paths = new Set<string>();
  collectRepositoryPaths(entity.profile, paths);
  const sourceIds = entitySourceRecordIds(entity, graph);
  for (const path of sourceDocuments.keys()) {
    if ([...sourceIds].some((id) => sourceRecordMatchesPath(id, path))) {
      paths.add(path);
    }
  }
  compatibilityDocumentPaths(entity, sourceDocuments).forEach((path) =>
    paths.add(path)
  );
  return uniquePaths([...paths, ...veraPaths])
    .filter((path) => sourceDocuments.has(path))
    .sort((left, right) => left.localeCompare(right));
}

function uniquePaths(paths: readonly string[]): readonly string[] {
  return [...new Set(paths)];
}

function veraMolnarCandidatePaths(
  entity: MuseumPublicEntityRecord,
  graph: MuseumPublicEntityGraph
): readonly string[] {
  const veraWork = graph.entities.find(
    (candidate) =>
      candidate.entityType === "WORK" &&
      candidate.sourceRecordIds.includes(VERA_MOLNAR_OBJECT_ID)
  );
  if (veraWork === undefined) return [];
  if (entity.id === veraWork.id) {
    return [
      VERA_MOLNAR_PUBLIC_PATHS.objectEntry,
      VERA_MOLNAR_PUBLIC_PATHS.sourceChronology,
    ];
  }
  const related = graph.relations.some((relation) => {
    if (
      relation.targetEntityId !== veraWork.id ||
      relation.sourceEntityId !== entity.id
    ) {
      return false;
    }
    return (
      (entity.entityType === "ARTIST" &&
        relation.relationType === "ARTIST_CREATES_WORK") ||
      (entity.entityType === "PROJECT_OR_SERIES" &&
        relation.relationType === "PROJECT_CONTEXTUALIZES_WORK") ||
      (entity.entityType === "CURATED_ACQUISITION" &&
        relation.relationType === "CURATED_ACQUISITION_BRINGS_TOGETHER_WORK")
    );
  });
  if (!related) return [];
  if (entity.entityType === "ARTIST") {
    if (entity.slug === MARTIN_GRASSER_ARTIST_SLUG) {
      return [VERA_MOLNAR_PUBLIC_PATHS.collaboratorPractice];
    }
    return entity.slug === VERA_MOLNAR_ARTIST_SLUG
      ? [VERA_MOLNAR_PUBLIC_PATHS.artistPractice]
      : [];
  }
  if (entity.entityType === "PROJECT_OR_SERIES") {
    return [VERA_MOLNAR_PUBLIC_PATHS.projectEssay];
  }
  if (entity.entityType === "CURATED_ACQUISITION") {
    return [VERA_MOLNAR_PUBLIC_PATHS.acquisitionEssay];
  }
  return [];
}

function entityScopedCandidatePaths(
  entity: MuseumPublicEntityRecord,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>,
  publicPathMatches: (path: string, slug: string) => boolean
): readonly string[] {
  const paths = new Set<string>();
  if (sourceDocuments.has(entity.sourcePath)) paths.add(entity.sourcePath);
  collectRepositoryPaths(entity.profile, paths);
  const slug = entitySlug(entity);
  for (const path of sourceDocuments.keys()) {
    if (slug !== null && publicPathMatches(path.toLocaleLowerCase(), slug)) {
      paths.add(path);
    }
  }
  return [...paths]
    .filter((path) => sourceDocuments.has(path))
    .sort((left, right) => left.localeCompare(right));
}

function artistCandidatePaths(
  entity: MuseumPublicEntityRecord,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>
): readonly string[] {
  return entityScopedCandidatePaths(
    entity,
    sourceDocuments,
    (path, slug) =>
      path.endsWith(`/public/artists/${slug}.md`) ||
      path.endsWith(`/public/scholarship/artists/${slug}.md`)
  );
}

function projectCandidatePaths(
  entity: MuseumPublicEntityRecord,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>
): readonly string[] {
  return entityScopedCandidatePaths(
    entity,
    sourceDocuments,
    (path, slug) =>
      path.endsWith(`/projects/${slug}.md`) ||
      path.endsWith(`/public/scholarship/entities/${slug}.md`)
  );
}

function documentStem(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

function workNumber(sourceRecordIds: ReadonlySet<string>): string | null {
  for (const sourceRecordId of sourceRecordIds) {
    const outcome = /(?:OBJ|OUT)-(\d{3})$/u.exec(sourceRecordId);
    if (outcome?.[1] !== undefined) {
      return String(Number(outcome[1])).padStart(2, "0");
    }
    const accessionObject = /\.(\d{2})$/u.exec(sourceRecordId);
    if (accessionObject?.[1] !== undefined) {
      return accessionObject[1];
    }
  }
  return null;
}

function workContextPathTokens(
  sourceRecordIds: ReadonlySet<string>
): readonly string[] {
  return [...sourceRecordIds].flatMap((sourceRecordId) => {
    const tokens = [sourceRecordId];
    const accessionObject = /^(.*)\.\d{2}$/u.exec(sourceRecordId);
    if (accessionObject?.[1] !== undefined) tokens.push(accessionObject[1]);
    return tokens;
  });
}

function isWorkManuscriptPath(
  path: string,
  title: string,
  sourceRecordIds: ReadonlySet<string>
): boolean {
  const normalizedPath = path.toLocaleLowerCase();
  if (!normalizedPath.endsWith(".md")) return false;
  if (/\/public\/scholarship\/works\/\d{2}-[^/]+\.md$/u.test(normalizedPath)) {
    const number = workNumber(sourceRecordIds);
    const sharesProposalContext = [...sourceRecordIds].some(
      (sourceRecordId) =>
        sourceRecordId.startsWith("6529NM-PG-") &&
        normalizedPath.includes(sourceRecordId.toLocaleLowerCase())
    );
    return (
      sharesProposalContext &&
      number !== null &&
      normalizedPath.split("/").at(-1)?.startsWith(`${number}-`) === true
    );
  }
  if (/\/public\/works\/[^/]+\.md$/u.test(normalizedPath)) {
    const expectedStem = documentStem(title);
    const fileStem = normalizedPath.split("/").at(-1)?.slice(0, -3);
    return (
      fileStem !== undefined &&
      (fileStem === expectedStem || expectedStem.endsWith(`-${fileStem}`))
    );
  }
  if (/\/public\/\d{4}nm\.\d{4}\.\d{3}\.\d{2}\.md$/u.test(normalizedPath)) {
    const sourceRecordId = normalizedPath.split("/").at(-1)?.slice(0, -3);
    return (
      sourceRecordId !== undefined &&
      [...sourceRecordIds].some(
        (candidate) => candidate.toLocaleLowerCase() === sourceRecordId
      )
    );
  }
  return false;
}

function workCandidatePaths(
  entity: MuseumPublicEntityRecord,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>
): readonly string[] {
  const paths = new Set<string>();
  const sourceRecordIds = entityOwnSourceRecordIds(entity);
  const title =
    typeof entity.profile["title"] === "string"
      ? entity.profile["title"]
      : entity.label;

  if (sourceDocuments.has(entity.sourcePath)) paths.add(entity.sourcePath);
  const profilePaths = new Set<string>();
  collectRepositoryPaths(entity.profile, profilePaths);
  for (const path of profilePaths) {
    if (isWorkManuscriptPath(path, title, sourceRecordIds)) paths.add(path);
  }
  for (const path of sourceDocuments.keys()) {
    if (isWorkPublicDocumentPath(path, title, sourceRecordIds)) {
      paths.add(path);
      continue;
    }
    const source = sourceDocuments.get(path);
    const outcomeIds = [...sourceRecordIds].filter((id) =>
      /-(?:OUT|OBJ)-\d{3}$/u.test(id)
    );
    if (
      path.includes("/public/works/") &&
      source !== undefined &&
      outcomeIds.some((id) => {
        const outcomeSuffix = /((?:OUT|OBJ)-\d{3})$/u.exec(id)?.[1];
        return (
          source.text.includes(id) ||
          (outcomeSuffix !== undefined && source.text.includes(outcomeSuffix))
        );
      })
    ) {
      paths.add(path);
    }
  }
  return [...paths].sort((left, right) => left.localeCompare(right));
}

function isWorkPublicDocumentPath(
  path: string,
  title: string,
  sourceRecordIds: ReadonlySet<string>
): boolean {
  return (
    isWorkManuscriptPath(path, title, sourceRecordIds) ||
    (path.endsWith("/public/title-rights-and-accession-review.md") &&
      workContextPathTokens(sourceRecordIds).some((token) =>
        path.includes(token)
      ))
  );
}

function researchDocumentPath(
  entity: MuseumPublicEntityRecord,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>,
  sourceCommit: string
): string {
  const uri = entity.profile["publication_document_uri"];
  const path = pathFromGovernedRepositoryUri(uri);
  if (
    path === null ||
    !sourceDocuments.has(path) ||
    buildImmutableMuseumBlobUrl(sourceCommit, path) === null
  ) {
    throw new Error("public_entity_graph_research_document_join");
  }
  return path;
}

function titleFromDocument(path: string, text: string): string {
  const heading = /^#\s+(.+)$/mu.exec(text)?.[1]?.trim();
  if (heading !== undefined && heading.length > 0) return heading;
  return (
    path
      .split("/")
      .at(-1)
      ?.replace(/\.[^.]+$/u, "") ?? path
  );
}

function documentKind(
  path: string,
  entityType: MuseumPublicEntityType
): MuseumPublicDocument["kind"] {
  if (path.endsWith(".json")) return "source_record";
  if (path === VERA_MOLNAR_PUBLIC_PATHS.artistPractice) {
    return "artist_practice";
  }
  if (path === VERA_MOLNAR_PUBLIC_PATHS.collaboratorPractice) {
    return "artist_practice";
  }
  if (path === VERA_MOLNAR_PUBLIC_PATHS.projectEssay) {
    return "project_essay";
  }
  if (path === VERA_MOLNAR_PUBLIC_PATHS.acquisitionEssay) {
    return "acquisition_essay";
  }
  if (path === VERA_MOLNAR_PUBLIC_PATHS.sourceChronology) {
    return "source_chronology_matrix";
  }
  if (/\/public\/\d{4}NM\.\d{4}\.\d{3}\.\d{2}\.md$/u.test(path)) {
    return "object_entry";
  }
  if (
    path.includes("/public/scholarship/works/") ||
    path.includes("/public/works/")
  ) {
    return "object_entry";
  }
  if (
    path.includes("/public/scholarship/artists/") ||
    path.includes("/public/artists/")
  ) {
    return "artist_practice";
  }
  if (path.includes("/public/scholarship/essays/")) {
    return "acquisition_essay";
  }
  if (path.includes("/public/scholarship/entities/")) {
    return "project_essay";
  }
  if (path.endsWith("/public/title-rights-and-accession-review.md")) {
    return "title_rights_accession_review";
  }
  if (path.endsWith("casey-reas-artist-practice.md")) {
    return "artist_practice";
  }
  if (path.endsWith("casey-reas-collection-essay.md")) {
    return "collection_essay";
  }
  if (path.endsWith("gift-into-public-trust.md")) return "gift_narrative";
  if (path.includes("/projects/")) return "project_essay";
  if (entityType === "ACQUISITION_PROGRAM") return "program_essay";
  if (entityType === "CURATED_ACQUISITION") return "acquisition_essay";
  return "source_record";
}

function generatedDocument(
  path: string,
  source: MuseumSourceDocument,
  entity: MuseumPublicEntityRecord
): MuseumPublicDocument {
  return {
    id: `typed-source:${path}`,
    kind: documentKind(path, entity.entityType),
    title: titleFromDocument(path, source.text),
    markdown: source.text,
    sha256: source.sha256,
    sourcePath: path,
    artistIds: entity.entityType === "ARTIST" ? [entity.id] : [],
    projectIds: entity.entityType === "PROJECT_OR_SERIES" ? [entity.id] : [],
    giftIds: [],
    artworkIds: [],
    workIds: entity.entityType === "WORK" ? [entity.id] : [],
    acquisitionIds:
      entity.entityType === "CURATED_ACQUISITION" ? [entity.id] : [],
    programIds: entity.entityType === "ACQUISITION_PROGRAM" ? [entity.id] : [],
    organizationIds: entity.entityType === "ORGANIZATION" ? [entity.id] : [],
    sourceRecordIds: entity.sourceRecordIds,
  };
}

function mergeDocument(
  documents: Map<string, MuseumPublicDocument>,
  path: string,
  source: MuseumSourceDocument,
  entity: MuseumPublicEntityRecord
): string {
  const existing = [...documents.values()].find(
    (document) => document.sourcePath === path
  );
  if (existing !== undefined) {
    const addEntity = (
      values: readonly string[],
      entityType: MuseumPublicEntityType
    ): readonly string[] =>
      entity.entityType === entityType
        ? [...new Set([...values, entity.id])]
        : values;
    documents.set(existing.id, {
      ...existing,
      artistIds: addEntity(existing.artistIds, "ARTIST"),
      projectIds: addEntity(existing.projectIds, "PROJECT_OR_SERIES"),
      workIds: addEntity(existing.workIds ?? [], "WORK"),
      acquisitionIds: addEntity(
        existing.acquisitionIds ?? [],
        "CURATED_ACQUISITION"
      ),
      programIds: addEntity(existing.programIds ?? [], "ACQUISITION_PROGRAM"),
      organizationIds: addEntity(
        existing.organizationIds ?? [],
        "ORGANIZATION"
      ),
      sourceRecordIds: [
        ...new Set([
          ...(existing.sourceRecordIds ?? []),
          ...entity.sourceRecordIds,
        ]),
      ],
    });
    return existing.id;
  }
  const document = generatedDocument(path, source, entity);
  documents.set(document.id, document);
  return document.id;
}

export function buildMuseumTypedDocumentProjection(
  input: MuseumTypedDocumentProjectionInput
): MuseumTypedDocumentProjection {
  if (!isExactGitCommit(input.graph.sourceCommit)) {
    throw new Error("public_entity_graph_document_commit");
  }
  const documents = new Map(
    input.publication.documents.map(
      (document) => [document.id, document] as const
    )
  );
  const documentIdsByEntity = new Map<string, readonly string[]>();

  for (const entity of input.graph.entities) {
    let paths = candidatePaths(entity, input.graph, input.sourceDocuments);
    if (entity.entityType === "RESEARCH_PUBLICATION") {
      paths = [
        researchDocumentPath(
          entity,
          input.sourceDocuments,
          input.graph.sourceCommit
        ),
      ];
    }
    const ids = paths.map((path) =>
      mergeDocument(documents, path, input.sourceDocuments.get(path)!, entity)
    );
    documentIdsByEntity.set(entity.id, [...new Set(ids)]);
  }

  return {
    documents: [...documents.values()],
    documentIdsByEntity,
  };
}

/**
 * Work pages expose the governed object/work manuscript and any explicitly
 * joined public rights record, not machine or receipt documents that happen to
 * cite the same acquisition. JSON source records remain available through the
 * immutable source link in the colophon.
 */
export function selectMuseumPublicWorkDocuments(
  work: MuseumPublicWork,
  documents: readonly MuseumPublicDocument[]
): readonly MuseumPublicDocument[] {
  const documentIds = new Set(work.documentIds);
  const sourceRecordIds = new Set(work.sourceRecordIds ?? []);
  return documents.filter(
    (document) =>
      documentIds.has(document.id) &&
      ((document.workIds?.length ?? 0) === 0 ||
        document.workIds?.includes(work.id) === true) &&
      isWorkPublicDocumentPath(document.sourcePath, work.title, sourceRecordIds)
  );
}
