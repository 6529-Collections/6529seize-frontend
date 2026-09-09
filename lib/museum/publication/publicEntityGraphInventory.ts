import type {
  MuseumPublicEntityRecord,
  MuseumPublicEntityType,
  MuseumPublicIdentityInventory,
  MuseumPublicTypedReferenceRegistryEntry,
  MuseumSourceDocument,
} from "./types";
import { parseMuseumPublicationJson } from "./catalog-json";
import {
  readAcquisitionAliases,
  readProgramAliases,
  readRouteAliases,
  readWorkAliases,
  validateCanonicalRouteCoverage,
  validateSlugInventory,
} from "./publicEntityGraphAliases";
import {
  ENTITY_ID_PATTERNS,
  INVENTORY_ONLY_ENTITY_ID_PATTERNS,
  MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
} from "./publicEntityGraphSchema";
import {
  assertDateTime,
  requiredRecord,
  requiredString,
} from "./publicEntityGraphPrimitives";

const PUBLIC_ENTITY_IDENTITY_INVENTORY_SCHEMA =
  "https://6529networkmuseum.org/schemas/public-entity-identity-inventory-v1.json";
const PUBLIC_ENTITY_IDENTITY_INVENTORY_VERSIONS = new Set(["1.6.0", "1.7.0"]);
const PUBLIC_TYPED_REFERENCE_REGISTRY_ID =
  "PUBLIC_TYPED_REFERENCE_REGISTRY_V1" as const;
const PUBLIC_TYPED_REFERENCE_AUTHORITY_TYPES = new Set([
  "PROPOSED_GIFT",
  "WORK_DESCRIPTION",
]);
const INVENTORY_KEYS = [
  "$schema",
  "inventory_version",
  "identity_policy",
  "entity_id_patterns",
  "retired_identity_ids",
  "required_bootstrap_curated_acquisitions",
  "acquisition_aliases",
  "source_aliases",
  "work_aliases",
  "typed_reference_registry",
  "identity_bindings",
  "route_aliases",
  "public_slug_inventory",
] as const;

const PROGRAM_ALIAS_KINDS = new Set(["program_route_key", "source_program"]);
const ACQUISITION_ALIAS_KINDS = new Set([
  "proposal",
  "accession_lot",
  "accession_record",
]);

function compareInventoryKeys(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return left.localeCompare(right);
}

export function parseMuseumIdentityInventory(
  document: MuseumSourceDocument | undefined,
  entities: readonly MuseumPublicEntityRecord[]
): MuseumPublicIdentityInventory {
  assertInventoryDocument(document);
  const inventory = parseInventoryJson(document);
  const inventoryVersion = assertInventoryVersion(inventory);
  assertRetiredIdentities(inventory, entities);
  const byId = new Map(entities.map((entity) => [entity.id, entity] as const));
  assertEntityPatterns(inventory, entities);
  assertCompleteIdentityBindings(inventory, entities);
  assertInventoryEntityCoverage(inventory, entities);
  assertSourceAliases(inventory, byId);
  const acquisitionAliases = readAcquisitionAliases(inventory, byId);
  const curatedAcquisitionIds = readCuratedAcquisitionIds(inventory, byId);
  const workAliases = readWorkAliases(inventory, byId);
  const routeAliases = readRouteAliases(inventory, byId);
  const typedReferenceRegistry = readTypedReferenceRegistry(inventory);
  validateSlugInventory(inventory, byId);
  validateCanonicalRouteCoverage(entities);
  return {
    sourcePath: MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
    inventoryVersion,
    curatedAcquisitionIds,
    workAliases: [...workAliases.values()].sort((left, right) =>
      left.sourceObjectId.localeCompare(right.sourceObjectId)
    ),
    acquisitionAliases: [...acquisitionAliases.values()].sort((left, right) =>
      left.alias.localeCompare(right.alias)
    ),
    programAliases: readProgramAliases(inventory, byId),
    routeAliases: [...routeAliases.values()].sort((left, right) =>
      left.legacyRoute.localeCompare(right.legacyRoute)
    ),
    typedReferenceRegistry,
  };
}

function assertInventoryDocument(
  document: MuseumSourceDocument | undefined
): asserts document is MuseumSourceDocument {
  if (document === undefined) {
    throw new Error("public_entity_graph_inventory_document_missing");
  }
  if (
    document.path !== MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH ||
    document.mediaType !== "application/json"
  ) {
    throw new Error("public_entity_graph_inventory_document_missing");
  }
}

