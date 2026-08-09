import type {
  MuseumPublicEntityRecord,
  MuseumPublicRelationRecord,
  MuseumPublicRelationType,
} from "./types";
import { RELATION_PROFILES } from "./publicEntityGraphSchema";
import {
  isRecord,
  requiredObject,
  requiredString,
  stringArray,
} from "./publicEntityGraphPrimitives";

export function relationKey(relation: MuseumPublicRelationRecord): string {
  return `${relation.relationType}:${relation.sourceEntityId}:${relation.targetEntityId}`;
}

export function isActivePublicRelation(
  relation: MuseumPublicRelationRecord
): boolean {
  return relation.assertionStatus === "asserted" || relation.assertionStatus === "observed";
}

export function hasRelation(
  relations: readonly MuseumPublicRelationRecord[],
  relationType: MuseumPublicRelationType,
  sourceEntityId: string,
  targetEntityId: string
): boolean {
  return relations.some(
    (relation) =>
      isActivePublicRelation(relation) &&
      relation.relationType === relationType &&
      relation.sourceEntityId === sourceEntityId &&
      relation.targetEntityId === targetEntityId
  );
}

function activeRelations(
  relations: readonly MuseumPublicRelationRecord[],
  relationType: MuseumPublicRelationType,
  targetEntityId?: string
): readonly MuseumPublicRelationRecord[] {
  return relations.filter(
    (relation) =>
      isActivePublicRelation(relation) &&
      relation.relationType === relationType &&
      (targetEntityId === undefined || relation.targetEntityId === targetEntityId)
  );
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id) => right.includes(id));
}

/**
 * Collection membership is a relation fact, not a status shortcut. This
 * helper is also used by the public Work projection after graph validation.
 */
export function isRelationGatedCollectionMember(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): boolean {
  if (entity.entityType !== "WORK") return false;
  const lifecycle = entity.profile["work_lifecycle_status"];
  const membership = entity.profile["collection_membership"];
  if (!isRecord(membership)) return false;
  if (
    lifecycle !== "accessioned" ||
    membership["status"] !== "permanent_collection" ||
    typeof membership["collection_entity_id"] !== "string"
  ) {
    return false;
  }
  const collectionId = membership["collection_entity_id"];
  const accessionIds = stringArray(
    membership,
    "accession_entity_ids",
    "public_entity_graph_work_accessions",
    false
  );
  const profileAccessionIds = profileStringArray(entity, "accession_entity_ids", false);
  const collectionRelations = activeRelations(
    relations,
    "COLLECTION_CONTAINS_WORK",
    entity.id
  ).filter((relation) => relation.sourceEntityId === collectionId);
  const accessionRelations = activeRelations(
    relations,
    "ACCESSION_ADMITS_WORK",
    entity.id
  );
  return (
    collectionRelations.length === 1 &&
    collectionRelations[0]?.qualifier["collection_membership_status"] ===
      "permanent_collection" &&
    sameIds(accessionIds, profileAccessionIds) &&
    accessionIds.length > 0 &&
    accessionRelations.length === accessionIds.length &&
    accessionRelations.every((relation) =>
      accessionIds.includes(relation.sourceEntityId)
    ) &&
    accessionRelations.every(
      (relation) =>
        typeof relation.qualifier["accession_object_id"] === "string" &&
        relation.qualifier["accession_object_id"].trim().length > 0
    )
  );
}

export function profileStringArray(
  entity: MuseumPublicEntityRecord,
  key: string,
  required = false
): string[] {
  return stringArray(entity.profile, key, "public_entity_graph_profile_reference", required);
}

export function assertGraphReferences(
  entities: readonly MuseumPublicEntityRecord[],
  relations: readonly MuseumPublicRelationRecord[]
): void {
  const byId = new Map(entities.map((entity) => [entity.id, entity] as const));
  assertRelationReferences(byId, relations);
  for (const entity of entities) {
    assertEntityReferences(entity, relations);
  }
}

