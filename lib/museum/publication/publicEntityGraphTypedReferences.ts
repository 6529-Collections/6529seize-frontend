import type {
  MuseumPublicEntityRecord,
  MuseumPublicIdentityInventory,
} from "./types";
import { requiredRecord, requiredString } from "./publicEntityGraphPrimitives";

const PUBLIC_TYPED_REFERENCE_REGISTRY_ID =
  "PUBLIC_TYPED_REFERENCE_REGISTRY_V1" as const;
const TARGET_TYPE_MATRIX: Readonly<Record<string, ReadonlySet<string>>> = {
  "component:authoritative_record": new Set([
    "WORK_DESCRIPTION",
    "PROGRAM_OUTCOME",
  ]),
  "manifestation:authoritative_record": new Set(["VISUAL_OBSERVATION"]),
  "manifestation:governed_typed_registry": new Set([
    "ERC721_TOKEN_MANIFESTATION",
  ]),
};

interface TypedReferenceValidationContext {
  readonly declaredSources: ReadonlySet<string>;
  readonly registry: ReadonlyMap<
    string,
    MuseumPublicIdentityInventory["typedReferenceRegistry"][number]
  >;
  readonly usedRegistryKeys: Set<string>;
}

export function assertMuseumWorkTypedReferences(
  entities: readonly MuseumPublicEntityRecord[],
  inventory: MuseumPublicIdentityInventory
): void {
  const registry = new Map(
    inventory.typedReferenceRegistry.map((entry) => [
      `${entry.referenceType}:${entry.targetId}`,
      entry,
    ])
  );
  const usedRegistryKeys = new Set<string>();
  for (const work of entities.filter(
    (entity) => entity.entityType === "WORK"
  )) {
    const context: TypedReferenceValidationContext = {
      declaredSources: new Set(work.sourceRecordIds),
      registry,
      usedRegistryKeys,
    };
    assertReferenceArray(work, "component_references", "component", context);
    assertReferenceArray(
      work,
      "manifestation_references",
      "manifestation",
      context
    );
  }
  if (
    usedRegistryKeys.size !== registry.size ||
    [...registry.keys()].some((key) => !usedRegistryKeys.has(key))
  ) {
    throw new Error("public_entity_graph_typed_reference_registry_unused");
  }
}

function assertReferenceArray(
  work: MuseumPublicEntityRecord,
  field: "component_references" | "manifestation_references",
  expectedReferenceType: "component" | "manifestation",
  context: TypedReferenceValidationContext
): void {
  const raw = work.profile[field];
  if (!Array.isArray(raw)) {
    throw new Error("public_entity_graph_typed_reference_shape");
  }
  const seen = new Set<string>();
  for (const value of raw) {
    const reference = requiredRecord(
      value,
      "public_entity_graph_typed_reference_shape"
    );
    const recordId = requiredString(
      reference,
      "record_id",
      "public_entity_graph_typed_reference_shape"
    );
    const sourceRecordId = requiredString(
      reference,
      "source_record_id",
      "public_entity_graph_typed_reference_shape"
    );
    const referenceType = requiredString(
      reference,
      "reference_type",
      "public_entity_graph_typed_reference_shape"
    );
    const targetKind = requiredString(
      reference,
      "target_kind",
      "public_entity_graph_typed_reference_shape"
    );
    const targetType = requiredString(
      reference,
      "target_type",
      "public_entity_graph_typed_reference_shape"
    );
    const matrixKey = `${referenceType}:${targetKind}`;
    const referenceKey = `${referenceType}:${recordId}`;
    if (
      referenceType !== expectedReferenceType ||
      !context.declaredSources.has(sourceRecordId) ||
      TARGET_TYPE_MATRIX[matrixKey]?.has(targetType) !== true ||
      seen.has(referenceKey)
    ) {
      throw new Error("public_entity_graph_typed_reference_invalid");
    }
    seen.add(referenceKey);
    if (targetKind === "authoritative_record") {
      if (reference["registry_id"] !== null || recordId !== sourceRecordId) {
        throw new Error("public_entity_graph_typed_reference_authority");
      }
      continue;
    }
    if (
      targetKind !== "governed_typed_registry" ||
      reference["registry_id"] !== PUBLIC_TYPED_REFERENCE_REGISTRY_ID
    ) {
      throw new Error("public_entity_graph_typed_reference_registry");
    }
    const registryEntry = context.registry.get(referenceKey);
    if (
      registryEntry === undefined ||
      context.usedRegistryKeys.has(referenceKey) ||
      registryEntry.targetType !== targetType ||
      registryEntry.authoritativeRecordId !== sourceRecordId ||
      reference["caip19"] !== registryEntry.caip19
    ) {
      throw new Error("public_entity_graph_typed_reference_registry");
    }
    context.usedRegistryKeys.add(referenceKey);
  }
}
