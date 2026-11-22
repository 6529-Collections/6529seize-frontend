import { sha256, type Hex } from "viem";
import { cidFromText, cidToText, sha256FromRawCid } from "./cid";
import type { CidFetcher } from "./ipfs";
import type { RegistryRelease } from "./registry";

/** The file index a release names by `rootCid`. */
const FILE_INDEX_KIND = "6529-provenance file index v1";
const PRESENTATION_MANIFEST =
  /^records\/(?:accessions\/6529NM\.\d{4}\.\d{3}|programs\/[A-Za-z0-9-]+)\/public\/presentation-manifest\.json$/u;
const HEX_64 = /^[0-9a-f]{64}$/u;
const decoder = new TextDecoder("utf-8", { fatal: true });

export interface OnchainIndexedFile {
  readonly path: string;
  readonly cid: string;
  /** Lower-case hex, without a prefix. */
  readonly sha256: string;
  readonly bytes: number;
}

export interface OnchainFileIndexState {
  readonly state: "verified" | "mismatch" | "unavailable" | "absent";
  readonly releaseId: number | null;
  readonly cidText: string | null;
  readonly servedBy: string | null;
  readonly fileCount: number;
  /** Index entries whose SHA-256 and size equal the verified catalog's. */
  readonly catalogMatches: number;
  /** Index paths the catalog lists differently or not at all. */
  readonly catalogMismatches: readonly string[];
  /** Raw-CID entries whose CID names a different SHA-256 than the entry. */
  readonly cidMismatches: readonly string[];
}

export interface OnchainImageDerivative {
  readonly width: number;
  readonly height: number;
  readonly cid: string;
  readonly sha256: string;
  readonly byteSize: number;
}

/** One work's presentation images, from a verified presentation manifest. */
export interface OnchainWorkImage {
  /** `work_entity_id` in accession manifests, `record_id` in program ones. */
  readonly key: string;
  readonly mediaEntityId: string | null;
  readonly altText: string;
  readonly derivatives: readonly OnchainImageDerivative[];
  readonly rightsStatus: string | null;
  readonly rightsTerms: readonly string[];
  readonly manifestPath: string;
}

export interface OnchainManifestState {
  readonly path: string;
  readonly state: "verified" | "mismatch" | "unavailable";
  readonly items: number;
}

export interface OnchainMediaState {
  readonly index: OnchainFileIndexState;
  readonly manifests: readonly OnchainManifestState[];
  readonly images: Readonly<Record<string, OnchainWorkImage>>;
}

const EMPTY_INDEX: OnchainFileIndexState = {
  state: "absent",
  releaseId: null,
  cidText: null,
  servedBy: null,
  fileCount: 0,
  catalogMatches: 0,
  catalogMismatches: [],
  cidMismatches: [],
};

function parseJson(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(decoder.decode(bytes));
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function bareSha256(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const hex = value.replace(/^sha256:/u, "").toLowerCase();
  return HEX_64.test(hex) ? hex : null;
}

/** Path → SHA-256 and size for every file the verified catalog lists. */
function catalogFiles(
  catalog: unknown
): Map<string, { sha256: string; bytes: number | null }> {
  const files = new Map<string, { sha256: string; bytes: number | null }>();
  if (!isRecord(catalog)) return files;
  for (const key of ["assembly_documents", "media_assets"]) {
    const list = catalog[key];
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (!isRecord(entry) || typeof entry["path"] !== "string") continue;
      const digest = bareSha256(entry["sha256"]);
      if (digest === null) continue;
      files.set(entry["path"], {
        sha256: digest,
        bytes: positiveInteger(entry["file_size"]),
      });
    }
  }
  return files;
}

function parseIndexFiles(root: unknown): OnchainIndexedFile[] | null {
  if (!isRecord(root) || !isRecord(root["files"])) return null;
  const files: OnchainIndexedFile[] = [];
  for (const [path, value] of Object.entries(root["files"])) {
    if (!isRecord(value)) return null;
    const digest = bareSha256(value["sha256"]);
    const bytes = positiveInteger(value["bytes"]);
    const cid = text(value["cid"]);
    if (digest === null || bytes === null || cid === null) return null;
    files.push({ path, cid, sha256: digest, bytes });
  }
  return files;
}

