import { createHash } from "node:crypto";
import {
  assertGovernedMuseumPath,
  assertSafeMuseumRepositoryPath,
  buildImmutableMuseumSourceUrl,
  buildImmutableMuseumRawUrl,
  isExactGitCommit,
  MUSEUM_MANIFEST_PATH,
} from "./security";
import type { MuseumSha256 } from "./types";

/**
 * This is the only moving-main path admitted by the catalog contract. The
 * catalog decoder is deliberately source-bound: WP-1 owns its wire schema,
 * field names, review vocabulary, and exact hash commitments.
 */
export const MUSEUM_PUBLICATION_CATALOG_POINTER_PATH =
  "release-artifacts/latest/publication-catalog-pointer.json" as const;
export const MUSEUM_PUBLICATION_INVENTORY_PATH =
  "schemas/public-publication-inventory.json" as const;
export const MUSEUM_PUBLICATION_BUNDLE_PATH =
  "records/publication/visitor-corpus-bundle-v1.json" as const;
export const MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES = 8_000_000 as const;
export const MUSEUM_PUBLICATION_CANONICALIZATION_ID =
  "0x886c7c89c308c459ca8a626e0ef36a5ea9f4c7a7b56aaf86c71a2ddf3b4f9044" as const;
const MUSEUM_CATALOG_RAW_BYTE_MODE = "raw" as const;
export const PUBLICATION_CATALOG_SCHEMA =
  "https://6529networkmuseum.org/schemas/publication-catalog-v1.json" as const;
export const PUBLICATION_CATALOG_POINTER_SCHEMA =
  "https://6529networkmuseum.org/schemas/publication-catalog-pointer-v1.json" as const;
export const PUBLICATION_BUNDLE_SCHEMA =
  "../../schemas/public-publication-bundle.schema.json" as const;
export const PUBLICATION_BUNDLE_INVENTORY_SCHEMA =
  "https://6529networkmuseum.org/schemas/public-publication-bundle-v1.json" as const;
export const PUBLICATION_INVENTORY_SCHEMA =
  "https://6529networkmuseum.org/schemas/public-publication-inventory-v1.json" as const;

export interface MuseumPublicationCatalogPointer {
  readonly catalogPath: string;
  readonly catalogSha256: MuseumSha256;
  /** Pointer commitment to the catalog envelope content hash. */
  readonly catalogEnvelopeContentHash: `0x${string}`;
  readonly sourceCommit: string;
}

export interface MuseumPublicationCatalogContentHash {
  /** Source wire algorithm identifier 1 (Keccak-256). */
  readonly algorithm: number;
  readonly canonicalizationId: string;
  readonly digest: `0x${string}`;
  /** The source-defined payload covered by envelope.contentHash. */
  readonly payload: unknown;
}

export interface MuseumPublicationCatalogManifestBinding {
  readonly path: string;
  /** SHA-256 of the exact committed manifest bytes. */
  readonly fileSha256: MuseumSha256;
  readonly fileSize: number;
  /** Visitor-facing immutable GitHub source page; never used for fetching. */
  readonly sourceUrl: string;
  /** Runtime fetch URL at the exact reviewed source commit. */
  readonly rawUrl: string;
  /** Source-declared manifest SHA-256 commitment over its canonical body. */
  readonly sha256: MuseumSha256;
  readonly jcsKeccak: `0x${string}`;
  readonly canonicalizationId: string;
}

export interface MuseumPublicationCatalogInventoryBinding {
  readonly path: string;
  readonly fileSize: number;
  readonly fileSha256: MuseumSha256;
  readonly bodySha256: MuseumSha256;
  readonly jcsKeccak: `0x${string}`;
  readonly canonicalizationId: string;
  readonly inventoryVersion: string;
  readonly counts: Readonly<Record<string, number>>;
  /** Visitor-facing immutable GitHub source page; never used for fetching. */
  readonly sourceUrl: string;
  /** Runtime fetch URL at the exact reviewed source commit. */
  readonly rawUrl: string;
}

export interface MuseumPublicationCatalogDocument {
  readonly path: string;
  readonly size: number;
  readonly byteMode: string;
  readonly sha256: MuseumSha256;
  readonly jcsKeccak?: `0x${string}`;
  readonly canonicalizationId?: string;
  /** Visitor-facing immutable GitHub source page; never used for fetching. */
  readonly sourceUrl: string;
  /** Runtime fetch URL at the exact reviewed source commit. */
  readonly rawUrl: string;
}

