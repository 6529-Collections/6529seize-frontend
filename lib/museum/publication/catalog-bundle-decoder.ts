import { keccak256, toBytes } from "viem";
import { canonicalMuseumJson, verifyMuseumSha256 } from "./manifest";
import {
  MUSEUM_PUBLICATION_INVENTORY_PATH,
  MUSEUM_PUBLICATION_CANONICALIZATION_ID,
  PUBLICATION_BUNDLE_SCHEMA,
  assertCatalogPublicationPath,
  assertExactKeys,
  assertKeccak,
  asRecord,
  sha256Text,
  type MuseumPublicationCatalog,
  type MuseumPublicationCatalogAssemblyBundleResult,
  type MuseumPublicationCatalogDocument,
  type MuseumSourceBundleDocument,
} from "./catalog-contract";
import {
  decodeCatalogDocumentRecord,
  parseMuseumPublicationJson,
  requiredKeccak,
  requiredSha,
} from "./catalog-json";

export function verifyDocumentJcs(
  entry: MuseumPublicationCatalogDocument,
  bytes: Uint8Array
): void {
  if (entry.jcsKeccak === undefined) return;
  let value: unknown;
  try {
    value = parseMuseumPublicationJson(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    );
  } catch {
    throw new Error("publication_catalog_document_json_invalid");
  }
  if (keccak256(toBytes(canonicalMuseumJson(value))) !== entry.jcsKeccak) {
    throw new Error("publication_catalog_document_keccak_mismatch");
  }
}

export function decodePublicationAssemblyBundle(
  bytes: Uint8Array,
  catalog: MuseumPublicationCatalog
): MuseumPublicationCatalogAssemblyBundleResult {
  let value: unknown;
  try {
    value = parseMuseumPublicationJson(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    );
  } catch {
    throw new Error("publication_catalog_bundle_json_invalid");
  }
  const bundle = asRecord(value, "publication_catalog_bundle_shape");
  assertExactKeys(
    bundle,
    [
      "$schema",
      "bundle_version",
      "bundle_id",
      "source_inventory_path",
      "source_inventory_body_sha256",
      "source_inventory_body_keccak256",
      "canonicalization_id",
      "entries",
      "entry_count",
      "content_bytes",
    ],
    "publication_catalog_bundle_shape"
  );
  if (
    bundle.$schema !== PUBLICATION_BUNDLE_SCHEMA ||
    bundle.bundle_version !== "1.0.0" ||
    bundle.bundle_id !== "6529NM_PUBLIC_VISITOR_CORPUS_BUNDLE_V1" ||
    bundle.source_inventory_path !== MUSEUM_PUBLICATION_INVENTORY_PATH ||
    bundle.canonicalization_id !== MUSEUM_PUBLICATION_CANONICALIZATION_ID ||
    bundle.canonicalization_id !==
      catalog.publicationInventory.canonicalizationId ||
    !Array.isArray(bundle.entries) ||
    !Number.isSafeInteger(bundle.entry_count) ||
    !Number.isSafeInteger(bundle.content_bytes) ||
    (bundle.content_bytes as number) < 0
  ) {
    throw new Error("publication_catalog_bundle_shape");
  }
  const inventorySha256 = requiredSha(
    bundle,
    "source_inventory_body_sha256",
    "publication_catalog_bundle_shape"
  );
  const inventoryKeccak = requiredKeccak(
    bundle,
    "source_inventory_body_keccak256",
    "publication_catalog_bundle_shape"
  );
  const entries = bundle.entries.map(
    (entryValue): MuseumSourceBundleDocument => {
      const entry = asRecord(
        entryValue,
        "publication_catalog_bundle_entry_shape"
      );
      assertExactKeys(
        entry,
        [
          "path",
          "byte_mode",
          "content",
          "file_size",
          "sha256",
          "jcs_keccak256",
        ],
        "publication_catalog_bundle_entry_shape"
      );
      if (
        typeof entry.path !== "string" ||
        entry.byte_mode !== "lf-normalized" ||
        typeof entry.content !== "string" ||
        !Number.isSafeInteger(entry.file_size) ||
        (entry.file_size as number) < 0
      ) {
        throw new Error("publication_catalog_bundle_entry_shape");
      }
      assertCatalogPublicationPath(entry.path);
      if (entry.content.startsWith("\uFEFF") || entry.content.includes("\r")) {
        throw new Error("publication_catalog_bundle_entry_normalization");
      }
      const content = new TextEncoder().encode(entry.content);
      if (
        content.byteLength !== entry.file_size ||
        !verifyMuseumSha256(
          content,
          requiredSha(entry, "sha256", "publication_catalog_bundle_entry_shape")
        )
      ) {
        throw new Error("publication_catalog_bundle_entry_fixity");
      }
      const jcsValue = entry.jcs_keccak256;
      if (jcsValue !== null && typeof jcsValue !== "string") {
        throw new Error("publication_catalog_bundle_entry_shape");
      }
      if (typeof jcsValue === "string") {
        assertKeccak(jcsValue, "publication_catalog_bundle_entry_shape");
        const expected = decodeCatalogDocumentRecord(
          {
            path: entry.path,
            file_size: entry.file_size,
            byte_mode: "lf-normalized",
            sha256: entry.sha256,
            jcs_keccak256: jcsValue,
            immutable_source_url: `https://github.com/6529-Collections/6529networkmuseum/blob/${catalog.sourceCommit}/${entry.path}`,
            immutable_raw_url: `https://raw.githubusercontent.com/6529-Collections/6529networkmuseum/${catalog.sourceCommit}/${entry.path}`,
          },
          "publication_catalog_bundle_entry_shape"
        );
        verifyDocumentJcs(expected, content);
      }
      return { path: entry.path, bytes: content };
    }
  );
  if (
    bundle.entry_count !== entries.length ||
    bundle.content_bytes !==
      entries.reduce((total, entry) => total + entry.bytes.byteLength, 0)
  ) {
    throw new Error("publication_catalog_bundle_count");
  }
  if (
    sha256Text(canonicalMuseumJson(bundle)) !==
      catalog.assemblyBundle.bodySha256 ||
    keccak256(toBytes(canonicalMuseumJson(bundle))) !==
      catalog.assemblyBundle.bodyKeccak
  ) {
    throw new Error("publication_catalog_bundle_body_commitment");
  }
  return { documents: entries, inventorySha256, inventoryKeccak };
}
