import { createHash } from "node:crypto";
import {
  MUSEUM_BRANCH,
  MUSEUM_MANIFEST_URL,
  MUSEUM_REPOSITORY,
  type MuseumCorpus,
  type MuseumDocument,
  type MuseumManifestEntry,
  type MuseumRelease,
} from "./types";

const CACHE_TTL_MS = 10 * 60 * 1000;
const STALE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_MANIFEST_BYTES = 2_000_000;
const MAX_DOCUMENT_BYTES = 2_000_000;
const DOCUMENT_FETCH_CONCURRENCY = 6;
const PUBLIC_PREFIXES = ["policies/", "records/", "docs/"] as const;
const SUPPORTED_EXTENSIONS = [".md", ".json"] as const;

interface MuseumSourceAdapter {
  getRelease(): Promise<MuseumRelease>;
  getDocument(entry: MuseumManifestEntry): Promise<MuseumDocument>;
  getCorpus(): Promise<MuseumCorpus>;
}

interface CachedCorpus {
  readonly storedAt: number;
  readonly corpus: MuseumCorpus;
}

let cachedCorpus: CachedCorpus | undefined;
let inFlightCorpus: Promise<MuseumCorpus> | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compareCanonicalJsonKeys(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }

  return left.localeCompare(right);
}

function canonicalJson(value: unknown): string {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new Error("manifest_canonicalization");
    }
    return Object.is(value, -0) ? "0" : String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort(compareCanonicalJsonKeys)
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }

  throw new Error("manifest_canonicalization");
}

function isSafeRepositoryPath(value: string): boolean {
  return (
    value.length > 0 &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    !value.includes("..") &&
    !value.includes("://") &&
    !value.split("/").some((segment) => segment.length === 0)
  );
}

export function isPublicMuseumPath(value: string): boolean {
  if (!isSafeRepositoryPath(value)) {
    return false;
  }

  return (
    PUBLIC_PREFIXES.some((prefix) => value.startsWith(prefix)) &&
    SUPPORTED_EXTENSIONS.some((extension) => value.endsWith(extension))
  );
}

function asSha256(value: unknown): string | null {
  if (typeof value !== "string" || !/^sha256:[a-f0-9]{64}$/i.test(value)) {
    return null;
  }

  return value.toLowerCase();
}

export function parseMuseumManifest(value: unknown): MuseumRelease {
  if (!isRecord(value)) {
    throw new Error("manifest_shape");
  }

  const entriesValue = value["entries"];
  if (!Array.isArray(entriesValue)) {
    throw new Error("manifest_entries");
  }

  const entries = entriesValue.map((entry): MuseumManifestEntry => {
    if (!isRecord(entry)) {
      throw new Error("manifest_entry_shape");
    }

    const path = entry["path"];
    const sha256 = asSha256(entry["sha256"]);
    const size = entry["size"];

    if (
      typeof path !== "string" ||
      !isSafeRepositoryPath(path) ||
      sha256 === null ||
      typeof size !== "number" ||
      !Number.isSafeInteger(size) ||
      size < 0
    ) {
      throw new Error("manifest_entry_invalid");
    }

    return { path, sha256, size };
  });

  const uniquePaths = new Set(entries.map((entry) => entry.path));
  if (uniquePaths.size !== entries.length) {
    throw new Error("manifest_duplicate_path");
  }

  const manifestSha256 = asSha256(value["manifest_sha256"]);
  const manifestType = value["manifest_type"];
  const manifestVersion = value["manifest_version"];
  const manifestCommitment = value["manifest_commitment"];
  const commitment = isRecord(manifestCommitment)
    ? manifestCommitment["digest"]
    : null;

  if (
    manifestSha256 === null ||
    typeof manifestType !== "string" ||
    typeof manifestVersion !== "string"
  ) {
    throw new Error("manifest_metadata");
  }

  let canonicalBody: string;
  try {
    canonicalBody = canonicalJson(
      Object.fromEntries(
        Object.entries(value).filter(
          ([key]) => key !== "manifest_commitment" && key !== "manifest_sha256"
        )
      )
    );
  } catch {
    throw new Error("manifest_canonicalization");
  }

  if (!verifySha256(canonicalBody, manifestSha256)) {
    throw new Error("manifest_hash_mismatch");
  }

  return {
    manifestType,
    manifestVersion,
    manifestSha256,
    manifestCommitment: typeof commitment === "string" ? commitment : null,
    entries: entries.sort((left, right) => left.path.localeCompare(right.path)),
    observedAt: new Date().toISOString(),
  };
}

