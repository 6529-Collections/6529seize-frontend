import { assertExactKeys, asRecord } from "./catalog-contract";
import { parseMuseumPublicationJson } from "./catalog-json";
import {
  MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_PATH,
  MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA_PATH,
  PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA,
  PUBLIC_RELATION_IDENTITY_INVENTORY_VERSION,
} from "./publicEntityGraphSchema";
import { requiredString } from "./publicEntityGraphPrimitives";
import type {
  MuseumPublicRelationIdentityInventory,
  MuseumPublicRelationRecord,
  MuseumSourceDocument,
} from "./types";

const RELATION_ID_PATTERN = /^6529NM-REL-[0-9]{4}$/u;
const RETIRED_RELATION_IDS_V1_3_0 = [
  "6529NM-REL-0159",
  "6529NM-REL-0160",
  "6529NM-REL-0161",
  "6529NM-REL-0162",
  "6529NM-REL-0163",
  "6529NM-REL-0164",
] as const;

type RelationBinding = {
  readonly relationId: string;
  readonly sourceKey: string;
};

type RetiredRelationBinding = RelationBinding & {
  readonly supersededBy: string | null;
};

export function parseMuseumRelationIdentityInventory(
  inventoryDocument: MuseumSourceDocument | undefined,
  schemaDocument: MuseumSourceDocument | undefined,
  relations: readonly MuseumPublicRelationRecord[]
): MuseumPublicRelationIdentityInventory {
  assertInventoryDocument(inventoryDocument);
  assertSchemaDocument(schemaDocument);
  assertInventorySchema(schemaDocument);
  const inventory = parseJsonRecord(
    inventoryDocument,
    "public_entity_graph_relation_inventory_json_invalid"
  );
  assertExactKeys(
    inventory,
    [
      "$schema",
      "inventory_version",
      "identity_policy",
      "relation_key_format",
      "relation_bindings",
      "retired_relation_ids",
    ],
    "public_entity_graph_relation_inventory_shape"
  );
  if (
    inventory["$schema"] !== PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA ||
    inventory["inventory_version"] !==
      PUBLIC_RELATION_IDENTITY_INVENTORY_VERSION ||
    inventory["relation_key_format"] !==
      "relation_type|source_entity_id|target_entity_id"
  ) {
    throw new Error("public_entity_graph_relation_inventory_version");
  }
  requiredString(
    inventory,
    "identity_policy",
    "public_entity_graph_relation_inventory_policy"
  );
  const activeBindings = parseActiveBindings(inventory["relation_bindings"]);
  const retiredBindings = parseRetiredBindings(
    inventory["retired_relation_ids"]
  );
  assertActiveCoverage(activeBindings, relations);
  assertRetiredCoverage(activeBindings, retiredBindings);
  return {
    sourcePath: MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_PATH,
    schemaPath: MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA_PATH,
    inventoryVersion: PUBLIC_RELATION_IDENTITY_INVENTORY_VERSION,
    activeRelationIds: activeBindings.map((binding) => binding.relationId),
    retiredRelationIds: retiredBindings.map((binding) => binding.relationId),
  };
}

function assertInventoryDocument(
  document: MuseumSourceDocument | undefined
): asserts document is MuseumSourceDocument {
  if (
    document?.path !== MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_PATH ||
    document.mediaType !== "application/json"
  ) {
    throw new Error("public_entity_graph_relation_inventory_document_missing");
  }
}

function assertSchemaDocument(
  document: MuseumSourceDocument | undefined
): asserts document is MuseumSourceDocument {
  if (
    document?.path !== MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA_PATH ||
    document.mediaType !== "application/json"
  ) {
    throw new Error("public_entity_graph_relation_inventory_schema_missing");
  }
}

function parseJsonRecord(
  document: MuseumSourceDocument,
  code: string
): Record<string, unknown> {
  try {
    return asRecord(parseMuseumPublicationJson(document.text), code);
  } catch {
    throw new Error(code);
  }
}

function assertInventorySchema(document: MuseumSourceDocument): void {
  const schema = parseJsonRecord(
    document,
    "public_entity_graph_relation_inventory_schema_invalid"
  );
  const required = schema["required"];
  const expectedRequired = [
    "$schema",
    "inventory_version",
    "identity_policy",
    "relation_key_format",
    "relation_bindings",
    "retired_relation_ids",
  ].sort((left, right) => left.localeCompare(right));
  if (
    schema["$id"] !== PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA ||
    schema["unevaluatedProperties"] !== false ||
    !Array.isArray(required) ||
    required.some((value) => typeof value !== "string") ||
    required.length !== expectedRequired.length ||
    [...(required as string[])]
      .sort((left, right) => left.localeCompare(right))
      .some((value, index) => value !== expectedRequired[index])
  ) {
    throw new Error("public_entity_graph_relation_inventory_schema_invalid");
  }
}

