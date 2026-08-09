import {
  MUSEUM_PUBLICATION_BUNDLE_PATH,
  MUSEUM_PUBLICATION_CANONICALIZATION_ID,
  MUSEUM_PUBLICATION_INVENTORY_PATH,
  PUBLICATION_CATALOG_SCHEMA,
  assertExactKeys,
  asRecord,
  type MuseumPublicationCatalog,
  type MuseumPublicationCatalogAssemblyBundle,
  type MuseumPublicationCatalogDocument,
  type MuseumPublicationCatalogInventoryBinding,
  type MuseumPublicationCatalogManifestBinding,
} from "./catalog-contract";
import {
  decodeCatalogDocumentArray,
  requiredCommit,
  requiredKeccak,
  requiredSha,
  requiredString,
} from "./catalog-json";
import { MUSEUM_MANIFEST_PATH } from "./security";

type DecodedCatalogRoot = {
  contentHash: Record<string, unknown>;
  catalogId: string;
  sourceCommit: string;
  payload: Record<string, unknown>;
};

type DecodedCatalogBindings = {
  manifest: MuseumPublicationCatalogManifestBinding;
  inventory: MuseumPublicationCatalogInventoryBinding;
};

function nonNegativeSafeInteger(value: unknown, errorCode: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(errorCode);
  }
  return value as number;
}

function decodeCatalogRoot(value: unknown): DecodedCatalogRoot {
  const root = asRecord(value, "publication_catalog_shape");
  assertExactKeys(
    root,
    ["$schema", "envelope", "payload"],
    "publication_catalog_shape"
  );
  if (root.$schema !== PUBLICATION_CATALOG_SCHEMA) {
    throw new Error("publication_catalog_schema");
  }
  const envelope = asRecord(root.envelope, "publication_catalog_envelope");
  assertExactKeys(
    envelope,
    ["recordType", "contentHash", "uri"],
    "publication_catalog_envelope"
  );
  const contentHash = asRecord(
    envelope.contentHash,
    "publication_catalog_content_hash"
  );
  assertExactKeys(
    contentHash,
    ["algorithm", "digest", "canonicalizationId"],
    "publication_catalog_content_hash"
  );
  if (
    envelope.recordType !== "PUBLICATION_CATALOG" ||
    contentHash.algorithm !== 1 ||
    contentHash.canonicalizationId !== MUSEUM_PUBLICATION_CANONICALIZATION_ID ||
    typeof envelope.uri !== "string"
  ) {
    throw new Error("publication_catalog_envelope");
  }
  const payload = asRecord(root.payload, "publication_catalog_payload");
  assertExactKeys(
    payload,
    [
      "catalog_id",
      "catalog_version",
      "state",
      "created_at",
      "reviewed_source_head_commit",
      "candidate_parent_commit",
      "manifest_binding",
      "publication_inventory_binding",
      "bundle_binding",
      "assembly_documents",
      "media_assets",
      "activation_policy",
    ],
    "publication_catalog_payload"
  );
  const sourceCommit = requiredCommit(
    payload,
    "reviewed_source_head_commit",
    "publication_catalog_payload"
  );
  const catalogId = requiredString(
    payload,
    "catalog_id",
    "publication_catalog_payload"
  );
  if (
    requiredString(
      payload,
      "catalog_version",
      "publication_catalog_version"
    ) !== "1.0.0"
  ) {
    throw new Error("publication_catalog_version");
  }
  if (
    catalogId !== `6529NM-PUBCAT-${sourceCommit}` ||
    payload.state !== "immutable_binding" ||
    !Number.isFinite(
      Date.parse(
        requiredString(payload, "created_at", "publication_catalog_payload")
      )
    ) ||
    payload.activation_policy !== "frontend_activates_only_verified_catalog"
  ) {
    throw new Error("publication_catalog_payload");
  }
  const candidateParentCommit = requiredCommit(
    payload,
    "candidate_parent_commit",
    "publication_catalog_payload"
  );
  if (candidateParentCommit === sourceCommit) {
    throw new Error("publication_catalog_candidate_parent");
  }
  return { contentHash, catalogId, sourceCommit, payload };
}

