import type {
  MuseumAcquisitionAlias,
  MuseumPublicEntityRecord,
  MuseumPublicEntityType,
  MuseumPublicIdentityInventory,
  MuseumPublicProgramAlias,
  MuseumPublicRouteAlias,
  MuseumSourceDocument,
  MuseumWorkAlias,
} from "./types";
import {
  ENTITY_ID_PATTERNS,
  INVENTORY_ONLY_ENTITY_ID_PATTERNS,
  MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
} from "./publicEntityGraphSchema";
import {
  requiredRecord,
  requiredString,
  stringArray,
} from "./publicEntityGraphPrimitives";

const PROGRAM_ALIAS_KINDS = new Set(["program_route_key", "source_program"]);
const ACQUISITION_ALIAS_KINDS = new Set([
  "proposal",
  "accession_lot",
  "accession_record",
]);

export function parseMuseumIdentityInventory(
  document: MuseumSourceDocument | undefined,
  entities: readonly MuseumPublicEntityRecord[]
): MuseumPublicIdentityInventory {
  assertInventoryDocument(document);
  const inventory = parseInventoryJson(document);
  assertInventoryVersion(inventory);
  const byId = new Map(entities.map((entity) => [entity.id, entity] as const));
  assertEntityPatterns(inventory, entities);
  assertInventoryEntityCoverage(inventory, entities);
  const acquisitionAliases = readAcquisitionAliases(inventory, byId);
  const curatedAcquisitionIds = readCuratedAcquisitionIds(inventory, byId);
  const workAliases = readWorkAliases(inventory, byId);
  const routeAliases = readRouteAliases(inventory, byId);
  validateSlugInventory(inventory, byId);
  validateCanonicalRouteCoverage(entities);
  return {
    sourcePath: MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
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
    root = JSON.parse(document.text) as unknown;
  } catch {
    throw new Error("public_entity_graph_inventory_json_invalid");
  }
  return requiredRecord(root, "public_entity_graph_inventory_shape");
}

