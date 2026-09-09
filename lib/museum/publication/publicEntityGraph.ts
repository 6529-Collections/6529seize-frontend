import { isExactGitCommit } from "./security";
import type {
  MuseumPublication,
  MuseumPublicEntityGraph,
  MuseumSourceDocument,
} from "./types";
import {
  ENTITY_PATH_PATTERN,
  MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
  MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_PATH,
  MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA_PATH,
  RELATION_PATH_PATTERN,
} from "./publicEntityGraphSchema";
import {
  parseMuseumEntityRecord,
  parseMuseumRelationRecord,
} from "./publicEntityGraphParsing";
import { assertGraphReferences } from "./publicEntityGraphValidation";
import { parseMuseumIdentityInventory } from "./publicEntityGraphInventory";
import { parseMuseumRelationIdentityInventory } from "./publicEntityGraphRelationInventory";
import { assertMuseumWorkTypedReferences } from "./publicEntityGraphTypedReferences";
import { projectMuseumGraph } from "./publicEntityGraphProjection";
import { assertVeraMolnarActivation } from "./veraMolnarPublication";

export {
  MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
  MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_PATH,
  MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA_PATH,
} from "./publicEntityGraphSchema";

export function parseMuseumPublicEntityGraph(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  declaredSourcePaths: readonly string[],
  sourceCommit: string
): MuseumPublicEntityGraph | null {
  assertExactCommit(sourceCommit);
  const declared = new Set(declaredSourcePaths);
  if (declared.size !== declaredSourcePaths.length) {
    throw new Error("public_entity_graph_inventory_mismatch");
  }
  const activated = isGraphActivated(declared);
  if (!activated) return null;
  assertGraphInventoryIsComplete(declared);
  assertDeclaredGraphDocuments(documents, declared);
  const entityPaths = selectPaths(declared, ENTITY_PATH_PATTERN);
  const relationPaths = selectPaths(declared, RELATION_PATH_PATTERN);
  const entities = entityPaths.map((path) =>
    parseMuseumEntityRecord(documentForPath(documents, path), sourceCommit)
  );
  const relations = relationPaths.map((path) =>
    parseMuseumRelationRecord(documentForPath(documents, path), sourceCommit)
  );
  if (new Set(entities.map((entity) => entity.id)).size !== entities.length) {
    throw new Error("public_entity_graph_duplicate_entity");
  }
  assertGraphReferences(entities, relations);
  const identityInventory = parseMuseumIdentityInventory(
    documents.get(MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH),
    entities
  );
  assertMuseumWorkTypedReferences(entities, identityInventory);
  const relationIdentityInventory = parseMuseumRelationIdentityInventory(
    documents.get(MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_PATH),
    documents.get(MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA_PATH),
    relations
  );
  return {
    sourceCommit,
    entityPaths,
    relationPaths,
    entities,
    relations,
    identityInventory,
    relationIdentityInventory,
  };
}

function assertExactCommit(sourceCommit: string): void {
  if (!isExactGitCommit(sourceCommit)) {
    throw new Error("public_entity_graph_commit");
  }
}

function isGraphActivated(declared: ReadonlySet<string>): boolean {
  return (
    [...declared].some((path) => ENTITY_PATH_PATTERN.test(path)) ||
    [...declared].some((path) => RELATION_PATH_PATTERN.test(path)) ||
    declared.has(MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH) ||
    declared.has(MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_PATH) ||
    declared.has(MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA_PATH)
  );
}

function assertGraphInventoryIsComplete(declared: ReadonlySet<string>): void {
  const hasEntities = [...declared].some((path) =>
    ENTITY_PATH_PATTERN.test(path)
  );
  const hasRelations = [...declared].some((path) =>
    RELATION_PATH_PATTERN.test(path)
  );
  if (
    !declared.has(MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH) ||
    !declared.has(MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_PATH) ||
    !declared.has(MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA_PATH) ||
    !hasEntities ||
    !hasRelations
  ) {
    throw new Error("public_entity_graph_inventory_incomplete");
  }
}

function selectPaths(
  declared: ReadonlySet<string>,
  pattern: RegExp
): readonly string[] {
  return [...declared]
    .filter((path) => pattern.test(path))
    .sort((left, right) => left.localeCompare(right));
}

function assertDeclaredGraphDocuments(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  declared: ReadonlySet<string>
): void {
  for (const path of documents.keys()) {
    const isDeclaredGraphPath =
      ENTITY_PATH_PATTERN.test(path) || RELATION_PATH_PATTERN.test(path);
    if (isDeclaredGraphPath && !declared.has(path)) {
      throw new Error("public_entity_graph_inventory_mismatch");
    }
  }
  for (const path of [...declared].filter(isGraphPath)) {
    const document = documents.get(path);
    if (document === undefined) {
      throw new Error("public_entity_graph_document_missing");
    }
    if (document.path !== path || document.mediaType !== "application/json") {
      throw new Error("public_entity_graph_document_missing");
    }
  }
}

function isGraphPath(path: string): boolean {
  return ENTITY_PATH_PATTERN.test(path) || RELATION_PATH_PATTERN.test(path);
}

function documentForPath(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  path: string
): MuseumSourceDocument {
  const document = documents.get(path);
  if (document === undefined) {
    throw new Error("public_entity_graph_document_missing");
  }
  return document;
}

export function applyMuseumPublicEntityGraph(
  publication: MuseumPublication,
  graph: MuseumPublicEntityGraph,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument> = new Map(),
  catalogMediaAssetPaths: readonly string[] = []
): MuseumPublication {
  if (
    !isExactGitCommit(publication.identity.commit) ||
    publication.identity.commit !== graph.sourceCommit
  ) {
    throw new Error("public_entity_graph_commit_mismatch");
  }
  const projected = projectMuseumGraph(
    graph,
    publication,
    sourceDocuments,
    catalogMediaAssetPaths
  );
  assertTypedPublicationJoins(projected);
  assertVeraMolnarActivation({
    graph,
    publication: { ...publication, ...projected },
    sourceDocuments,
  });
  return {
    ...publication,
    ...projected,
    entityGraph: graph,
  };
}

function assertTypedPublicationJoins(
  projected: ReturnType<typeof projectMuseumGraph>
): void {
  const missingAcquisition = projected.curatedAcquisitions.some(
    (acquisition) => acquisition.sourceDocumentIds.length === 0
  );
  const missingProgram = projected.acquisitionPrograms.some(
    (program) => program.sourceDocumentIds.length === 0
  );
  if (missingAcquisition || missingProgram) {
    throw new Error("public_entity_graph_publication_join_missing");
  }
}