function decodeCatalogBindings(
  payload: Record<string, unknown>
): DecodedCatalogBindings {
  const manifest = asRecord(
    payload["manifest_binding"],
    "publication_catalog_manifest_binding"
  );
  assertExactKeys(
    manifest,
    [
      "path",
      "file_size",
      "file_sha256",
      "body_sha256",
      "body_keccak256",
      "canonicalization_id",
      "immutable_source_url",
      "immutable_raw_url",
    ],
    "publication_catalog_manifest_binding"
  );
  const inventory = asRecord(
    payload["publication_inventory_binding"],
    "publication_catalog_inventory_binding"
  );
  assertExactKeys(
    inventory,
    [
      "path",
      "file_size",
      "file_sha256",
      "body_sha256",
      "body_keccak256",
      "canonicalization_id",
      "inventory_version",
      "counts",
      "immutable_source_url",
      "immutable_raw_url",
    ],
    "publication_catalog_inventory_binding"
  );
  const manifestFileSize = nonNegativeSafeInteger(
    manifest.file_size,
    "publication_catalog_manifest_binding"
  );
  if (
    manifest.path !== MUSEUM_MANIFEST_PATH ||
    inventory.path !== MUSEUM_PUBLICATION_INVENTORY_PATH ||
    typeof inventory.counts !== "object" ||
    inventory.counts === null ||
    Array.isArray(inventory.counts)
  ) {
    throw new Error("publication_catalog_binding_path");
  }
  return {
    manifest: {
      path: manifest.path,
      fileSha256: requiredSha(
        manifest,
        "file_sha256",
        "publication_catalog_manifest_binding"
      ),
      fileSize: manifestFileSize,
      sourceUrl: requiredString(
        manifest,
        "immutable_source_url",
        "publication_catalog_manifest_binding"
      ),
      rawUrl: requiredString(
        manifest,
        "immutable_raw_url",
        "publication_catalog_manifest_binding"
      ),
      sha256: requiredSha(
        manifest,
        "body_sha256",
        "publication_catalog_manifest_binding"
      ),
      jcsKeccak: requiredKeccak(
        manifest,
        "body_keccak256",
        "publication_catalog_manifest_binding"
      ),
      canonicalizationId: requiredKeccak(
        manifest,
        "canonicalization_id",
        "publication_catalog_manifest_binding"
      ),
    },
    inventory: {
      path: inventory.path,
      fileSize: nonNegativeSafeInteger(
        inventory.file_size,
        "publication_catalog_inventory_binding"
      ),
      fileSha256: requiredSha(
        inventory,
        "file_sha256",
        "publication_catalog_inventory_binding"
      ),
      completeInventorySha256: requiredSha(
        inventory,
        "body_sha256",
        "publication_catalog_inventory_binding"
      ),
      completeInventoryJcsKeccak: requiredKeccak(
        inventory,
        "body_keccak256",
        "publication_catalog_inventory_binding"
      ),
      canonicalizationId: requiredKeccak(
        inventory,
        "canonicalization_id",
        "publication_catalog_inventory_binding"
      ),
      inventoryVersion: requiredString(
        inventory,
        "inventory_version",
        "publication_catalog_inventory_binding"
      ),
      counts: Object.fromEntries(
        Object.entries(inventory.counts as Record<string, unknown>).map(
          ([key, count]) => {
            if (!Number.isSafeInteger(count) || (count as number) < 1) {
              throw new Error("publication_catalog_inventory_binding");
            }
            return [key, count as number];
          }
        )
      ),
      sourceUrl: requiredString(
        inventory,
        "immutable_source_url",
        "publication_catalog_inventory_binding"
      ),
      rawUrl: requiredString(
        inventory,
        "immutable_raw_url",
        "publication_catalog_inventory_binding"
      ),
    },
  };
}

function decodeCatalogDocuments(payload: Record<string, unknown>): {
  assemblyDocuments: readonly MuseumPublicationCatalogDocument[];
  mediaAssets: readonly MuseumPublicationCatalogDocument[];
} {
  return {
    assemblyDocuments: decodeCatalogDocumentArray(
      payload["assembly_documents"],
      "publication_catalog_assembly_documents"
    ),
    mediaAssets: decodeCatalogDocumentArray(
      payload["media_assets"],
      "publication_catalog_media_assets"
    ),
  };
}