function assertRelationReferences(
  byId: ReadonlyMap<string, MuseumPublicEntityRecord>,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  const seenRelations = new Set<string>();
  for (const relation of relations) {
    const source = byId.get(relation.sourceEntityId);
    const target = byId.get(relation.targetEntityId);
    if (source === undefined || target === undefined) {
      throw new Error("public_entity_graph_dangling_relation");
    }
    const profile = RELATION_PROFILES[relation.relationType];
    if (
      !profile.sources.includes(source.entityType) ||
      !profile.targets.includes(target.entityType)
    ) {
      throw new Error("public_entity_graph_relation_domain");
    }
    const key = relationKey(relation);
    if (seenRelations.has(key)) {
      throw new Error("public_entity_graph_duplicate_relation");
    }
    seenRelations.add(key);
    if (source.id === target.id) {
      throw new Error("public_entity_graph_self_relation");
    }
    if (relation.relationType === "ENTITY_HAS_MEDIA") {
      assertMediaRelation(source, target);
    }
  }
}

function assertMediaRelation(
  source: MuseumPublicEntityRecord,
  target: MuseumPublicEntityRecord
): void {
  const mediaProfile = requiredObject(
    target.profile,
    "media",
    "public_entity_graph_media"
  );
  if (mediaProfile["subject_entity_id"] !== source.id) {
    throw new Error("public_entity_graph_media_subject");
  }
  if (!(source.mediaEntityIds ?? []).includes(target.id)) {
    throw new Error("public_entity_graph_media_back_reference");
  }
}

function assertEntityReferences(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  switch (entity.entityType) {
    case "INSTITUTION":
      assertInstitutionReferences(entity, relations);
      break;
    case "COLLECTION":
      assertCollectionReferences(entity, relations);
      break;
    case "WORK":
      assertWorkReferences(entity, relations);
      break;
    case "PROJECT_OR_SERIES":
      assertProjectReferences(entity, relations);
      break;
    case "CURATED_ACQUISITION":
      assertAcquisitionReferences(entity, relations);
      break;
    case "ACQUISITION_PROGRAM":
      assertProgramReferences(entity, relations);
      break;
    case "ACCESSION":
      assertAccessionReferences(entity, relations);
      break;
    case "AGENT":
    case "ARTIST":
    case "ORGANIZATION":
    case "RESEARCH_PUBLICATION":
    case "MEDIA_REFERENCE":
      break;
    case "EXHIBITION":
      throw new Error("public_entity_graph_exhibition_reserved");
  }
}

function assertInstitutionReferences(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  const collectionId = requiredString(
    entity.profile,
    "collection_entity_id",
    "public_entity_graph_collection_reference"
  );
  if (!hasRelation(relations, "INSTITUTION_HOLDS_COLLECTION", entity.id, collectionId)) {
    throw new Error("public_entity_graph_institution_relation_missing");
  }
}

function assertCollectionReferences(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  const declaredWorkIds = profileStringArray(entity, "admitted_work_entity_ids");
  const activeRelationsForCollection = relations.filter(
    (relation) =>
      isActivePublicRelation(relation) &&
      relation.relationType === "COLLECTION_CONTAINS_WORK" &&
      relation.sourceEntityId === entity.id
  );
  if (
    activeRelationsForCollection.length !== declaredWorkIds.length ||
    !sameIds(
      activeRelationsForCollection.map((relation) => relation.targetEntityId),
      declaredWorkIds
    )
  ) {
    throw new Error("public_entity_graph_collection_relation_missing");
  }
  for (const relation of activeRelationsForCollection) {
    if (relation.qualifier["collection_membership_status"] !== "permanent_collection") {
      throw new Error("public_entity_graph_collection_relation_qualifier");
    }
  }
}

function assertWorkReferences(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  assertWorkCreators(entity, relations);
  assertWorkProjects(entity, relations);
  assertWorkAcquisitions(entity, relations);
  assertWorkPrograms(entity, relations);
  assertWorkAccessions(entity, relations);
  assertWorkCollection(entity, relations);
  assertWorkMedia(entity, relations);
}