/**
 * A bundle is a catalog-bound delivery object, not a visitor corpus entry.
 * The internal projection keeps the exact source `bundle_binding` fixity
 * alongside the embedded assembly entries checked before activation.
 */
export interface MuseumPublicationCatalogAssemblyBundle {
  /** Internal view synthesized from the exact source `bundle_binding`. */
  readonly descriptor: MuseumPublicationCatalogDocument;
  readonly embeddedDocuments: readonly MuseumPublicationCatalogDocument[];
  readonly inventorySha256: MuseumSha256;
  readonly inventoryKeccak: `0x${string}`;
  readonly fileSize: number;
  readonly fileSha256: MuseumSha256;
  readonly rawFileSize: number;
  readonly rawFileSha256: MuseumSha256;
  readonly bodySha256: MuseumSha256;
  readonly bodyKeccak: `0x${string}`;
  readonly canonicalizationId: `0x${string}`;
}

export interface MuseumPublicationCatalog {
  readonly id: string;
  readonly reviewed: boolean;
  readonly sourceCommit: string;
  readonly candidateParentCommit: string;
  readonly manifest: MuseumPublicationCatalogManifestBinding;
  readonly publicationInventory: MuseumPublicationCatalogInventoryBinding;
  /** Complete closed assembly inventory, sorted by path. */
  readonly assemblyDocuments: readonly MuseumPublicationCatalogDocument[];
  /** Complete closed deferred-media inventory, sorted by path. */
  readonly mediaAssets: readonly MuseumPublicationCatalogDocument[];
  /** One immutable B-contained bundle for the assembly inventory. */
  readonly assemblyBundle: MuseumPublicationCatalogAssemblyBundle;
  readonly contentHash: MuseumPublicationCatalogContentHash;
}

export interface MuseumPublicationCatalogAssemblyBundleResult {
  readonly documents: readonly MuseumSourceBundleDocument[];
  readonly inventorySha256: MuseumSha256;
  readonly inventoryKeccak: `0x${string}`;
}

export interface MuseumSourceBundleDocument {
  readonly path: string;
  readonly bytes: Uint8Array;
}

/**
 * WP-1 supplies the decoder once the PUBLICATION_CATALOG schema is final.
 * Keeping decoding here as an injected boundary prevents a guessed field name
 * from becoming frontend authority while still enforcing the invariant after
 * decoding.
 */
export interface MuseumPublicationCatalogResolver {
  readonly pointerPath: string;
  decodePointer(value: unknown): MuseumPublicationCatalogPointer;
  decodeCatalog(value: unknown): MuseumPublicationCatalog;
  /** Decodes the source-defined bundle envelope without trusting embedded data. */
  decodeAssemblyBundle(
    bytes: Uint8Array,
    catalog: MuseumPublicationCatalog
  ): MuseumPublicationCatalogAssemblyBundleResult;
  /** Verifies the catalog envelope's source-defined contentHash commitment. */
  verifyCatalogEnvelope(
    value: unknown,
    catalog: MuseumPublicationCatalog
  ): void;
  /** Verifies the source-defined per-document JCS/Keccak commitment. */
  verifyDocumentCommitment(
    entry: MuseumPublicationCatalogDocument,
    bytes: Uint8Array
  ): void;
}

export interface MuseumPublicationCatalogFetchResult {
  readonly pointer: MuseumPublicationCatalogPointer;
  readonly catalog: MuseumPublicationCatalog;
}

export function isPlainRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Wire records remain open for exact-key validation, but declaring the fields
 * read by the decoder keeps noPropertyAccessFromIndexSignature useful for the
 * untrusted JSON boundary instead of weakening the compiler setting.
 */
