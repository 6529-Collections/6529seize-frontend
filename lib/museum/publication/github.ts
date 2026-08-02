import {
  parseMuseumPublicationManifest,
  verifyMuseumSha256,
  type MuseumPublicationManifestEntry,
} from "./manifest";
import {
  assertApprovedGitHubUrl,
  assertGovernedMuseumPath,
  buildGitHubCommitResolutionUrl,
  buildImmutableMuseumRawUrl,
  isExactGitCommit,
  MUSEUM_MANIFEST_PATH,
  MUSEUM_REPOSITORY_NAME,
} from "./security";
import type {
  MuseumLastValidPublication,
  MuseumPublication,
  MuseumPublicationAssembler,
  MuseumPublicationLoadState,
  MuseumPublicationSource,
  MuseumSourceDocument,
} from "./types";

const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;
const MAX_COMMIT_RESPONSE_BYTES = 256_000;
const MAX_MANIFEST_BYTES = 2_000_000;
const MAX_DOCUMENT_BYTES = 4_500_000;

export interface GitHubMuseumPublicationSourceOptions {
  readonly ref: string;
  readonly assembler: MuseumPublicationAssembler;
  readonly fetch?: typeof fetch;
  readonly now?: () => Date;
  readonly requestTimeoutMs?: number;
}

function sourceErrorCode(error: unknown): string {
  if (!(error instanceof Error) || error.message.length === 0) {
    return "publication_source_error";
  }
  return error.message.slice(0, 96);
}

function mediaTypeForPath(path: string): MuseumSourceDocument["mediaType"] {
  return path.endsWith(".json") ? "application/json" : "text/markdown";
}

export class GitHubMuseumPublicationSource implements MuseumPublicationSource {
  private readonly ref: string;
  private readonly assembler: MuseumPublicationAssembler;
  private readonly fetchImplementation: typeof fetch;
  private readonly now: () => Date;
  private readonly requestTimeoutMs: number;

  constructor(options: GitHubMuseumPublicationSourceOptions) {
    this.ref = options.ref;
    this.assembler = options.assembler;
    this.fetchImplementation = options.fetch ?? fetch;
    this.now = options.now ?? (() => new Date());
    this.requestTimeoutMs =
      options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

    if (
      !Number.isSafeInteger(this.requestTimeoutMs) ||
      this.requestTimeoutMs <= 0
    ) {
      throw new Error("publication_invalid_timeout");
    }

    const uniqueRequiredPaths = new Set(this.assembler.requiredPaths);
    if (
      this.assembler.requiredPaths.length === 0 ||
      uniqueRequiredPaths.size !== this.assembler.requiredPaths.length
    ) {
      throw new Error("publication_required_paths_invalid");
    }
    for (const path of this.assembler.requiredPaths) {
      assertGovernedMuseumPath(path);
    }

    buildGitHubCommitResolutionUrl(this.ref);
  }

  async load(
    lastValid?: MuseumLastValidPublication
  ): Promise<MuseumPublicationLoadState> {
    try {
      const publication = await this.assembleCandidate();
      return {
        status: "current",
        publication,
        errorCode: null,
        failedAt: null,
        lastValidAcceptedAt: null,
      };
    } catch (error) {
      const failedAt = this.now().toISOString();
      const errorCode = sourceErrorCode(error);
      if (lastValid !== undefined) {
        return {
          status: "stale",
          publication: lastValid.publication,
          errorCode,
          failedAt,
          lastValidAcceptedAt: lastValid.acceptedAt,
        };
      }
      return {
        status: "unavailable",
        publication: null,
        errorCode,
        failedAt,
        lastValidAcceptedAt: null,
      };
    }
  }