function assertWorkMedia(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  const declaredMediaIds = entity.mediaEntityIds ?? [];
  const activeMediaIds = relations
    .filter(
      (relation) =>
        isActivePublicRelation(relation) &&
        relation.relationType === "ENTITY_HAS_MEDIA" &&
        relation.sourceEntityId === entity.id
    )
    .map((relation) => relation.targetEntityId);
  if (
    declaredMediaIds.length === 0 ||
    activeMediaIds.length !== declaredMediaIds.length ||
    !sameIds(activeMediaIds, declaredMediaIds)
  ) {
    throw new Error("public_entity_graph_work_media_missing");
  }
}

function assertWorkCreators(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  for (const creatorId of profileStringArray(entity, "creator_entity_ids")) {
    if (
      !hasRelation(relations, "ARTIST_CREATES_WORK", creatorId, entity.id) &&
      !hasRelation(relations, "AGENT_PLAYS_ROLE", creatorId, entity.id)
    ) {
      throw new Error("public_entity_graph_creator_relation_missing");
    }
  }
}

function assertWorkProjects(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  for (const projectId of profileStringArray(entity, "project_or_series_entity_ids")) {
    if (!hasRelation(relations, "PROJECT_CONTEXTUALIZES_WORK", projectId, entity.id)) {
      throw new Error("public_entity_graph_project_relation_missing");
    }
  }
}

function assertWorkAcquisitions(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  const declaredAcquisitionIds = profileStringArray(
    entity,
    "acquisition_entity_ids"
  );
  const activeAcquisitionIds = relations
    .filter(
      (relation) =>
        isActivePublicRelation(relation) &&
        relation.relationType === "CURATED_ACQUISITION_BRINGS_TOGETHER_WORK" &&
        relation.targetEntityId === entity.id
    )
    .map((relation) => relation.sourceEntityId);
  if (!sameIds(activeAcquisitionIds, declaredAcquisitionIds)) {
    throw new Error("public_entity_graph_acquisition_relation_missing");
  }
}

function assertWorkPrograms(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  const lifecycle = requiredString(
    entity.profile,
    "work_lifecycle_status",
    "public_entity_graph_work_status"
  );
  for (const programId of profileStringArray(entity, "program_entity_ids")) {
    if (
      lifecycle === "selected_through_acquisition_program" &&
      !hasRelation(relations, "PROGRAM_SELECTS_WORK", programId, entity.id)
    ) {
      throw new Error("public_entity_graph_program_relation_missing");
    }
  }
}

function assertWorkAccessions(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  const declaredAccessionIds = profileStringArray(
    entity,
    "accession_entity_ids",
    false
  );
  const activeAccessionRelations = activeRelations(
    relations,
    "ACCESSION_ADMITS_WORK",
    entity.id
  );
  if (
    activeAccessionRelations.length !== declaredAccessionIds.length ||
    !sameIds(
      activeAccessionRelations.map((relation) => relation.sourceEntityId),
      declaredAccessionIds
    )
  ) {
    throw new Error("public_entity_graph_accession_relation_missing");
  }
  for (const relation of activeAccessionRelations) {
    if (
      typeof relation.qualifier["accession_object_id"] !== "string" ||
      relation.qualifier["accession_object_id"].trim().length === 0
    ) {
      throw new Error("public_entity_graph_accession_relation_qualifier");
    }
  }
}

