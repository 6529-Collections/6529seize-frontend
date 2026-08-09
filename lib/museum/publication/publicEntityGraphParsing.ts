import type {
  MuseumPublicEntityRecord,
  MuseumPublicRelationRecord,
  MuseumSourceDocument,
} from "./types";
import {
  ENTITY_ID_PATTERNS,
  RELATION_PROFILES,
  RELATION_ASSERTION_STATUSES,
} from "./publicEntityGraphSchema";
import {
  assertStringEnum,
  isEntityType,
  isRelationType,
  parseDocument,
  parseEntityEnvelopeIdentity,
  parseRelationEnvelopeIdentity,
  requiredRecord,
  requiredString,
  stringArray,
} from "./publicEntityGraphPrimitives";
import { assertCanonicalIdentity, assertProfile } from "./publicEntityGraphProfiles";

export function parseMuseumEntityRecord(
  document: MuseumSourceDocument,
  sourceCommit?: string
): MuseumPublicEntityRecord {
  const payload = parseDocument(document, "PUBLIC_ENTITY", sourceCommit);
  const entityTypeValue = payload["entity_type"];
  if (!isEntityType(entityTypeValue)) {
    throw new Error("public_entity_graph_unknown_entity_type");
  }
  const entityType = entityTypeValue;
  const entityId = requiredString(
    payload,
    "entity_id",
    "public_entity_graph_entity_id"
  );
  parseMuseumEntityIdentity(document, entityType, entityId);
  const recordId = requiredString(
    payload,
    "record_id",
    "public_entity_graph_record_id"
  );
  if (recordId !== entityId) {
    throw new Error("public_entity_graph_record_entity_id");
  }
  const identity = assertCanonicalIdentity(
    payload,
    document.path,
    entityType,
    entityId
  );
  const entityStatus = assertStringEnum(
    payload,
    "entity_status",
    new Set(["published", "archived"]),
    "public_entity_graph_entity_status"
  ) as MuseumPublicEntityRecord["entityStatus"];
  const profile = assertProfile(payload, entityType);
  const sourceRecordIds = stringArray(
    payload,
    "source_record_ids",
    "public_entity_graph_source_records"
  );
  stringArray(payload, "references", "public_entity_graph_references", false);
  const mediaEntityIds = stringArray(
    payload,
    "media_entity_ids",
    "public_entity_graph_media_entities",
    false
  );
  return {
    id: entityId,
    entityType,
    label: requiredString(payload, "preferred_label", "public_entity_graph_label"),
    slug: identity.slug,
    canonicalRoute: identity.route,
    pageExposure: identity.exposure,
    entityStatus,
    sourcePath: document.path,
    sourceRecordIds,
    ...(mediaEntityIds.length > 0 ? { mediaEntityIds } : {}),
    profile,
  };
}

function parseMuseumEntityIdentity(
  document: MuseumSourceDocument,
  entityType: MuseumPublicEntityRecord["entityType"],
  entityId: string
): void {
  if (entityType === "EXHIBITION") {
    throw new Error("public_entity_graph_exhibition_reserved");
  }
  const pattern = ENTITY_ID_PATTERNS[entityType];
  if (pattern?.test(entityId) !== true) {
    throw new Error("public_entity_graph_entity_identity");
  }
  parseEntityEnvelopeIdentity(document, entityId);
}

export function parseMuseumRelationRecord(
  document: MuseumSourceDocument,
  sourceCommit?: string
): MuseumPublicRelationRecord {
  const payload = parseDocument(document, "PUBLIC_RELATION", sourceCommit);
  const relationTypeValue = payload["relation_type"];
  if (!isRelationType(relationTypeValue)) {
    throw new Error("public_entity_graph_unknown_relation_type");
  }
  const relationType = relationTypeValue;
  const relationId = requiredString(
    payload,
    "relation_id",
    "public_entity_graph_relation_id"
  );
  if (!/^6529NM-REL-[0-9]{4}$/u.test(relationId)) {
    throw new Error("public_entity_graph_relation_identity");
  }
  parseRelationEnvelopeIdentity(document, relationId);
  const assertionStatus = assertStringEnum(
    payload,
    "assertion_status",
    RELATION_ASSERTION_STATUSES,
    "public_entity_graph_relation_assertion"
  ) as MuseumPublicRelationRecord["assertionStatus"];
  const profile = RELATION_PROFILES[relationType];
  if (profile.reserved || relationType === "EXHIBITION_PRESENTS_WORK") {
    throw new Error("public_entity_graph_exhibition_reserved");
  }
  if (assertionStatus === "reserved") {
    throw new Error("public_entity_graph_relation_reserved");
  }
  const qualifier = requiredRecord(
    payload["qualifier"],
    "public_entity_graph_relation_qualifier"
  );
  const sourceRecordIds = stringArray(
    payload,
    "source_record_ids",
    "public_entity_graph_relation_sources"
  );
  validateRelationQualifier(qualifier, profile);
  return {
    id: relationId,
    relationType,
    sourceEntityId: requiredString(
      payload,
      "source_entity_id",
      "public_entity_graph_relation_source"
    ),
    targetEntityId: requiredString(
      payload,
      "target_entity_id",
      "public_entity_graph_relation_target"
    ),
    assertionStatus,
    qualifier,
    sourceRecordIds,
    sourcePath: document.path,
  };
}

function validateRelationQualifier(
  qualifier: Record<string, unknown>,
  profile: (typeof RELATION_PROFILES)[keyof typeof RELATION_PROFILES]
): void {
  const qualifierKeys = Object.keys(qualifier);
  if (qualifierKeys.some((key) => !profile.allowedQualifiers.includes(key))) {
    throw new Error("public_entity_graph_relation_qualifier_unknown");
  }
  if (
    profile.requiredQualifiers.some(
      (key) => qualifier[key] === undefined || qualifier[key] === null
    )
  ) {
    throw new Error("public_entity_graph_relation_qualifier_required");
  }
  const displayOrder = qualifier["display_order"];
  if (
    displayOrder !== undefined &&
    (typeof displayOrder !== "number" ||
      !Number.isSafeInteger(displayOrder) ||
      displayOrder < 1)
  ) {
    throw new Error("public_entity_graph_relation_display_order");
  }
  const selectionStatus = qualifier["selection_status"];
  if (
    selectionStatus !== undefined &&
    !isAllowedSelectionStatus(selectionStatus)
  ) {
    throw new Error("public_entity_graph_relation_selection_status");
  }
  const mintStatus = qualifier["mint_status"];
  if (mintStatus !== undefined && !isAllowedMintStatus(mintStatus)) {
    throw new Error("public_entity_graph_relation_mint_status");
  }
}

function isAllowedSelectionStatus(value: unknown): boolean {
  return (
    typeof value === "string" &&
    new Set(["proposed", "selected_unminted", "selected", "not_established"]).has(value)
  );
}

function isAllowedMintStatus(value: unknown): boolean {
  return (
    typeof value === "string" &&
    new Set(["pending", "not_started", "verified", "not_applicable"]).has(value)
  );
}