type MuseumPublicationWireRecord = Record<string, unknown> & {
  $schema?: unknown;
  activated_at?: unknown;
  activation?: unknown;
  activation_mode?: unknown;
  activation_policy?: unknown;
  candidate_parent_commit?: unknown;
  actor_id?: unknown;
  algorithm?: unknown;
  assembler?: unknown;
  assembly_bundle?: unknown;
  bundle_binding?: unknown;
  assembly_documents?: unknown;
  body_keccak256?: unknown;
  body_sha256?: unknown;
  bundle?: unknown;
  bundle_id?: unknown;
  bundle_path?: unknown;
  bundle_version?: unknown;
  byte_mode?: unknown;
  canonicalization_id?: unknown;
  canonicalizationId?: unknown;
  catalog_version?: unknown;
  content?: unknown;
  content_bytes?: unknown;
  contentHash?: unknown;
  counts?: unknown;
  created_at?: unknown;
  delivery_role?: unknown;
  digest?: unknown;
  entries?: unknown;
  entry_count?: unknown;
  envelope?: unknown;
  file_size?: unknown;
  file_sha256?: unknown;
  immutable_raw_url?: unknown;
  immutable_source_url?: unknown;
  integrity?: unknown;
  inventory_id?: unknown;
  inventory_version?: unknown;
  jcs_keccak256?: unknown;
  kind?: unknown;
  manifest_binding?: unknown;
  max_serialized_bytes?: unknown;
  media_assets?: unknown;
  mode?: unknown;
  path?: unknown;
  payload?: unknown;
  pointer_version?: unknown;
  prior_catalog_id?: unknown;
  publication_inventory_binding?: unknown;
  recordType?: unknown;
  required_in_catalog?: unknown;
  required_paths?: unknown;
  reviewed_source_head_commit?: unknown;
  schema?: unknown;
  scope?: unknown;
  sha256?: unknown;
  source_inventory_body_keccak256?: unknown;
  source_inventory_body_sha256?: unknown;
  source_inventory_path?: unknown;
  state?: unknown;
  uri?: unknown;
};

export function asRecord(
  value: unknown,
  code: string
): MuseumPublicationWireRecord {
  if (!isPlainRecord(value)) throw new Error(code);
  return value;
}

export function assertExactKeys(
  record: Record<string, unknown>,
  expectedKeys: readonly string[],
  code: string
): void {
  const actualKeys = Object.keys(record).sort((left, right) =>
    left.localeCompare(right)
  );
  const expected = [...expectedKeys].sort((left, right) =>
    left.localeCompare(right)
  );
  if (
    actualKeys.length !== expected.length ||
    actualKeys.some((key, index) => key !== expected[index])
  ) {
    throw new Error(code);
  }
}

export function sha256Text(text: string): MuseumSha256 {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

export function assertSha256(value: MuseumSha256, code: string): void {
  if (!/^sha256:[a-f0-9]{64}$/u.test(value)) throw new Error(code);
}

export function assertKeccak(
  value: string,
  code: string
): asserts value is `0x${string}` {
  if (!/^0x[a-f0-9]{64}$/u.test(value)) throw new Error(code);
}

function assertNoMovingOrShortCommitUrl(url: string, commit: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("publication_catalog_url_invalid");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username.length > 0 ||
    parsed.password.length > 0 ||
    parsed.port.length > 0 ||
    parsed.search.length > 0 ||
    parsed.hash.length > 0 ||
    /(?:^|[/.])(?:main|master|HEAD|head)(?:$|[/.])/u.test(parsed.pathname)
  ) {
    throw new Error("publication_catalog_url_not_immutable");
  }
  if (!parsed.pathname.includes(`/${commit}/`)) {
    throw new Error("publication_catalog_url_commit_mismatch");
  }
}

function assertCatalogSourceUrl(
  url: string,
  commit: string,
  path: string
): void {
  assertNoMovingOrShortCommitUrl(url, commit);
  const source = buildImmutableMuseumSourceUrl(commit, path);
  if (url !== source) {
    throw new Error("publication_catalog_source_url_mismatch");
  }
}

function assertCatalogRawUrl(url: string, commit: string, path: string): void {
  assertNoMovingOrShortCommitUrl(url, commit);
  const raw = buildImmutableMuseumRawUrl(commit, path);
  if (url !== raw) {
    throw new Error("publication_catalog_url_mismatch");
  }
}

export function assertCatalogPublicationPath(path: string): void {
  assertSafeMuseumRepositoryPath(path);
  if (path.startsWith("release-artifacts/")) {
    throw new Error("publication_catalog_release_artifact_path");
  }
}