/** The latest release that names a root content ID. */
function indexRelease(
  releases: readonly RegistryRelease[]
): RegistryRelease | null {
  let found: RegistryRelease | null = null;
  for (const release of releases) {
    if (
      release.rootCid !== "0x" &&
      sha256FromRawCid(release.rootCid) !== null
    ) {
      found = release;
    }
  }
  return found;
}

interface VerifiedIndex {
  readonly state: OnchainFileIndexState;
  /** Entries that the catalog lists with the same SHA-256 and size. */
  readonly files: ReadonlyMap<string, OnchainIndexedFile>;
}

/**
 * Keeps index entries whose raw CID (when the CID is raw) names their
 * SHA-256 and that the catalog lists with the same SHA-256 and size.
 */
function crossCheck(
  entries: readonly OnchainIndexedFile[],
  listed: ReadonlyMap<string, { sha256: string; bytes: number | null }>
): {
  files: Map<string, OnchainIndexedFile>;
  catalogMismatches: string[];
  cidMismatches: string[];
} {
  const files = new Map<string, OnchainIndexedFile>();
  const catalogMismatches: string[] = [];
  const cidMismatches: string[] = [];
  for (const entry of entries) {
    const cid = cidFromText(entry.cid);
    const rawDigest = cid === null ? null : sha256FromRawCid(cid);
    const catalogEntry = listed.get(entry.path);
    if (
      rawDigest !== null &&
      rawDigest.slice(2).toLowerCase() !== entry.sha256
    ) {
      cidMismatches.push(entry.path);
    } else if (
      catalogEntry?.sha256 !== entry.sha256 ||
      (catalogEntry.bytes !== null && catalogEntry.bytes !== entry.bytes)
    ) {
      catalogMismatches.push(entry.path);
    } else {
      files.set(entry.path, entry);
    }
  }
  return { files, catalogMismatches, cidMismatches };
}

/**
 * Fetches the file index by its raw CID, accepts it only if its SHA-256 is
 * the digest the CID names, and keeps only entries that the chain-verified
 * catalog lists with the same SHA-256 and size.
 */
async function loadFileIndex(
  releases: readonly RegistryRelease[],
  catalog: unknown,
  catalogId: string | null,
  fetchCid: CidFetcher
): Promise<VerifiedIndex> {
  const release = indexRelease(releases);
  if (release === null) return { state: EMPTY_INDEX, files: new Map() };
  const expected = sha256FromRawCid(release.rootCid) as Hex;
  const cidText = cidToText(release.rootCid);
  const base = { releaseId: release.releaseId, cidText };
  const fetched = await fetchCid(
    release.rootCid,
    (bytes) => sha256(bytes).toLowerCase() === expected.toLowerCase()
  );
  if (!fetched?.accepted) {
    return {
      state: {
        ...EMPTY_INDEX,
        ...base,
        state: fetched === null ? "unavailable" : "mismatch",
        servedBy: fetched?.host ?? null,
      },
      files: new Map(),
    };
  }
  const root = parseJson(fetched.bytes);
  const entries = parseIndexFiles(root);
  if (
    entries === null ||
    !isRecord(root) ||
    root["kind"] !== FILE_INDEX_KIND ||
    (catalogId !== null && root["catalog"] !== catalogId)
  ) {
    return {
      state: {
        ...EMPTY_INDEX,
        ...base,
        state: "mismatch",
        servedBy: fetched.host,
      },
      files: new Map(),
    };
  }
  const { files, catalogMismatches, cidMismatches } = crossCheck(
    entries,
    catalogFiles(catalog)
  );
  return {
    state: {
      ...base,
      state: "verified",
      servedBy: fetched.host,
      fileCount: entries.length,
      catalogMatches: files.size,
      catalogMismatches,
      cidMismatches,
    },
    files,
  };
}