function assertWorkCollection(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  const membership = requiredObject(
    entity.profile,
    "collection_membership",
    "public_entity_graph_membership"
  );
  const lifecycle = requiredString(
    entity.profile,
    "work_lifecycle_status",
    "public_entity_graph_work_status"
  );
  const membershipStatus = requiredString(
    membership,
    "status",
    "public_entity_graph_work_membership_status"
  );
  if (
    membershipStatus !== "permanent_collection" &&
    membershipStatus !== "not_in_collection"
  ) {
    throw new Error("public_entity_graph_work_membership_status");
  }
  const collectionRelations = activeRelations(
    relations,
    "COLLECTION_CONTAINS_WORK",
    entity.id
  );
  if (membershipStatus === "permanent_collection" || lifecycle === "accessioned") {
    if (
      membershipStatus !== "permanent_collection" ||
      lifecycle !== "accessioned" ||
      !isRelationGatedCollectionMember(entity, relations)
    ) {
      throw new Error("public_entity_graph_collection_membership_gate");
    }
  } else if (
    collectionRelations.some(
      (relation) =>
        relation.qualifier["collection_membership_status"] ===
        "permanent_collection"
    )
  ) {
    throw new Error("public_entity_graph_collection_membership_gate");
  }
}

function assertProjectReferences(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  for (const workId of profileStringArray(entity, "work_entity_ids")) {
    if (!hasRelation(relations, "PROJECT_CONTEXTUALIZES_WORK", entity.id, workId)) {
      throw new Error("public_entity_graph_project_relation_missing");
    }
  }
}

function assertAcquisitionReferences(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  const declaredWorkIds = profileStringArray(entity, "work_entity_ids");
  const activeWorkRelations = relations.filter(
    (relation) =>
      isActivePublicRelation(relation) &&
      relation.relationType === "CURATED_ACQUISITION_BRINGS_TOGETHER_WORK" &&
      relation.sourceEntityId === entity.id
  );
  if (
    activeWorkRelations.length !== declaredWorkIds.length ||
    !sameIds(
      activeWorkRelations.map((relation) => relation.targetEntityId),
      declaredWorkIds
    )
  ) {
    throw new Error("public_entity_graph_acquisition_relation_missing");
  }
  const pathway = requiredObject(
    entity.profile,
    "program_or_pathway",
    "public_entity_graph_pathway"
  );
  for (const programId of stringArray(pathway, "entity_ids", "public_entity_graph_pathway_entities", false)) {
    if (!hasRelation(relations, "ACQUISITION_PROGRAM_PRODUCES_ACQUISITION", programId, entity.id)) {
      throw new Error("public_entity_graph_program_acquisition_relation_missing");
    }
  }
}

function assertProgramReferences(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  for (const acquisitionId of profileStringArray(entity, "produced_acquisition_entity_ids")) {
    if (!hasRelation(relations, "ACQUISITION_PROGRAM_PRODUCES_ACQUISITION", entity.id, acquisitionId)) {
      throw new Error("public_entity_graph_program_acquisition_relation_missing");
    }
  }
}

function assertAccessionReferences(
  entity: MuseumPublicEntityRecord,
  relations: readonly MuseumPublicRelationRecord[]
): void {
  const declaredWorkIds = profileStringArray(
    entity,
    "admitted_work_entity_ids"
  );
  const activeWorkRelations = activeRelations(
    relations,
    "ACCESSION_ADMITS_WORK",
    undefined
  ).filter((relation) => relation.sourceEntityId === entity.id);
  if (
    activeWorkRelations.length !== declaredWorkIds.length ||
    !sameIds(
      activeWorkRelations.map((relation) => relation.targetEntityId),
      declaredWorkIds
    )
  ) {
    throw new Error("public_entity_graph_accession_inverse_missing");
  }
  for (const relation of activeWorkRelations) {
    if (
      typeof relation.qualifier["accession_object_id"] !== "string" ||
      relation.qualifier["accession_object_id"].trim().length === 0
    ) {
      throw new Error("public_entity_graph_accession_relation_qualifier");
    }
  }
}

export function requireEntity(
  entities: readonly MuseumPublicEntityRecord[],
  id: string,
  code: string
): MuseumPublicEntityRecord {
  const entity = entities.find((candidate) => candidate.id === id);
  if (entity === undefined) throw new Error(code);
  return entity;
}

export function uniqueIds(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

export function assertProfileObject(value: unknown, code: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(code);
  return value;
}