function parseInventoryJson(
  document: MuseumSourceDocument
): Record<string, unknown> {
  let root: unknown;
  try {
    root = parseMuseumPublicationJson(document.text);
  } catch {
    throw new Error("public_entity_graph_inventory_json_invalid");
  }
  return requiredRecord(root, "public_entity_graph_inventory_shape");
}

function assertInventoryVersion(
  inventory: Record<string, unknown>
): MuseumPublicIdentityInventory["inventoryVersion"] {
  if (
    inventory["$schema"] !== PUBLIC_ENTITY_IDENTITY_INVENTORY_SCHEMA ||
    !sameIdSet(
      Object.keys(inventory).sort(compareInventoryKeys),
      [...INVENTORY_KEYS].sort(compareInventoryKeys)
    )
  ) {
    throw new Error("public_entity_graph_inventory_shape");
  }
  const version = requiredString(
    inventory,
    "inventory_version",
    "public_entity_graph_inventory_version"
  );
  if (!PUBLIC_ENTITY_IDENTITY_INVENTORY_VERSIONS.has(version)) {
    throw new Error("public_entity_graph_inventory_version");
  }
  requiredString(
    inventory,
    "identity_policy",
    "public_entity_graph_inventory_policy"
  );
  return version as MuseumPublicIdentityInventory["inventoryVersion"];
}

function assertRetiredIdentities(
  inventory: Record<string, unknown>,
  entities: readonly MuseumPublicEntityRecord[]
): void {
  const raw = inventory["retired_identity_ids"];
  if (!Array.isArray(raw)) {
    throw new Error("public_entity_graph_inventory_retired_identities");
  }
  const activeById = new Map(entities.map((entity) => [entity.id, entity]));
  const retiredIds = new Set<string>();
  for (const value of raw) {
    const entry = requiredRecord(
      value,
      "public_entity_graph_inventory_retired_identities"
    );
    if (
      !sameIdSet(Object.keys(entry).sort(compareInventoryKeys), [
        "entity_id",
        "entity_type",
        "reason",
        "retired_at",
        "superseded_by",
      ])
    ) {
      throw new Error("public_entity_graph_inventory_retired_identities");
    }
    const id = requiredString(
      entry,
      "entity_id",
      "public_entity_graph_inventory_retired_identities"
    );
    const entityType = requiredString(
      entry,
      "entity_type",
      "public_entity_graph_inventory_retired_identities"
    ) as (typeof INVENTORY_BINDING_CATEGORIES)[number];
    const pattern =
      entityType === "WORK_LIFECYCLE_OBSERVATION"
        ? INVENTORY_ONLY_ENTITY_ID_PATTERNS[entityType]
        : ENTITY_ID_PATTERNS[entityType];
    if (
      pattern?.test(id) !== true ||
      activeById.has(id) ||
      retiredIds.has(id)
    ) {
      throw new Error("public_entity_graph_inventory_retired_identities");
    }
    retiredIds.add(id);
    assertDateTime(
      entry,
      "retired_at",
      "public_entity_graph_inventory_retired_identities"
    );
    requiredString(
      entry,
      "reason",
      "public_entity_graph_inventory_retired_identities"
    );
    const supersededBy = entry["superseded_by"];
    if (
      supersededBy !== null &&
      (typeof supersededBy !== "string" ||
        supersededBy.trim().length === 0 ||
        (entityType !== "WORK_LIFECYCLE_OBSERVATION" &&
          activeById.get(supersededBy)?.entityType !== entityType))
    ) {
      throw new Error("public_entity_graph_inventory_retired_identities");
    }
  }
}