function derivativesOf(
  presentation: Record<string, unknown>,
  files: ReadonlyMap<string, OnchainIndexedFile>
): OnchainImageDerivative[] {
  const list = presentation["derivatives"];
  if (!Array.isArray(list)) return [];
  const derivatives: OnchainImageDerivative[] = [];
  for (const derivative of list) {
    if (!isRecord(derivative) || derivative["mime_type"] !== "image/webp")
      continue;
    const path = text(derivative["repository_path"]);
    const file = path === null ? undefined : files.get(path);
    const width = positiveInteger(derivative["width"]);
    const height = positiveInteger(derivative["height"]);
    // The manifest's own hash must name the same bytes the catalog and the
    // index do; otherwise the derivative is left out.
    if (
      file === undefined ||
      width === null ||
      height === null ||
      bareSha256(derivative["sha256"]) !== file.sha256
    ) {
      continue;
    }
    derivatives.push({
      width,
      height,
      cid: file.cid,
      sha256: file.sha256,
      byteSize: file.bytes,
    });
  }
  return derivatives.sort((left, right) => left.width - right.width);
}

function rightsOf(root: Record<string, unknown>): {
  status: string | null;
  terms: string[];
} {
  const rights = root["rights_boundary"];
  if (!isRecord(rights)) return { status: null, terms: [] };
  const reuse = text(rights["no_general_reuse"]);
  const terms = reuse === null ? [] : [reuse];
  return { status: text(rights["status"]), terms };
}

function imagesOf(
  path: string,
  root: unknown,
  files: ReadonlyMap<string, OnchainIndexedFile>
): OnchainWorkImage[] {
  if (!isRecord(root) || !Array.isArray(root["items"])) return [];
  const delivery = root["delivery"];
  const status = isRecord(delivery) ? delivery["status"] : null;
  if (
    status !== "approved_for_contextual_museum_display" &&
    status !== "approved_by_reviewed_display_authority"
  ) {
    return [];
  }
  const rights = rightsOf(root);
  const images: OnchainWorkImage[] = [];
  for (const item of root["items"]) {
    if (!isRecord(item) || !isRecord(item["presentation"])) continue;
    const key = text(item["work_entity_id"]) ?? text(item["record_id"]);
    const altText = text(item["presentation"]["alt_text"]);
    const derivatives = derivativesOf(item["presentation"], files);
    if (key === null || altText === null || derivatives.length === 0) continue;
    images.push({
      key,
      mediaEntityId: text(item["media_reference_entity_id"]),
      altText,
      derivatives,
      rightsStatus: rights.status,
      rightsTerms: rights.terms,
      manifestPath: path,
    });
  }
  return images;
}

async function loadManifest(
  file: OnchainIndexedFile,
  fetchCid: CidFetcher
): Promise<
  { state: "verified"; root: unknown } | { state: "mismatch" | "unavailable" }
> {
  const cid = cidFromText(file.cid);
  const fetched =
    cid === null
      ? null
      : await fetchCid(cid, (bytes) => sha256(bytes).slice(2) === file.sha256);
  if (fetched === null) return { state: "unavailable" };
  if (!fetched.accepted) return { state: "mismatch" };
  return { state: "verified", root: parseJson(fetched.bytes) };
}

/**
 * Builds the verified media layer: the file index from the latest release
 * that names one, then every presentation manifest it lists, fetched by CID
 * and checked by SHA-256. Images themselves are checked in the browser,
 * against the SHA-256 values this returns.
 */
export async function loadOnchainMedia(
  releases: readonly RegistryRelease[],
  catalog: unknown,
  catalogId: string | null,
  fetchCid: CidFetcher
): Promise<OnchainMediaState> {
  const index = await loadFileIndex(releases, catalog, catalogId, fetchCid);
  const manifests: OnchainManifestState[] = [];
  const images: Record<string, OnchainWorkImage> = {};
  for (const file of index.files.values()) {
    if (!PRESENTATION_MANIFEST.test(file.path)) continue;
    const loaded = await loadManifest(file, fetchCid);
    if (loaded.state !== "verified") {
      manifests.push({ path: file.path, state: loaded.state, items: 0 });
      continue;
    }
    const found = imagesOf(file.path, loaded.root, index.files);
    manifests.push({ path: file.path, state: "verified", items: found.length });
    for (const image of found) images[image.key] ??= image;
  }
  return { index: index.state, manifests, images };
}
