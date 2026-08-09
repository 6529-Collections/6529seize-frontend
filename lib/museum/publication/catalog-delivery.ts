import { keccak256, toBytes } from "viem";
import { canonicalMuseumJson, verifyMuseumSha256 } from "./manifest";
import {
  MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES,
  MUSEUM_PUBLICATION_BUNDLE_PATH,
  MUSEUM_PUBLICATION_CANONICALIZATION_ID,
  MUSEUM_PUBLICATION_INVENTORY_PATH,
  PUBLICATION_BUNDLE_INVENTORY_SCHEMA,
  PUBLICATION_INVENTORY_SCHEMA,
  assertCatalogPublicationPath,
  assertExactKeys,
  assertSortedUniquePaths,
  asRecord,
  isPlainRecord,
  sha256Text,
} from "./catalog-contract";
import { parseMuseumPublicationJson } from "./catalog-json";
import type {
  MuseumPublicationCatalogAssemblyBundleResult,
  MuseumPublicationCatalogDocument,
  MuseumPublicationCatalog,
  MuseumSourceBundleDocument,
} from "./catalog-contract";

/**
 * Applies the source wire's explicit LF normalization to a fetched assembly
 * document. Media assets never pass through this function during activation.
 */
export function normalizeMuseumCatalogBytes(
  entry: MuseumPublicationCatalogDocument,
  bytes: Uint8Array
): Uint8Array {
  if (entry.byteMode === "raw") return bytes;
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    throw new Error("publication_catalog_document_bom");
  }
  const normalized: number[] = [];
  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index];
    if (byte === 0x0d) {
      if (bytes[index + 1] === 0x0a) index += 1;
      normalized.push(0x0a);
    } else if (byte !== undefined) {
      normalized.push(byte);
    }
  }
  return Uint8Array.from(normalized);
}

export function assertMuseumCatalogDocumentBytes(
  entry: MuseumPublicationCatalogDocument,
  bytes: Uint8Array,
  verifyDocumentCommitment?: (normalizedBytes: Uint8Array) => void
): Uint8Array {
  const normalized = normalizeMuseumCatalogBytes(entry, bytes);
  if (
    normalized.byteLength !== entry.size ||
    !verifyMuseumSha256(normalized, entry.sha256)
  ) {
    throw new Error("publication_catalog_document_fixity_mismatch");
  }
  if (entry.jcsKeccak !== undefined) {
    verifyDocumentCommitment?.(normalized);
  }
  return normalized;
}

/** Validates a decoded bundle's exact path and fixity set before parsing it. */
export function assertMuseumPublicationCatalogAssemblyBundle(
  bundle: MuseumPublicationCatalogAssemblyBundleResult,
  catalog: MuseumPublicationCatalog,
  verifyDocumentCommitment?: (
    entry: MuseumPublicationCatalogDocument,
    normalizedBytes: Uint8Array
  ) => void
): ReadonlyMap<string, Uint8Array> {
  if (
    bundle.inventorySha256 !== catalog.assemblyBundle.inventorySha256 ||
    bundle.inventoryKeccak !== catalog.assemblyBundle.inventoryKeccak
  ) {
    throw new Error("publication_catalog_bundle_inventory_mismatch");
  }
  const expectedPaths = catalog.assemblyDocuments.map(
    (document) => document.path
  );
  const decodedPaths = bundle.documents.map((document) => document.path);
  assertSortedUniquePaths(decodedPaths, "publication_catalog_bundle_paths");
  if (
    decodedPaths.length !== expectedPaths.length ||
    decodedPaths.some((path, index) => path !== expectedPaths[index])
  ) {
    throw new Error("publication_catalog_bundle_inventory_mismatch");
  }
  const result = new Map<string, Uint8Array>();
  for (const embedded of bundle.documents) {
    const entry = catalog.assemblyDocuments.find(
      (candidate) => candidate.path === embedded.path
    );
    if (entry === undefined) {
      throw new Error("publication_catalog_bundle_document_unlisted");
    }
    const normalized = assertMuseumCatalogDocumentBytes(
      entry,
      embedded.bytes,
      entry.jcsKeccak === undefined
        ? undefined
        : (normalizedBytes) =>
            verifyDocumentCommitment?.(entry, normalizedBytes)
    );
    result.set(embedded.path, normalized);
  }
  return result;
}