function assertInventoryVersion(inventory: Record<string, unknown>): void {
  const version = requiredString(
    inventory,
    "inventory_version",
    "public_entity_graph_inventory_version"
  );
  if (version !== "1.1.0" && version !== "1.2.0" && version !== "1.3.2") {
    throw new Error("public_entity_graph_inventory_version");
  }
  requiredString(
    inventory,
    "identity_policy",
    "public_entity_graph_inventory_policy"
  );
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
  const patternKeys = Object.keys(patterns).sort();
  const expectedPatternKeys = [
    ...expectedTypes,
    ...expectedInventoryOnlyTypes,
  ].sort();
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

function readAcquisitionAliases(
  inventory: Record<string, unknown>,
  byId: ReadonlyMap<string, MuseumPublicEntityRecord>
): Map<string, MuseumAcquisitionAlias> {
  const aliases = new Map<string, MuseumAcquisitionAlias>();
  const bootstrap = inventory["required_bootstrap_curated_acquisitions"];
  if (!Array.isArray(bootstrap) || bootstrap.length === 0) {
    throw new Error("public_entity_graph_inventory_bootstrap");
  }
  for (const value of bootstrap) {
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
    if (entity === undefined) {
      throw new Error("public_entity_graph_inventory_bootstrap");
    }
    if (
      entity.entityType !== "CURATED_ACQUISITION" ||
      entity.label !==
        requiredString(
          entry,
          "preferred_label",
          "public_entity_graph_inventory_bootstrap"
        ) ||
      entity.slug !==
        requiredString(
          entry,
          "public_slug",
          "public_entity_graph_inventory_bootstrap"
        )
    ) {
      throw new Error("public_entity_graph_inventory_bootstrap");
    }
    for (const alias of stringArray(
      entry,
      "source_aliases",
      "public_entity_graph_inventory_bootstrap",
      false
    )) {
      addAcquisitionAlias(aliases, alias, id);
    }
  }
  readRawAcquisitionAliases(inventory, byId, aliases);
  return aliases;
}

function readRawAcquisitionAliases(
  inventory: Record<string, unknown>,
  byId: ReadonlyMap<string, MuseumPublicEntityRecord>,
  acquisitionAliases: Map<string, MuseumAcquisitionAlias>
): void {
  const raw = inventory["acquisition_aliases"];
  if (!Array.isArray(raw)) {
    throw new Error("public_entity_graph_inventory_acquisition_aliases");
  }
  for (const value of raw) {
    const entry = requiredRecord(
      value,
      "public_entity_graph_inventory_acquisition_aliases"
    );
    const alias = requiredString(
      entry,
      "alias",
      "public_entity_graph_inventory_acquisition_aliases"
    );
    const canonicalEntityId = requiredString(
      entry,
      "canonical_entity_id",
      "public_entity_graph_inventory_acquisition_aliases"
    );
    const aliasKind = requiredString(
      entry,
      "alias_kind",
      "public_entity_graph_inventory_acquisition_aliases"
    );
    const entity = byId.get(canonicalEntityId);
    if (
      entity === undefined ||
      (!PROGRAM_ALIAS_KINDS.has(aliasKind) &&
        !ACQUISITION_ALIAS_KINDS.has(aliasKind)) ||
      (PROGRAM_ALIAS_KINDS.has(aliasKind) &&
        entity.entityType !== "ACQUISITION_PROGRAM") ||
      (ACQUISITION_ALIAS_KINDS.has(aliasKind) &&
        entity.entityType !== "CURATED_ACQUISITION")
    ) {
      throw new Error("public_entity_graph_inventory_acquisition_aliases");
    }
    if (ACQUISITION_ALIAS_KINDS.has(aliasKind)) {
      addAcquisitionAlias(acquisitionAliases, alias, canonicalEntityId);
    }
  }
}

function addAcquisitionAlias(
  aliases: Map<string, MuseumAcquisitionAlias>,
  alias: string,
  acquisitionId: string
): void {
  const existing = aliases.get(alias);
  if (existing !== undefined && existing.acquisitionId !== acquisitionId) {
    throw new Error("public_entity_graph_inventory_alias_collision");
  }
  aliases.set(alias, {
    kind: "acquisition_source_alias",
    alias,
    acquisitionId,
    sourcePath: MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
  });
}

function readProgramAliases(
  inventory: Record<string, unknown>,
  byId: ReadonlyMap<string, MuseumPublicEntityRecord>
): readonly MuseumPublicProgramAlias[] {
  const raw = inventory["acquisition_aliases"];
  if (!Array.isArray(raw)) {
    throw new Error("public_entity_graph_inventory_acquisition_aliases");
  }
  const aliases = new Map<string, MuseumPublicProgramAlias>();
  for (const value of raw) {
    const entry = requiredRecord(
      value,
      "public_entity_graph_inventory_acquisition_aliases"
    );
    const alias = requiredString(
      entry,
      "alias",
      "public_entity_graph_inventory_acquisition_aliases"
    );
    const canonicalEntityId = requiredString(
      entry,
      "canonical_entity_id",
      "public_entity_graph_inventory_acquisition_aliases"
    );
    const aliasKind = requiredString(
      entry,
      "alias_kind",
      "public_entity_graph_inventory_acquisition_aliases"
    );
    const entity = byId.get(canonicalEntityId);
    if (
      (!PROGRAM_ALIAS_KINDS.has(aliasKind) &&
        !ACQUISITION_ALIAS_KINDS.has(aliasKind)) ||
      entity === undefined ||
      (PROGRAM_ALIAS_KINDS.has(aliasKind) &&
        entity.entityType !== "ACQUISITION_PROGRAM") ||
      (ACQUISITION_ALIAS_KINDS.has(aliasKind) &&
        entity.entityType !== "CURATED_ACQUISITION")
    ) {
      throw new Error("public_entity_graph_inventory_acquisition_aliases");
    }
    if (!PROGRAM_ALIAS_KINDS.has(aliasKind)) continue;
    const existing = aliases.get(alias);
    if (existing !== undefined && existing.programId !== canonicalEntityId) {
      throw new Error("public_entity_graph_inventory_alias_collision");
    }
    aliases.set(alias, {
      kind: "program_source_alias",
      alias,
      programId: canonicalEntityId,
      sourcePath: MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
    });
  }
  return [...aliases.values()].sort((left, right) =>
    left.alias.localeCompare(right.alias)
  );
}

function readWorkAliases(
  inventory: Record<string, unknown>,
  byId: ReadonlyMap<string, MuseumPublicEntityRecord>
): Map<string, MuseumWorkAlias> {
  const raw = inventory["work_aliases"];
  if (!Array.isArray(raw)) {
    throw new Error("public_entity_graph_inventory_work_aliases");
  }
  const aliases = new Map<string, MuseumWorkAlias>();
  for (const value of raw) {
    const entry = requiredRecord(
      value,
      "public_entity_graph_inventory_work_aliases"
    );
    const alias = requiredString(
      entry,
      "alias",
      "public_entity_graph_inventory_work_aliases"
    );
    const canonicalEntityId = requiredString(
      entry,
      "canonical_entity_id",
      "public_entity_graph_inventory_work_aliases"
    );
    const entity = byId.get(canonicalEntityId);
    if (entity?.entityType !== "WORK" || alias === canonicalEntityId) {
      throw new Error("public_entity_graph_inventory_work_aliases");
    }
    const existing = aliases.get(alias);
    if (existing !== undefined && existing.workId !== canonicalEntityId) {
      throw new Error("public_entity_graph_inventory_alias_collision");
    }
    aliases.set(alias, {
      kind: "work_source_alias",
      sourceObjectId: alias,
      workId: canonicalEntityId,
      sourcePath: MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
    });
  }
  return aliases;
}

function readRouteAliases(
  inventory: Record<string, unknown>,
  byId: ReadonlyMap<string, MuseumPublicEntityRecord>
): Map<string, MuseumPublicRouteAlias> {
  const raw = inventory["route_aliases"];
  if (!Array.isArray(raw)) {
    throw new Error("public_entity_graph_inventory_route_aliases");
  }
  const aliases = new Map<string, MuseumPublicRouteAlias>();
  for (const value of raw) {
    const entry = requiredRecord(
      value,
      "public_entity_graph_inventory_route_aliases"
    );
    const legacyRoute = requiredString(
      entry,
      "legacy_route",
      "public_entity_graph_inventory_route_aliases"
    );
    const canonicalRoute = requiredString(
      entry,
      "canonical_route",
      "public_entity_graph_inventory_route_aliases"
    );
    const canonicalEntityId = requiredString(
      entry,
      "canonical_entity_id",
      "public_entity_graph_inventory_route_aliases"
    );
    const entity = byId.get(canonicalEntityId);
    if (entity === undefined) {
      throw new Error("public_entity_graph_inventory_route_aliases");
    }
    if (
      entity.canonicalRoute !== canonicalRoute ||
      legacyRoute === canonicalRoute ||
      !isMuseumNetworkPath(legacyRoute) ||
      !isMuseumNetworkPath(canonicalRoute)
    ) {
      throw new Error("public_entity_graph_inventory_route_aliases");
    }
    if (aliases.has(legacyRoute)) {
      throw new Error("public_entity_graph_inventory_alias_collision");
    }
    aliases.set(legacyRoute, {
      legacyRoute,
      canonicalRoute,
      canonicalEntityId,
      sourcePath: MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
    });
  }
  return aliases;
}

function isMuseumNetworkPath(value: string): boolean {
  return (
    value.startsWith("/museum/network/") &&
    !value.includes("?") &&
    !value.includes("#")
  );
}

function validateSlugInventory(
  inventory: Record<string, unknown>,
  byId: ReadonlyMap<string, MuseumPublicEntityRecord>
): void {
  const raw = inventory["public_slug_inventory"];
  if (!Array.isArray(raw)) {
    throw new Error("public_entity_graph_inventory_slugs");
  }
  const seen = new Set<string>();
  for (const value of raw) {
    const entry = requiredRecord(value, "public_entity_graph_inventory_slugs");
    const entity = byId.get(
      requiredString(entry, "entity_id", "public_entity_graph_inventory_slugs")
    );
    if (entity === undefined) {
      throw new Error("public_entity_graph_inventory_slugs");
    }
    if (seen.has(entity.id)) {
      throw new Error("public_entity_graph_inventory_slugs");
    }
    seen.add(entity.id);
    if (
      entity.entityType !==
        requiredString(
          entry,
          "entity_type",
          "public_entity_graph_inventory_slugs"
        ) ||
      entity.label !==
        requiredString(
          entry,
          "preferred_label",
          "public_entity_graph_inventory_slugs"
        ) ||
      entity.slug !==
        requiredString(
          entry,
          "public_slug",
          "public_entity_graph_inventory_slugs"
        ) ||
      entity.canonicalRoute !==
        requiredString(
          entry,
          "canonical_route",
          "public_entity_graph_inventory_slugs"
        )
    ) {
      throw new Error("public_entity_graph_inventory_slugs");
    }
  }
  const expected =
    byId.size === 0
      ? []
      : [...byId.values()]
          .filter(
            (entity) =>
              entity.pageExposure === "canonical_page" &&
              [
                "ARTIST",
                "ORGANIZATION",
                "PROJECT_OR_SERIES",
                "ACQUISITION_PROGRAM",
                "RESEARCH_PUBLICATION",
              ].includes(entity.entityType)
          )
          .map((entity) => entity.id);
  if (!sameIdSet([...seen], expected)) {
    throw new Error("public_entity_graph_inventory_slugs");
  }
}

function validateCanonicalRouteCoverage(
  entities: readonly MuseumPublicEntityRecord[]
): void {
  const routes = new Set<string>();
  const slugs = new Set<string>();
  for (const entity of entities) {
    if (entity.pageExposure !== "canonical_page") continue;
    if (
      entity.canonicalRoute === null ||
      entity.canonicalRoute.trim().length === 0
    ) {
      throw new Error("public_entity_graph_canonical_route_missing");
    }
    if (routes.has(entity.canonicalRoute)) {
      throw new Error("public_entity_graph_canonical_route_duplicate");
    }
    routes.add(entity.canonicalRoute);
    if (entity.slug !== null) {
      const slugKey = `${entity.entityType}:${entity.slug}`;
      if (slugs.has(slugKey)) {
        throw new Error("public_entity_graph_canonical_slug_duplicate");
      }
      slugs.add(slugKey);
    }
  }
}