function assertSourceAliases(
  inventory: Record<string, unknown>,
  byId: ReadonlyMap<string, MuseumPublicEntityRecord>
): void {
  const raw = inventory["source_aliases"];
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("public_entity_graph_inventory_source_aliases");
  }
  const seen = new Set<string>();
  const supportedKinds = new Set([
    ...PROGRAM_ALIAS_KINDS,
    ...ACQUISITION_ALIAS_KINDS,
    "source_acquisition_context",
  ]);
  for (const value of raw) {
    const entry = requiredRecord(
      value,
      "public_entity_graph_inventory_source_aliases"
    );
    if (
      !sameIdSet(Object.keys(entry).sort(compareInventoryKeys), [
        "alias",
        "alias_type",
        "canonical_entity_id",
        "route_target",
      ])
    ) {
      throw new Error("public_entity_graph_inventory_source_aliases");
    }
    const alias = requiredString(
      entry,
      "alias",
      "public_entity_graph_inventory_source_aliases"
    );
    const aliasType = requiredString(
      entry,
      "alias_type",
      "public_entity_graph_inventory_source_aliases"
    );
    const canonicalEntityId = requiredString(
      entry,
      "canonical_entity_id",
      "public_entity_graph_inventory_source_aliases"
    );
    const entity = byId.get(canonicalEntityId);
    const expectsProgram = PROGRAM_ALIAS_KINDS.has(aliasType);
    if (
      !supportedKinds.has(aliasType) ||
      typeof entry["route_target"] !== "boolean" ||
      entity === undefined ||
      (expectsProgram && entity.entityType !== "ACQUISITION_PROGRAM") ||
      (!expectsProgram && entity.entityType !== "CURATED_ACQUISITION") ||
      seen.has(`${aliasType}:${alias}`)
    ) {
      throw new Error("public_entity_graph_inventory_source_aliases");
    }
    seen.add(`${aliasType}:${alias}`);
  }
}

function readTypedReferenceRegistry(
  inventory: Record<string, unknown>
): readonly MuseumPublicTypedReferenceRegistryEntry[] {
  const raw = inventory["typed_reference_registry"];
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("public_entity_graph_inventory_typed_references");
  }
  const entries: MuseumPublicTypedReferenceRegistryEntry[] = [];
  const keys = new Set<string>();
  for (const value of raw) {
    const entry = requiredRecord(
      value,
      "public_entity_graph_inventory_typed_references"
    );
    if (
      !sameIdSet(Object.keys(entry).sort(compareInventoryKeys), [
        "authoritative_record_id",
        "authoritative_record_type",
        "caip19",
        "reference_type",
        "registry_id",
        "target_id",
        "target_type",
      ]) ||
      entry["registry_id"] !== PUBLIC_TYPED_REFERENCE_REGISTRY_ID
    ) {
      throw new Error("public_entity_graph_inventory_typed_references");
    }
    const targetId = requiredString(
      entry,
      "target_id",
      "public_entity_graph_inventory_typed_references"
    );
    const referenceType = requiredString(
      entry,
      "reference_type",
      "public_entity_graph_inventory_typed_references"
    );
    const targetType = requiredString(
      entry,
      "target_type",
      "public_entity_graph_inventory_typed_references"
    );
    const authoritativeRecordId = requiredString(
      entry,
      "authoritative_record_id",
      "public_entity_graph_inventory_typed_references"
    );
    const authoritativeRecordType = requiredString(
      entry,
      "authoritative_record_type",
      "public_entity_graph_inventory_typed_references"
    );
    const caip19 = entry["caip19"];
    const key = `${referenceType}:${targetId}`;
    if (
      referenceType !== "manifestation" ||
      targetType !== "ERC721_TOKEN_MANIFESTATION" ||
      !PUBLIC_TYPED_REFERENCE_AUTHORITY_TYPES.has(authoritativeRecordType) ||
      typeof caip19 !== "string" ||
      !/^eip155:[0-9]+\/erc721:0x[0-9a-fA-F]{40}\/[0-9]+$/u.test(caip19) ||
      keys.has(key)
    ) {
      throw new Error("public_entity_graph_inventory_typed_references");
    }
    keys.add(key);
    entries.push({
      registryId: PUBLIC_TYPED_REFERENCE_REGISTRY_ID,
      targetId,
      referenceType,
      targetType,
      authoritativeRecordId,
      authoritativeRecordType,
      caip19,
    });
  }
  return entries.sort((left, right) =>
    `${left.referenceType}:${left.targetId}`.localeCompare(
      `${right.referenceType}:${right.targetId}`
    )
  );
}

const INVENTORY_BINDING_CATEGORIES = [
  ...(Object.keys(ENTITY_ID_PATTERNS) as MuseumPublicEntityType[]).filter(
    (type) => ENTITY_ID_PATTERNS[type] !== null
  ),
  ...(Object.keys(
    INVENTORY_ONLY_ENTITY_ID_PATTERNS
  ) as (keyof typeof INVENTORY_ONLY_ENTITY_ID_PATTERNS)[]),
] as const;