function assertCatalogDocument(
  document: MuseumPublicationCatalogDocument,
  commit: string,
  role: "assembly" | "media" | "bundle"
): void {
  assertCatalogPublicationPath(document.path);
  if (role === "assembly") {
    assertGovernedMuseumPath(document.path);
  }
  if (
    !Number.isSafeInteger(document.size) ||
    document.size < 0 ||
    !["lf-normalized", MUSEUM_CATALOG_RAW_BYTE_MODE].includes(document.byteMode)
  ) {
    throw new Error("publication_catalog_document_invalid");
  }
  assertSha256(document.sha256, "publication_catalog_document_hash");
  if (document.jcsKeccak !== undefined) {
    assertKeccak(document.jcsKeccak, "publication_catalog_document_keccak");
  } else if (document.canonicalizationId !== undefined) {
    throw new Error("publication_catalog_document_canonicalization");
  }
  assertCatalogSourceUrl(document.sourceUrl, commit, document.path);
  assertCatalogRawUrl(document.rawUrl, commit, document.path);
}

export function assertSortedUniquePaths(
  paths: readonly string[],
  errorCode: string
): void {
  const sorted = [...paths].sort((left, right) => left.localeCompare(right));
  if (
    paths.length === 0 ||
    paths.some((path) => path.trim().length === 0) ||
    new Set(paths).size !== paths.length ||
    paths.some((path, index) => path !== sorted[index])
  ) {
    throw new Error(errorCode);
  }
}

function sameCatalogDocument(
  left: MuseumPublicationCatalogDocument,
  right: MuseumPublicationCatalogDocument
): boolean {
  return (
    left.path === right.path &&
    left.size === right.size &&
    left.byteMode === right.byteMode &&
    left.sha256 === right.sha256 &&
    left.jcsKeccak === right.jcsKeccak &&
    left.canonicalizationId === right.canonicalizationId &&
    left.sourceUrl === right.sourceUrl &&
    left.rawUrl === right.rawUrl
  );
}

function assertCatalogIdentity(
  pointer: MuseumPublicationCatalogPointer,
  catalog: MuseumPublicationCatalog
): void {
  assertSafeMuseumRepositoryPath(pointer.catalogPath);
  if (!pointer.catalogPath.endsWith(".json")) {
    throw new Error("publication_catalog_pointer_path");
  }
  assertSha256(pointer.catalogSha256, "publication_catalog_pointer_hash");
  assertKeccak(
    pointer.catalogEnvelopeContentHash,
    "publication_catalog_pointer_content_hash"
  );
  if (
    catalog.id !== `6529NM-PUBCAT-${catalog.sourceCommit}` ||
    catalog.reviewed !== true ||
    !isExactGitCommit(catalog.sourceCommit) ||
    !isExactGitCommit(catalog.candidateParentCommit) ||
    catalog.candidateParentCommit === catalog.sourceCommit
  ) {
    throw new Error("publication_catalog_review_or_commit");
  }
  if (
    pointer.sourceCommit !== catalog.sourceCommit ||
    !isExactGitCommit(pointer.sourceCommit) ||
    pointer.catalogPath !==
      `release-artifacts/catalog/6529NM-PUBCAT-${catalog.sourceCommit}.json`
  ) {
    throw new Error("publication_catalog_pointer_catalog_mismatch");
  }
  if (pointer.catalogEnvelopeContentHash !== catalog.contentHash.digest) {
    throw new Error("publication_catalog_pointer_content_hash_mismatch");
  }
}

function assertCatalogManifest(catalog: MuseumPublicationCatalog): void {
  if (catalog.manifest.path !== MUSEUM_MANIFEST_PATH) {
    throw new Error("publication_catalog_manifest_path");
  }
  assertSafeMuseumRepositoryPath(catalog.manifest.path);
  assertGovernedMuseumPath(catalog.manifest.path);
  assertSha256(
    catalog.manifest.fileSha256,
    "publication_catalog_manifest_file_hash"
  );
  if (
    !Number.isSafeInteger(catalog.manifest.fileSize) ||
    catalog.manifest.fileSize < 0
  ) {
    throw new Error("publication_catalog_manifest_size");
  }
  assertSha256(catalog.manifest.sha256, "publication_catalog_manifest_hash");
  assertKeccak(
    catalog.manifest.jcsKeccak,
    "publication_catalog_manifest_keccak"
  );
  if (catalog.manifest.canonicalizationId.trim().length === 0) {
    throw new Error("publication_catalog_manifest_canonicalization");
  }
  if (
    catalog.manifest.canonicalizationId !==
    MUSEUM_PUBLICATION_CANONICALIZATION_ID
  ) {
    throw new Error("publication_catalog_manifest_canonicalization");
  }
  assertCatalogSourceUrl(
    catalog.manifest.sourceUrl,
    catalog.sourceCommit,
    catalog.manifest.path
  );
  assertCatalogRawUrl(
    catalog.manifest.rawUrl,
    catalog.sourceCommit,
    catalog.manifest.path
  );
}