function decodeCatalogBundleBinding(
  payload: Record<string, unknown>
): MuseumPublicationCatalogAssemblyBundle {
  const bundleRecord = asRecord(
    payload["bundle_binding"],
    "publication_catalog_assembly_bundle"
  );
  assertExactKeys(
    bundleRecord,
    [
      "path",
      "file_size",
      "file_sha256",
      "raw_file_size",
      "raw_file_sha256",
      "body_sha256",
      "body_keccak256",
      "canonicalization_id",
      "source_inventory_body_sha256",
      "source_inventory_body_keccak256",
      "immutable_source_url",
      "immutable_raw_url",
    ],
    "publication_catalog_assembly_bundle"
  );
  if (bundleRecord.path !== MUSEUM_PUBLICATION_BUNDLE_PATH) {
    throw new Error("publication_catalog_assembly_bundle");
  }
  const fileSize = bundleRecord.file_size;
  const rawFileSize = bundleRecord["raw_file_size"];
  if (
    !Number.isSafeInteger(fileSize) ||
    (fileSize as number) < 0 ||
    !Number.isSafeInteger(rawFileSize) ||
    (rawFileSize as number) < 0
  ) {
    throw new Error("publication_catalog_assembly_bundle");
  }
  const canonicalizationId = requiredKeccak(
    bundleRecord,
    "canonicalization_id",
    "publication_catalog_assembly_bundle"
  );
  if (canonicalizationId !== MUSEUM_PUBLICATION_CANONICALIZATION_ID) {
    throw new Error("publication_catalog_assembly_bundle");
  }
  const sourceUrl = requiredString(
    bundleRecord,
    "immutable_source_url",
    "publication_catalog_assembly_bundle"
  );
  const rawUrl = requiredString(
    bundleRecord,
    "immutable_raw_url",
    "publication_catalog_assembly_bundle"
  );
  return {
    descriptor: {
      path: bundleRecord.path,
      size: rawFileSize as number,
      byteMode: "raw",
      sha256: requiredSha(
        bundleRecord,
        "raw_file_sha256",
        "publication_catalog_assembly_bundle"
      ),
      sourceUrl,
      rawUrl,
    },
    embeddedDocuments: [],
    completeInventorySha256: requiredSha(
      bundleRecord,
      "source_inventory_body_sha256",
      "publication_catalog_assembly_bundle"
    ),
    completeInventoryJcsKeccak: requiredKeccak(
      bundleRecord,
      "source_inventory_body_keccak256",
      "publication_catalog_assembly_bundle"
    ),
    fileSize: fileSize as number,
    fileSha256: requiredSha(
      bundleRecord,
      "file_sha256",
      "publication_catalog_assembly_bundle"
    ),
    rawFileSize: rawFileSize as number,
    rawFileSha256: requiredSha(
      bundleRecord,
      "raw_file_sha256",
      "publication_catalog_assembly_bundle"
    ),
    bodySha256: requiredSha(
      bundleRecord,
      "body_sha256",
      "publication_catalog_assembly_bundle"
    ),
    bodyKeccak: requiredKeccak(
      bundleRecord,
      "body_keccak256",
      "publication_catalog_assembly_bundle"
    ),
    canonicalizationId,
  };
}

export function decodePublicationCatalog(
  value: unknown
): MuseumPublicationCatalog {
  const { contentHash, catalogId, sourceCommit, payload } =
    decodeCatalogRoot(value);
  const { manifest, inventory } = decodeCatalogBindings(payload);
  const { assemblyDocuments, mediaAssets } = decodeCatalogDocuments(payload);
  const assemblyBundle = decodeCatalogBundleBinding(payload);
  const assemblyBundleWithDocuments: MuseumPublicationCatalogAssemblyBundle = {
    ...assemblyBundle,
    embeddedDocuments: assemblyDocuments,
  };
  const candidateParentCommit = requiredCommit(
    payload,
    "candidate_parent_commit",
    "publication_catalog_payload"
  );
  return {
    id: catalogId,
    reviewed: true,
    sourceCommit,
    candidateParentCommit,
    manifest,
    publicationInventory: inventory,
    assemblyDocuments,
    mediaAssets,
    assemblyBundle: assemblyBundleWithDocuments,
    contentHash: {
      algorithm: 1,
      canonicalizationId: requiredKeccak(
        contentHash,
        "canonicalizationId",
        "publication_catalog_content_hash"
      ),
      digest: requiredKeccak(
        contentHash,
        "digest",
        "publication_catalog_content_hash"
      ),
      payload,
    },
  };
}