type MuseumPublicationInventoryEntry = {
  path: string;
  deliveryRole: "assembly_document" | "media_asset";
  kind: string;
  activationMode: "atomic" | "deferred_on_demand";
};

type MuseumPublicationInventoryContext = {
  inventory: Record<string, unknown>;
  entries: readonly unknown[];
  counts: Record<string, unknown>;
  inventoryVersion: string;
  assembler: Record<string, unknown>;
  requiredPaths: readonly unknown[];
  requiredSourceSets: Readonly<Record<string, readonly string[]>>;
  bundle: Record<string, unknown>;
};

function decodeRequiredSourceSets(
  value: unknown
): Readonly<Record<string, readonly string[]>> {
  const sourceSets = asRecord(
    value,
    "publication_catalog_inventory_required_source_sets"
  );
  if (Object.keys(sourceSets).length === 0) {
    throw new Error("publication_catalog_inventory_required_source_sets");
  }
  return Object.fromEntries(
    Object.entries(sourceSets).map(([setName, paths]) => {
      if (!/^[-a-z0-9_]+$/u.test(setName) || !Array.isArray(paths)) {
        throw new Error("publication_catalog_inventory_required_source_sets");
      }
      const decodedPaths = paths.map((path) => {
        if (typeof path !== "string") {
          throw new Error("publication_catalog_inventory_required_source_sets");
        }
        assertCatalogPublicationPath(path);
        return path;
      });
      if (new Set(decodedPaths).size !== decodedPaths.length) {
        throw new Error("publication_catalog_inventory_required_source_sets");
      }
      return [setName, decodedPaths] as const;
    })
  );
}