function parseActiveBindings(value: unknown): readonly RelationBinding[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("public_entity_graph_relation_inventory_bindings");
  }
  return value.map((item) => {
    const binding = asRecord(
      item,
      "public_entity_graph_relation_inventory_bindings"
    );
    assertExactKeys(
      binding,
      ["relation_id", "source_key"],
      "public_entity_graph_relation_inventory_bindings"
    );
    return parseBinding(binding);
  });
}

function parseRetiredBindings(
  value: unknown
): readonly RetiredRelationBinding[] {
  if (!Array.isArray(value)) {
    throw new Error("public_entity_graph_relation_inventory_retired");
  }
  return value.map((item) => {
    const binding = asRecord(
      item,
      "public_entity_graph_relation_inventory_retired"
    );
    assertExactKeys(
      binding,
      ["relation_id", "source_key", "retired_at", "reason", "superseded_by"],
      "public_entity_graph_relation_inventory_retired"
    );
    const retiredAt = requiredString(
      binding,
      "retired_at",
      "public_entity_graph_relation_inventory_retired"
    );
    const supersededBy = binding["superseded_by"];
    if (
      !Number.isFinite(Date.parse(retiredAt)) ||
      (supersededBy !== null &&
        (typeof supersededBy !== "string" ||
          !RELATION_ID_PATTERN.test(supersededBy)))
    ) {
      throw new Error("public_entity_graph_relation_inventory_retired");
    }
    requiredString(
      binding,
      "reason",
      "public_entity_graph_relation_inventory_retired"
    );
    return {
      ...parseBinding(binding),
      supersededBy,
    };
  });
}

function parseBinding(binding: Record<string, unknown>): RelationBinding {
  const relationId = requiredString(
    binding,
    "relation_id",
    "public_entity_graph_relation_inventory_bindings"
  );
  const sourceKey = requiredString(
    binding,
    "source_key",
    "public_entity_graph_relation_inventory_bindings"
  );
  if (
    !RELATION_ID_PATTERN.test(relationId) ||
    sourceKey.split("|").length !== 3
  ) {
    throw new Error("public_entity_graph_relation_inventory_bindings");
  }
  return { relationId, sourceKey };
}

function assertActiveCoverage(
  bindings: readonly RelationBinding[],
  relations: readonly MuseumPublicRelationRecord[]
): void {
  const relationIds = new Set(bindings.map((binding) => binding.relationId));
  const sourceKeys = new Set(bindings.map((binding) => binding.sourceKey));
  if (
    relationIds.size !== bindings.length ||
    sourceKeys.size !== bindings.length ||
    bindings.length !== relations.length
  ) {
    throw new Error("public_entity_graph_relation_inventory_bindings");
  }
  const relationById = new Map(
    relations.map((relation) => [relation.id, relation] as const)
  );
  for (const binding of bindings) {
    const relation = relationById.get(binding.relationId);
    const expectedKey =
      relation === undefined
        ? null
        : `${relation.relationType}|${relation.sourceEntityId}|${relation.targetEntityId}`;
    if (binding.sourceKey !== expectedKey) {
      throw new Error(
        "public_entity_graph_relation_inventory_binding_mismatch"
      );
    }
  }
}

function assertRetiredCoverage(
  active: readonly RelationBinding[],
  retired: readonly RetiredRelationBinding[]
): void {
  const activeIds = new Set(active.map((binding) => binding.relationId));
  const activeKeys = new Set(active.map((binding) => binding.sourceKey));
  const retiredIds = retired.map((binding) => binding.relationId);
  const retiredKeys = retired.map((binding) => binding.sourceKey);
  if (
    retired.length !== RETIRED_RELATION_IDS_V1_3_0.length ||
    new Set(retiredIds).size !== retired.length ||
    new Set(retiredKeys).size !== retired.length ||
    retiredIds.some((id) => activeIds.has(id)) ||
    retiredKeys.some((key) => activeKeys.has(key)) ||
    retired.some(
      (binding) =>
        binding.supersededBy !== null && !activeIds.has(binding.supersededBy)
    ) ||
    RETIRED_RELATION_IDS_V1_3_0.some((id) => !retiredIds.includes(id))
  ) {
    throw new Error("public_entity_graph_relation_inventory_retired");
  }
}