export function buildMuseumRawUrl(path: string): string {
  if (!isPublicMuseumPath(path)) {
    throw new Error("unsafe_repository_path");
  }

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${MUSEUM_REPOSITORY}/${MUSEUM_BRANCH}/${encodedPath}`;
}

export function verifySha256(text: string, expected: string): boolean {
  const normalized = asSha256(expected);
  if (normalized === null) {
    return false;
  }

  const digest = createHash("sha256")
    .update(Buffer.from(text, "utf8"))
    .digest("hex");
  return normalized === `sha256:${digest}`;
}

async function fetchUtf8Text(url: string, maxBytes: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json, text/markdown, text/plain" },
      redirect: "error",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`github_http_${response.status}`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength !== null && Number(contentLength) > maxBytes) {
      throw new Error("github_response_too_large");
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > maxBytes) {
      throw new Error("github_response_too_large");
    }

    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } finally {
    clearTimeout(timeout);
  }
}

class GitHubMuseumSourceAdapter implements MuseumSourceAdapter {
  async getRelease(): Promise<MuseumRelease> {
    const manifestText = await fetchUtf8Text(
      MUSEUM_MANIFEST_URL,
      MAX_MANIFEST_BYTES
    );
    let parsed: unknown;

    try {
      parsed = JSON.parse(manifestText) as unknown;
    } catch {
      throw new Error("manifest_json");
    }

    return parseMuseumManifest(parsed);
  }

  async getDocument(entry: MuseumManifestEntry): Promise<MuseumDocument> {
    if (!isPublicMuseumPath(entry.path)) {
      throw new Error("document_not_allowlisted");
    }

    if (entry.size > MAX_DOCUMENT_BYTES) {
      throw new Error("document_too_large");
    }

    const text = await fetchUtf8Text(
      buildMuseumRawUrl(entry.path),
      MAX_DOCUMENT_BYTES
    );
    if (!verifySha256(text, entry.sha256)) {
      throw new Error("document_hash_mismatch");
    }

    return {
      path: entry.path,
      sha256: entry.sha256,
      size: entry.size,
      contentType: entry.path.endsWith(".json") ? "json" : "markdown",
      text,
    };
  }

  async getCorpus(): Promise<MuseumCorpus> {
    const release = await this.getRelease();
    const entries = release.entries.filter((entry) =>
      isPublicMuseumPath(entry.path)
    );
    const documents: MuseumDocument[] = [];
    let failedDocuments = 0;

    for (
      let offset = 0;
      offset < entries.length;
      offset += DOCUMENT_FETCH_CONCURRENCY
    ) {
      const batch = entries.slice(offset, offset + DOCUMENT_FETCH_CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((entry) => this.getDocument(entry))
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          documents.push(result.value);
        } else {
          failedDocuments += 1;
        }
      }
    }

    if (entries.length > 0 && documents.length === 0) {
      throw new Error("document_all_failed");
    }

    return {
      sourceState: failedDocuments > 0 ? "partial" : "fresh",
      release,
      documents: Object.fromEntries(
        documents.map((document) => [document.path, document])
      ),
    };
  }
}

const githubMuseumSourceAdapter: MuseumSourceAdapter =
  new GitHubMuseumSourceAdapter();

function sourceErrorCode(error: unknown): string {
  return error instanceof Error && error.message.length > 0
    ? error.message.slice(0, 80)
    : "source_error";
}

export async function getMuseumCorpus(): Promise<MuseumCorpus> {
  const now = Date.now();
  if (
    cachedCorpus !== undefined &&
    now - cachedCorpus.storedAt <= CACHE_TTL_MS
  ) {
    return cachedCorpus.corpus;
  }

  if (inFlightCorpus !== undefined) {
    return inFlightCorpus;
  }

  const request = (async (): Promise<MuseumCorpus> => {
    try {
      const corpus = await githubMuseumSourceAdapter.getCorpus();
      cachedCorpus = { storedAt: Date.now(), corpus };
      return corpus;
    } catch (error) {
      const errorNow = Date.now();
      if (
        cachedCorpus !== undefined &&
        errorNow - cachedCorpus.storedAt <= STALE_TTL_MS
      ) {
        return {
          ...cachedCorpus.corpus,
          sourceState: "stale",
          errorCode: sourceErrorCode(error),
        };
      }

      const errorCode = sourceErrorCode(error);
      const invalid =
        errorCode.startsWith("manifest_") || errorCode.includes("hash");
      return {
        sourceState: invalid ? "invalid" : "unavailable",
        release: null,
        documents: {},
        errorCode,
      };
    }
  })().finally(() => {
    inFlightCorpus = undefined;
  });
  inFlightCorpus = request;

  return request;
}