  private async assembleCandidate(): Promise<MuseumPublication> {
    const commit = await this.resolveExactCommit();
    const manifest = await this.fetchManifest(commit);
    const inventory = new Map(
      manifest.entries.map((entry) => [entry.path, entry] as const)
    );

    const requiredEntries = this.assembler.requiredPaths.map((path) => {
      assertGovernedMuseumPath(path);
      const entry = inventory.get(path);
      if (entry === undefined) {
        throw new Error("publication_required_path_undeclared");
      }
      if (entry.size > MAX_DOCUMENT_BYTES) {
        throw new Error("publication_document_too_large");
      }
      return entry;
    });

    const documents = await Promise.all(
      requiredEntries.map((entry) => this.fetchDocument(commit, entry))
    );
    const assembledAt = this.now().toISOString();
    return this.assembler.assemble({
      identity: {
        repository: MUSEUM_REPOSITORY_NAME,
        requestedRef: this.ref,
        commit,
        manifestPath: MUSEUM_MANIFEST_PATH,
        manifestSha256: manifest.manifestSha256,
        manifestCommitment: manifest.manifestCommitment,
        inventoryCount: manifest.entries.length,
        assembledAt,
      },
      documents: new Map(
        documents.map((document) => [document.path, document] as const)
      ),
    });
  }

  private async resolveExactCommit(): Promise<string> {
    const url = buildGitHubCommitResolutionUrl(this.ref);
    const text = await this.fetchUtf8(
      url,
      MAX_COMMIT_RESPONSE_BYTES,
      "application/vnd.github+json"
    );
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      throw new Error("publication_commit_response_invalid");
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed) ||
      !("sha" in parsed) ||
      typeof parsed.sha !== "string" ||
      !isExactGitCommit(parsed.sha)
    ) {
      throw new Error("publication_commit_not_exact");
    }
    return parsed.sha;
  }

  private async fetchManifest(commit: string) {
    const url = buildImmutableMuseumRawUrl(commit, MUSEUM_MANIFEST_PATH);
    const text = await this.fetchUtf8(
      url,
      MAX_MANIFEST_BYTES,
      "application/json"
    );
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      throw new Error("publication_manifest_json_invalid");
    }
    return parseMuseumPublicationManifest(parsed);
  }

  private async fetchDocument(
    commit: string,
    entry: MuseumPublicationManifestEntry
  ): Promise<MuseumSourceDocument> {
    const url = buildImmutableMuseumRawUrl(commit, entry.path);
    const bytes = await this.fetchBytes(
      url,
      MAX_DOCUMENT_BYTES,
      "application/json, text/markdown, text/plain"
    );
    if (bytes.byteLength !== entry.size) {
      throw new Error("publication_document_size_mismatch");
    }
    if (entry.sha256 !== null && !verifyMuseumSha256(bytes, entry.sha256)) {
      throw new Error("publication_document_hash_mismatch");
    }

    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new Error("publication_document_utf8_invalid");
    }
    return {
      path: entry.path,
      sha256: entry.sha256,
      mediaType: mediaTypeForPath(entry.path),
      text,
    };
  }

  private async fetchUtf8(
    url: string,
    maxBytes: number,
    accept: string
  ): Promise<string> {
    const bytes = await this.fetchBytes(url, maxBytes, accept);
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new Error("publication_source_utf8_invalid");
    }
  }

  private async fetchBytes(
    url: string,
    maxBytes: number,
    accept: string
  ): Promise<Uint8Array> {
    assertApprovedGitHubUrl(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      const response = await this.fetchImplementation(url, {
        headers: { Accept: accept },
        redirect: "error",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`publication_github_http_${response.status}`);
      }
      if (response.url.length > 0 && response.url !== url) {
        throw new Error("publication_unexpected_response_url");
      }

      const contentLength = response.headers.get("content-length");
      if (
        contentLength !== null &&
        (!/^\d+$/u.test(contentLength) || Number(contentLength) > maxBytes)
      ) {
        throw new Error("publication_response_too_large");
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > maxBytes) {
        throw new Error("publication_response_too_large");
      }
      return bytes;
    } finally {
      clearTimeout(timeout);
    }
  }
}