function decodeInventoryContext(
  document: MuseumSourceBundleDocument,
  catalog: MuseumPublicationCatalog
): MuseumPublicationInventoryContext {
  if (document.path !== MUSEUM_PUBLICATION_INVENTORY_PATH) {
    throw new Error("publication_catalog_inventory_document_path");
  }
  if (
    document.bytes.byteLength !== catalog.publicationInventory.fileSize ||
    !verifyMuseumSha256(document.bytes, catalog.publicationInventory.fileSha256)
  ) {
    throw new Error("publication_catalog_inventory_file_hash_mismatch");
  }
  const text = new TextDecoder("utf-8", { fatal: true }).decode(document.bytes);
  let value: unknown;
  try {
    value = parseMuseumPublicationJson(text);
  } catch {
    throw new Error("publication_catalog_inventory_json_invalid");
  }
  const inventory = asRecord(value, "publication_catalog_inventory_shape");
  assertExactKeys(
    inventory,
    [
      "$schema",
      "inventory_version",
      "inventory_id",
      "scope",
      "integrity",
      "assembler",
      "bundle",
      "entries",
      "counts",
      "required_source_sets",
    ],
    "publication_catalog_inventory_shape"
  );
  if (
    inventory.$schema !== PUBLICATION_INVENTORY_SCHEMA ||
    typeof inventory.inventory_version !== "string" ||
    inventory.inventory_id !== "6529NM_PUBLIC_VISITOR_CORPUS" ||
    inventory.scope !== "visitor_publication_corpus" ||
    !Array.isArray(inventory.entries) ||
    !isPlainRecord(inventory.counts) ||
    !isPlainRecord(inventory["required_source_sets"])
  ) {
    throw new Error("publication_catalog_inventory_shape");
  }
  const requiredSourceSets = decodeRequiredSourceSets(
    inventory["required_source_sets"]
  );
  const integrity = asRecord(
    inventory.integrity,
    "publication_catalog_inventory_integrity"
  );
  assertExactKeys(
    integrity,
    ["canonicalization_id", "body_sha256", "body_keccak256"],
    "publication_catalog_inventory_integrity"
  );
  if (
    integrity.canonicalization_id !== catalog.publicationInventory.canonicalizationId ||
    integrity.canonicalization_id !== MUSEUM_PUBLICATION_CANONICALIZATION_ID ||
    integrity.body_sha256 !== catalog.publicationInventory.bodySha256 ||
    integrity.body_keccak256 !== catalog.publicationInventory.jcsKeccak
  ) {
    throw new Error("publication_catalog_inventory_integrity");
  }
  const assembler = asRecord(
    inventory.assembler,
    "publication_catalog_inventory_assembler"
  );
  assertExactKeys(
    assembler,
    ["required_paths", "activation_mode", "bundle_path"],
    "publication_catalog_inventory_assembler"
  );
  const bundle = asRecord(
    inventory.bundle,
    "publication_catalog_inventory_bundle"
  );
  assertExactKeys(
    bundle,
    ["path", "schema", "required_in_catalog", "activation_mode", "max_serialized_bytes"],
    "publication_catalog_inventory_bundle"
  );
  if (
    !Array.isArray(assembler.required_paths) ||
    assembler.activation_mode !== "atomic" ||
    assembler.bundle_path !== MUSEUM_PUBLICATION_BUNDLE_PATH ||
    bundle.path !== MUSEUM_PUBLICATION_BUNDLE_PATH ||
    bundle.schema !== PUBLICATION_BUNDLE_INVENTORY_SCHEMA ||
    bundle.required_in_catalog !== true ||
    bundle.activation_mode !== "atomic" ||
    bundle.max_serialized_bytes !== MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES
  ) {
    throw new Error("publication_catalog_inventory_bundle");
  }
  const requiredPaths = assembler.required_paths.map((path) => {
    if (typeof path !== "string") {
      throw new Error("publication_catalog_inventory_assembler");
    }
    assertCatalogPublicationPath(path);
    return path;
  });
  assertSortedUniquePaths(
    requiredPaths,
    "publication_catalog_inventory_assembler_paths"
  );
  return {
    inventory,
    entries: inventory.entries,
    counts: inventory.counts,
    inventoryVersion: inventory.inventory_version,
    assembler,
    requiredPaths,
    requiredSourceSets,
    bundle,
  };
}

function decodeInventoryEntries(
  entries: readonly unknown[]
): readonly MuseumPublicationInventoryEntry[] {
  return entries.map((entry): MuseumPublicationInventoryEntry => {
    const entryRecord = asRecord(
      entry,
      "publication_catalog_inventory_entry_invalid"
    );
    assertExactKeys(
      entryRecord,
      ["path", "kind", "delivery_role", "required_in_catalog", "activation_mode"],
      "publication_catalog_inventory_entry_invalid"
    );
    if (
      typeof entryRecord.path !== "string" ||
      typeof entryRecord.kind !== "string" ||
      (entryRecord.delivery_role !== "assembly_document" &&
        entryRecord.delivery_role !== "media_asset") ||
      entryRecord.required_in_catalog !== true ||
      (entryRecord.activation_mode !== "atomic" &&
        entryRecord.activation_mode !== "deferred_on_demand") ||
      (entryRecord.delivery_role === "assembly_document" &&
        entryRecord.activation_mode !== "atomic") ||
      (entryRecord.delivery_role === "media_asset" &&
        entryRecord.activation_mode !== "deferred_on_demand")
    ) {
      throw new Error("publication_catalog_inventory_entry_invalid");
    }
    assertCatalogPublicationPath(entryRecord.path);
    return {
      path: entryRecord.path,
      deliveryRole: entryRecord.delivery_role,
      kind: entryRecord.kind,
      activationMode: entryRecord.activation_mode,
    };
  });
}