function assertCatalogInventory(catalog: MuseumPublicationCatalog): void {
  if (catalog.publicationInventory.path !== MUSEUM_PUBLICATION_INVENTORY_PATH) {
    throw new Error("publication_catalog_inventory_path");
  }
  assertSha256(
    catalog.publicationInventory.fileSha256,
    "publication_catalog_inventory_file_hash"
  );
  if (
    !Number.isSafeInteger(catalog.publicationInventory.fileSize) ||
    catalog.publicationInventory.fileSize < 0
  ) {
    throw new Error("publication_catalog_inventory_file_size");
  }
  assertSha256(
    catalog.publicationInventory.bodySha256,
    "publication_catalog_inventory_body_hash"
  );
  assertKeccak(
    catalog.publicationInventory.jcsKeccak,
    "publication_catalog_inventory_keccak"
  );
  assertKeccak(
    catalog.publicationInventory.canonicalizationId,
    "publication_catalog_inventory_canonicalization"
  );
  if (
    catalog.publicationInventory.canonicalizationId !==
    MUSEUM_PUBLICATION_CANONICALIZATION_ID
  ) {
    throw new Error("publication_catalog_inventory_canonicalization");
  }
  if (catalog.publicationInventory.inventoryVersion.trim().length === 0) {
    throw new Error("publication_catalog_inventory_version");
  }
  const inventoryCounts = Object.entries(catalog.publicationInventory.counts);
  if (
    inventoryCounts.length === 0 ||
    inventoryCounts.some(
      ([key, count]) =>
        key.trim().length === 0 || !Number.isSafeInteger(count) || count < 1
    )
  ) {
    throw new Error("publication_catalog_inventory_counts");
  }
  assertCatalogSourceUrl(
    catalog.publicationInventory.sourceUrl,
    catalog.sourceCommit,
    catalog.publicationInventory.path
  );
  assertCatalogRawUrl(
    catalog.publicationInventory.rawUrl,
    catalog.sourceCommit,
    catalog.publicationInventory.path
  );
}

function assertCatalogContentHash(catalog: MuseumPublicationCatalog): void {
  assertKeccak(catalog.contentHash.digest, "publication_catalog_content_hash");
  if (
    catalog.contentHash.algorithm !== 1 ||
    catalog.contentHash.canonicalizationId.trim().length === 0 ||
    catalog.contentHash.canonicalizationId !==
      MUSEUM_PUBLICATION_CANONICALIZATION_ID
  ) {
    throw new Error("publication_catalog_content_hash_algorithm");
  }
  assertKeccak(
    catalog.contentHash.canonicalizationId,
    "publication_catalog_content_hash_canonicalization"
  );
}

function assertCatalogDocuments(
  catalog: MuseumPublicationCatalog,
  requiredPaths: readonly string[]
): readonly string[] {
  const assemblyPaths = catalog.assemblyDocuments.map(
    (document) => document.path
  );
  const mediaPaths = catalog.mediaAssets.map((document) => document.path);
  assertSortedUniquePaths(assemblyPaths, "publication_catalog_assembly_paths");
  assertSortedUniquePaths(mediaPaths, "publication_catalog_media_paths");
  if (
    new Set([...assemblyPaths, ...mediaPaths]).size !==
    assemblyPaths.length + mediaPaths.length
  ) {
    throw new Error("publication_catalog_role_overlap");
  }
  const acceptedPaths = [...assemblyPaths, ...mediaPaths];
  for (const requiredPath of requiredPaths) {
    assertSafeMuseumRepositoryPath(requiredPath);
    if (!assemblyPaths.includes(requiredPath)) {
      throw new Error("publication_catalog_required_path_unlisted");
    }
  }
  if (!assemblyPaths.includes(MUSEUM_PUBLICATION_INVENTORY_PATH)) {
    throw new Error("publication_catalog_inventory_unlisted");
  }
  if (
    acceptedPaths.includes(catalog.manifest.path) ||
    acceptedPaths.includes(catalog.assemblyBundle.descriptor.path)
  ) {
    throw new Error("publication_catalog_manifest_is_document");
  }
  for (const document of catalog.assemblyDocuments) {
    assertCatalogDocument(document, catalog.sourceCommit, "assembly");
  }
  for (const asset of catalog.mediaAssets) {
    assertCatalogDocument(asset, catalog.sourceCommit, "media");
  }
  return assemblyPaths;
}

