import { buildImmutableMuseumBlobUrl } from "./security";
import type { MuseumAcquisitionMethod } from "./entities";
import type {
  MuseumAcquisitionAlias,
  MuseumPublicEntityRecord,
  MuseumPublicProgramAlias,
  MuseumPublicRouteAlias,
  MuseumWorkAlias,
} from "./types";
import {
  ACQUISITION_METHODS,
  ENTITY_ID_PATTERNS,
  MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
} from "./publicEntityGraphSchema";
import {
  isRecord,
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

export function readAcquisitionAliases(
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

export function readProgramAliases(
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

export function readWorkAliases(
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

export function readRouteAliases(
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

export function validateSlugInventory(
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
    if (entity === undefined || seen.has(entity.id)) {
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

export function validateCanonicalRouteCoverage(
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

function sameIdSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id) => right.includes(id));
}

export function aliasesForWorks(
  entities: readonly MuseumPublicEntityRecord[]
): readonly MuseumWorkAlias[] {
  const aliases = new Map<string, MuseumWorkAlias>();
  const sharedReferences = new Set<string>();
  for (const work of entities.filter(
    (entity) => entity.entityType === "WORK"
  )) {
    const refs = sourceProfileReferences(
      work.profile,
      "manifestation_references",
      "manifestation"
    );
    for (const alias of refs) {
      if (sharedReferences.has(alias)) continue;
      if (
        alias === work.id ||
        ENTITY_ID_PATTERNS["WORK"]?.test(alias) === true
      ) {
        continue;
      }
      const existing = aliases.get(alias);
      if (existing !== undefined && existing.workId !== work.id) {
        aliases.delete(alias);
        sharedReferences.add(alias);
        continue;
      }
      aliases.set(alias, {
        kind: "work_source_alias",
        sourceObjectId: alias,
        workId: work.id,
        sourcePath: work.sourcePath,
      });
    }
  }
  return [...aliases.values()].sort((left, right) =>
    left.sourceObjectId.localeCompare(right.sourceObjectId)
  );
}

function sourceProfileReferences(
  profile: Readonly<Record<string, unknown>>,
  key: string,
  referenceType: string
): string[] {
  const values = profile[key];
  if (!Array.isArray(values)) return [];
  return values.flatMap((value) => {
    if (!isRecord(value)) return [];
    if (value["reference_type"] !== referenceType) return [];
    const sourceRecordId = value["source_record_id"];
    return typeof sourceRecordId === "string" &&
      sourceRecordId.trim().length > 0
      ? [sourceRecordId]
      : [];
  });
}

export function mergeWorkAliases(
  aliases: readonly MuseumWorkAlias[]
): readonly MuseumWorkAlias[] {
  const byAlias = new Map<string, MuseumWorkAlias>();
  for (const alias of aliases) {
    const existing = byAlias.get(alias.sourceObjectId);
    if (existing !== undefined && existing.workId !== alias.workId) {
      throw new Error("public_entity_graph_alias_collision");
    }
    byAlias.set(alias.sourceObjectId, alias);
  }
  return [...byAlias.values()].sort((left, right) =>
    left.sourceObjectId.localeCompare(right.sourceObjectId)
  );
}

export function mapAcquisitionMethod(value: string): MuseumAcquisitionMethod {
  if (!ACQUISITION_METHODS.has(value as MuseumAcquisitionMethod)) {
    throw new Error("public_entity_graph_acquisition_method");
  }
  return value as MuseumAcquisitionMethod;
}

export function immutableDocumentSource(
  sourceCommit: string,
  path: string
): string {
  const url = buildImmutableMuseumBlobUrl(sourceCommit, path);
  if (url === null) throw new Error("public_entity_graph_document_join");
  return url;
}