function assertInventorySet(
  entries: readonly MuseumPublicationInventoryEntry[],
  context: MuseumPublicationInventoryContext,
  catalog: MuseumPublicationCatalog
): void {
  const inventoryPaths = entries.map((entry) => entry.path);
  assertSortedUniquePaths(
    inventoryPaths,
    "publication_catalog_inventory_paths"
  );
  const expectedAssembly = catalog.assemblyDocuments.map((entry) => entry.path);
  const expectedMedia = catalog.mediaAssets.map((entry) => entry.path);
  const expectedPaths = [...expectedAssembly, ...expectedMedia].sort();
  if (
    inventoryPaths.length !== expectedPaths.length ||
    inventoryPaths.some((path, index) => path !== expectedPaths[index])
  ) {
    throw new Error("publication_catalog_inventory_set_mismatch");
  }
  if (
    context.requiredPaths.length !== expectedAssembly.length ||
    context.requiredPaths.some(
      (path, index) => path !== expectedAssembly[index]
    )
  ) {
      throw new Error("publication_catalog_inventory_assembly_mismatch");
  }
  for (const paths of Object.values(context.requiredSourceSets)) {
    if (paths.some((path) => !expectedAssembly.includes(path))) {
      throw new Error("publication_catalog_inventory_required_source_set_unlisted");
    }
  }
  if (context.bundle["path"] !== catalog.assemblyBundle.descriptor.path) {
    throw new Error("publication_catalog_inventory_bundle_mismatch");
  }
  for (const entry of entries) {
    const expectedRole = expectedAssembly.includes(entry.path)
      ? "assembly_document"
      : "media_asset";
    if (entry.deliveryRole !== expectedRole) {
      throw new Error("publication_catalog_inventory_role_mismatch");
    }
  }
}

function assertInventoryCounts(
  entries: readonly MuseumPublicationInventoryEntry[],
  context: MuseumPublicationInventoryContext,
  catalog: MuseumPublicationCatalog
): void {
  const actualCounts = entries.reduce<Record<string, number>>(
    (result, entry) => {
      result[entry.kind] = (result[entry.kind] ?? 0) + 1;
      return result;
    },
    {}
  );
  const declaredCounts = Object.fromEntries(
    Object.entries(context.counts).map(([key, count]) => {
      if (!Number.isSafeInteger(count) || (count as number) < 1) {
        throw new Error("publication_catalog_inventory_counts");
      }
      return [key, count as number];
    })
  );
  const sortCounts = (countsToSort: Record<string, number>): string =>
    JSON.stringify(
      Object.fromEntries(
        Object.entries(countsToSort).sort(([left], [right]) =>
          left.localeCompare(right)
        )
      )
    );
  if (sortCounts(actualCounts) !== sortCounts(declaredCounts)) {
    throw new Error("publication_catalog_inventory_counts_mismatch");
  }
  if (
    context.inventoryVersion !== catalog.publicationInventory.inventoryVersion ||
    (() => {
      const body = { ...context.inventory };
      delete body["integrity"];
      return sha256Text(canonicalMuseumJson(body));
    })() !== catalog.publicationInventory.bodySha256 ||
    (() => {
      const body = { ...context.inventory };
      delete body["integrity"];
      return keccak256(toBytes(canonicalMuseumJson(body)));
    })() !== catalog.publicationInventory.jcsKeccak
  ) {
    throw new Error("publication_catalog_inventory_commitment_mismatch");
  }
}

export function assertMuseumPublicationInventoryDocument(
  document: MuseumSourceBundleDocument,
  catalog: MuseumPublicationCatalog
): void {
  const context = decodeInventoryContext(document, catalog);
  const entries = decodeInventoryEntries(context.entries);
  assertInventorySet(entries, context, catalog);
  assertInventoryCounts(entries, context, catalog);
}

export function verifyMuseumPublicationCatalogContentHash(
  catalog: MuseumPublicationCatalog
): void {
  const digest = keccak256(toBytes(canonicalMuseumJson(catalog.contentHash.payload)));
  if (digest !== catalog.contentHash.digest) {
    throw new Error("publication_catalog_content_hash_mismatch");
  }
}