function assertCompleteIdentityBindings(
  inventory: Record<string, unknown>,
  entities: readonly MuseumPublicEntityRecord[]
): void {
  const bindings = requiredRecord(
    inventory["identity_bindings"],
    "public_entity_graph_inventory_bindings"
  );
  const actualCategories = Object.keys(bindings).sort((left, right) =>
    left.localeCompare(right)
  );
  const expectedCategories = [...INVENTORY_BINDING_CATEGORIES].sort(
    (left, right) => left.localeCompare(right)
  );
  if (!sameIdSet(actualCategories, expectedCategories)) {
    throw new Error("public_entity_graph_inventory_bindings");
  }
  const entitiesById = new Map(
    entities.map((entity) => [entity.id, entity] as const)
  );
  for (const category of INVENTORY_BINDING_CATEGORIES) {
    assertIdentityBindingCategory(bindings, category, entities, entitiesById);
  }
}

function assertIdentityBindingCategory(
  bindings: Record<string, unknown>,
  category: (typeof INVENTORY_BINDING_CATEGORIES)[number],
  entities: readonly MuseumPublicEntityRecord[],
  entitiesById: ReadonlyMap<string, MuseumPublicEntityRecord>
): void {
  const rawBindings = bindings[category];
  if (!Array.isArray(rawBindings) || rawBindings.length === 0) {
    throw new Error("public_entity_graph_inventory_bindings");
  }
  const ids = new Set<string>();
  const sourceKeys = new Set<string>();
  for (const value of rawBindings) {
    const entry = requiredRecord(
      value,
      "public_entity_graph_inventory_bindings"
    );
    const sourceKey = requiredString(
      entry,
      "source_key",
      "public_entity_graph_inventory_bindings"
    );
    const id = requiredString(
      entry,
      "entity_id",
      "public_entity_graph_inventory_bindings"
    );
    assertIdentityBinding(category, id, entitiesById);
    if (ids.has(id) || sourceKeys.has(sourceKey)) {
      throw new Error("public_entity_graph_inventory_identity_collision");
    }
    ids.add(id);
    sourceKeys.add(sourceKey);
  }
  if (category === "WORK_LIFECYCLE_OBSERVATION") return;
  const expectedIds = entities
    .filter((entity) => entity.entityType === category)
    .map((entity) => entity.id);
  if (!sameIdSet([...ids], expectedIds)) {
    throw new Error("public_entity_graph_inventory_bindings");
  }
}

function assertIdentityBinding(
  category: (typeof INVENTORY_BINDING_CATEGORIES)[number],
  id: string,
  entitiesById: ReadonlyMap<string, MuseumPublicEntityRecord>
): void {
  if (category === "WORK_LIFECYCLE_OBSERVATION") {
    if (!INVENTORY_ONLY_ENTITY_ID_PATTERNS[category].test(id)) {
      throw new Error("public_entity_graph_inventory_bindings");
    }
    return;
  }
  const entity = entitiesById.get(id);
  if (
    entity?.entityType !== category ||
    ENTITY_ID_PATTERNS[category] === null
  ) {
    throw new Error("public_entity_graph_inventory_bindings");
  }
}

function declaredInventoryEntityIds(
  inventory: Record<string, unknown>
): ReadonlySet<string> {
  const ids = new Set<string>();
  const identityBindings = inventory["identity_bindings"];
  if (identityBindings !== undefined) {
    const bindings = requiredRecord(
      identityBindings,
      "public_entity_graph_inventory_bindings"
    );
    for (const value of Object.values(bindings)) {
      if (!Array.isArray(value)) {
        throw new Error("public_entity_graph_inventory_bindings");
      }
      for (const binding of value) {
        const entry = requiredRecord(
          binding,
          "public_entity_graph_inventory_bindings"
        );
        const id = requiredString(
          entry,
          "entity_id",
          "public_entity_graph_inventory_bindings"
        );
        if (ids.has(id))
          throw new Error("public_entity_graph_inventory_identity_collision");
        ids.add(id);
      }
    }
  }
  const addEntries = (key: string, field: string, code: string): void => {
    const raw = inventory[key];
    if (!Array.isArray(raw)) throw new Error(code);
    for (const value of raw) {
      const entry = requiredRecord(value, code);
      const id = requiredString(entry, field, code);
      ids.add(id);
    }
  };
  addEntries(
    "required_bootstrap_curated_acquisitions",
    "entity_id",
    "public_entity_graph_inventory_bootstrap"
  );
  addEntries(
    "public_slug_inventory",
    "entity_id",
    "public_entity_graph_inventory_slugs"
  );
  addEntries(
    "work_aliases",
    "canonical_entity_id",
    "public_entity_graph_inventory_work_aliases"
  );
  addEntries(
    "route_aliases",
    "canonical_entity_id",
    "public_entity_graph_inventory_route_aliases"
  );
  const acquisitionAliases = inventory["acquisition_aliases"];
  if (!Array.isArray(acquisitionAliases)) {
    throw new Error("public_entity_graph_inventory_acquisition_aliases");
  }
  for (const value of acquisitionAliases) {
    const entry = requiredRecord(
      value,
      "public_entity_graph_inventory_acquisition_aliases"
    );
    ids.add(
      requiredString(
        entry,
        "canonical_entity_id",
        "public_entity_graph_inventory_acquisition_aliases"
      )
    );
  }
  return ids;
}