function assertCatalogBundle(
  catalog: MuseumPublicationCatalog,
  assemblyPaths: readonly string[]
): void {
  assertCatalogDocument(
    catalog.assemblyBundle.descriptor,
    catalog.sourceCommit,
    "bundle"
  );
  if (
    catalog.assemblyBundle.descriptor.path !== MUSEUM_PUBLICATION_BUNDLE_PATH
  ) {
    throw new Error("publication_catalog_bundle_path");
  }
  if (
    catalog.assemblyBundle.descriptor.size > MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES
  ) {
    throw new Error("publication_catalog_bundle_too_large");
  }
  if (
    catalog.assemblyBundle.inventorySha256 !==
      catalog.publicationInventory.bodySha256 ||
    catalog.assemblyBundle.inventoryKeccak !==
      catalog.publicationInventory.jcsKeccak
  ) {
    throw new Error("publication_catalog_bundle_inventory_mismatch");
  }
  const bundlePaths = catalog.assemblyBundle.embeddedDocuments.map(
    (document) => document.path
  );
  assertSortedUniquePaths(bundlePaths, "publication_catalog_bundle_paths");
  if (
    bundlePaths.length !== assemblyPaths.length ||
    bundlePaths.some((path, index) => path !== assemblyPaths[index])
  ) {
    throw new Error("publication_catalog_bundle_inventory_mismatch");
  }
  for (const document of catalog.assemblyBundle.embeddedDocuments) {
    assertCatalogDocument(document, catalog.sourceCommit, "assembly");
    const expected = catalog.assemblyDocuments.find(
      (candidate) => candidate.path === document.path
    );
    if (expected === undefined || !sameCatalogDocument(expected, document)) {
      throw new Error("publication_catalog_bundle_document_mismatch");
    }
  }
  assertSha256(
    catalog.assemblyBundle.fileSha256,
    "publication_catalog_bundle_file_hash"
  );
  assertSha256(
    catalog.assemblyBundle.rawFileSha256,
    "publication_catalog_bundle_raw_file_hash"
  );
  assertSha256(
    catalog.assemblyBundle.bodySha256,
    "publication_catalog_bundle_body_hash"
  );
  assertKeccak(
    catalog.assemblyBundle.bodyKeccak,
    "publication_catalog_bundle_body_keccak"
  );
  assertKeccak(
    catalog.assemblyBundle.canonicalizationId,
    "publication_catalog_bundle_canonicalization"
  );
  if (
    catalog.assemblyBundle.canonicalizationId !==
      MUSEUM_PUBLICATION_CANONICALIZATION_ID ||
    !Number.isSafeInteger(catalog.assemblyBundle.fileSize) ||
    catalog.assemblyBundle.fileSize < 0 ||
    !Number.isSafeInteger(catalog.assemblyBundle.rawFileSize) ||
    catalog.assemblyBundle.rawFileSize < 0 ||
    catalog.assemblyBundle.descriptor.size !==
      catalog.assemblyBundle.rawFileSize ||
    catalog.assemblyBundle.descriptor.sha256 !==
      catalog.assemblyBundle.rawFileSha256
  ) {
    throw new Error("publication_catalog_bundle_fixity");
  }
}

export function assertMuseumPublicationCatalog(
  pointer: MuseumPublicationCatalogPointer,
  catalog: MuseumPublicationCatalog,
  requiredPaths: readonly string[]
): void {
  assertCatalogIdentity(pointer, catalog);
  assertCatalogManifest(catalog);
  assertCatalogInventory(catalog);
  assertCatalogContentHash(catalog);
  const assemblyPaths = assertCatalogDocuments(catalog, requiredPaths);
  assertCatalogBundle(catalog, assemblyPaths);
}