function assertInventoryEntityCoverage(
  inventory: Record<string, unknown>,
  entities: readonly MuseumPublicEntityRecord[]
): void {
  const declaredIds = declaredInventoryEntityIds(inventory);
  for (const entity of entities) {
    if (!declaredIds.has(entity.id)) {
      throw new Error("public_entity_graph_inventory_entity_missing");
    }
  }
}

function readCuratedAcquisitionIds(
  inventory: Record<string, unknown>,
  byId: ReadonlyMap<string, MuseumPublicEntityRecord>
): readonly string[] {
  const raw = inventory["required_bootstrap_curated_acquisitions"];
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("public_entity_graph_inventory_bootstrap");
  }
  const ids = raw.map((value) => {
    const entry = requiredRecord(
      value,
      "public_entity_graph_inventory_bootstrap"
    );
    const id = requiredString(
      entry,
      "entity_id",
      "public_entity_graph_inventory_bootstrap"
    );
    const entity = byId.get(id);
    if (
      entity?.entityType !== "CURATED_ACQUISITION" ||
      entity.pageExposure !== "canonical_page"
    ) {
      throw new Error("public_entity_graph_inventory_bootstrap");
    }
    return id;
  });
  if (new Set(ids).size !== ids.length) {
    throw new Error("public_entity_graph_inventory_bootstrap");
  }
  const canonicalAcquisitionIds = [...byId.values()]
    .filter(
      (entity) =>
        entity.entityType === "CURATED_ACQUISITION" &&
        entity.pageExposure === "canonical_page"
    )
    .map((entity) => entity.id);
  if (!sameIdSet(ids, canonicalAcquisitionIds)) {
    throw new Error("public_entity_graph_inventory_bootstrap");
  }
  return ids.sort((left, right) => left.localeCompare(right));
}

function sameIdSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id) => right.includes(id));
}

function assertEntityPatterns(
  inventory: Record<string, unknown>,
  entities: readonly MuseumPublicEntityRecord[]
): void {
  const patterns = requiredRecord(
    inventory["entity_id_patterns"],
    "public_entity_graph_inventory_patterns"
  );
  const expectedTypes = (
    Object.keys(ENTITY_ID_PATTERNS) as MuseumPublicEntityType[]
  ).filter((type) => ENTITY_ID_PATTERNS[type] !== null);
  const expectedInventoryOnlyTypes = Object.keys(
    INVENTORY_ONLY_ENTITY_ID_PATTERNS
  ) as (keyof typeof INVENTORY_ONLY_ENTITY_ID_PATTERNS)[];
  const patternKeys = Object.keys(patterns).sort((left, right) =>
    left.localeCompare(right)
  );
  const expectedPatternKeys = [
    ...expectedTypes,
    ...expectedInventoryOnlyTypes,
  ].sort((left, right) => left.localeCompare(right));
  if (
    patternKeys.length !== expectedPatternKeys.length ||
    expectedPatternKeys.some((type) => !patternKeys.includes(type))
  ) {
    throw new Error("public_entity_graph_inventory_patterns");
  }
  for (const type of expectedTypes) {
    if (patterns[type] !== ENTITY_ID_PATTERNS[type]?.source) {
      throw new Error("public_entity_graph_inventory_patterns");
    }
  }
  for (const type of expectedInventoryOnlyTypes) {
    if (patterns[type] !== INVENTORY_ONLY_ENTITY_ID_PATTERNS[type].source) {
      throw new Error("public_entity_graph_inventory_patterns");
    }
  }
  const ids = new Set(entities.map((entity) => entity.id));
  if (ids.size !== entities.length) {
    throw new Error("public_entity_graph_duplicate_entity");
  }
}
