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
  MuseumPublicationAssemblyContext,
  MuseumPublicationAssembler,
  MuseumPublicationLoadState,
  MuseumPublicationSource,
  MuseumSourceDocument,
} from "./types";
import {
  applyMuseumPublicEntityGraph,
  MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
  parseMuseumPublicEntityGraph,
} from "./publicEntityGraph";
import {
  assertMuseumCatalogDocumentBytes,
  assertMuseumPublicationCatalogAssemblyBundle,
  assertMuseumPublicationInventoryManifestBinding,
  MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES,
  resolveMuseumPublicationCatalog,
  type MuseumPublicationCatalog,
  type MuseumPublicationCatalogDocument,
  type MuseumPublicationCatalogResolver,
} from "./catalog";
import { getNodeEnv } from "../../../config/env";
import {
  getMuseumPublicationEnvironment,
  isMuseumProductionBuildPhase,
} from "../../../config/museumPublicationEnv.server";

const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;
const MAX_COMMIT_RESPONSE_BYTES = 256_000;
const MAX_MANIFEST_BYTES = 2_000_000;
const MAX_DOCUMENT_BYTES = 4_500_000;
const MAX_REQUIRED_DOCUMENT_BYTES = 16_000_000;
const MAX_DOCUMENT_FETCH_CONCURRENCY = 8;

interface GitHubMuseumPublicationSourceOptions {
  readonly ref: string;
  readonly assembler: MuseumPublicationAssembler;
  readonly fetch?: typeof fetch;
  readonly now?: () => Date;
  readonly requestTimeoutMs?: number;
  /** Required for typed graph activation outside the test-only fixture path. */
  readonly catalogResolver?: MuseumPublicationCatalogResolver;
  /** Explicit read-only fixture escape hatch; rejected outside test lanes. */
  readonly allowUncataloguedTestFixture?: boolean;
  /** Read-only local review-fixture qualification; never used by production. */
  readonly localFixtureDocumentTransform?: (
    document: MuseumSourceDocument
  ) => MuseumSourceDocument;
  /** Visitor-corpus path boundary for a local review fixture only. */
  readonly localFixtureAcceptedPaths?: readonly string[];
}

function sourceErrorCode(error: unknown): string {
  if (!(error instanceof Error) || error.message.length === 0) {
    return "publication_source_error";
  }
  return error.message.slice(0, 96);
}

function mediaTypeForPath(path: string): MuseumSourceDocument["mediaType"] {
  if (path.endsWith(".json")) return "application/json";
  return path.endsWith(".txt") ? "text/plain" : "text/markdown";
}

export class GitHubMuseumPublicationSource implements MuseumPublicationSource {
  private readonly ref: string;
  private readonly assembler: MuseumPublicationAssembler;
  private readonly fetchImplementation: typeof fetch;
  private readonly now: () => Date;
  private readonly requestTimeoutMs: number;
  private readonly catalogResolver:
    | MuseumPublicationCatalogResolver
    | undefined;
  private readonly allowUncataloguedTestFixture: boolean;
  private readonly localFixtureDocumentTransform:
    | ((document: MuseumSourceDocument) => MuseumSourceDocument)
    | undefined;
  private readonly localFixtureAcceptedPaths: ReadonlySet<string> | undefined;
  private readonly catalogCache = new Map<string, MuseumPublicationCatalog>();

  constructor(options: GitHubMuseumPublicationSourceOptions) {
    this.ref = options.ref;
    this.assembler = options.assembler;
    this.fetchImplementation = options.fetch ?? fetch;
    this.now = options.now ?? (() => new Date());
    this.requestTimeoutMs =
      options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    this.catalogResolver = options.catalogResolver;
    this.localFixtureDocumentTransform = options.localFixtureDocumentTransform;
    this.localFixtureAcceptedPaths =
      options.localFixtureAcceptedPaths === undefined
        ? undefined
        : new Set(options.localFixtureAcceptedPaths);
    const isTestEnvironment = getNodeEnv() === "test";
    const environment = getMuseumPublicationEnvironment();
    const uncataloguedReadOnlyTestMode =
      environment.MUSEUM_PUBLICATION_UNCATALOGUED_TEST_MODE === "1" &&
      environment.PLAYWRIGHT_READONLY === "1" &&
      environment.MUSEUM_PUBLICATION_TEST_COMMIT === this.ref &&
      isExactGitCommit(this.ref) &&
      getNodeEnv() !== "production";
    const localFixtureEnvironment =
      isTestEnvironment ||
      uncataloguedReadOnlyTestMode ||
      (environment.MUSEUM_PUBLICATION_LOCAL_FIXTURE_ROOT !== undefined &&
        environment.PLAYWRIGHT_READONLY === "1" &&
        (getNodeEnv() !== "production" || isMuseumProductionBuildPhase()));
    this.allowUncataloguedTestFixture =
      options.allowUncataloguedTestFixture ?? isTestEnvironment;

    if (
      this.allowUncataloguedTestFixture &&
      !isTestEnvironment &&
      !localFixtureEnvironment
    ) {
      throw new Error("publication_uncatalogued_fixture_not_allowed");
    }
    if (
      this.localFixtureDocumentTransform !== undefined &&
      !localFixtureEnvironment
    ) {
      throw new Error("publication_local_fixture_not_allowed");
    }

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
    const movingMainCommit = await this.resolveExactCommit();
    const catalog = await this.resolveCatalog(movingMainCommit);
    const commit = catalog?.sourceCommit ?? movingMainCommit;
    const manifest = await this.fetchManifest(commit, catalog);
    const isAcceptedLocalFixturePath = (path: string): boolean =>
      this.localFixtureAcceptedPaths === undefined ||
      this.localFixtureAcceptedPaths.has(path);
    const ontologyEntries = manifest.entries.filter(
      (entry) =>
        isAcceptedLocalFixturePath(entry.path) &&
        (/^records\/(?:entities|relations)\/[^/]+\.json$/u.test(entry.path) ||
          entry.path === MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH)
    );
    const typedGraphDeclared = ontologyEntries.length > 0;
    if (catalog !== null) {
      const catalogAssemblyPaths = new Set(
        catalog.assemblyDocuments.map((entry) => entry.path)
      );
      const catalogOntologyPaths = catalog.assemblyDocuments
        .map((entry) => entry.path)
        .filter(
          (path) =>
            /^records\/(?:entities|relations)\/[^/]+\.json$/u.test(path) ||
            path === MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH
        );
      if (
        ontologyEntries.some(
          (entry) => !catalogAssemblyPaths.has(entry.path)
        ) ||
        catalogOntologyPaths.some(
          (path) => !manifest.entries.some((entry) => entry.path === path)
        )
      ) {
        throw new Error("publication_catalog_graph_inventory_mismatch");
      }
    }
    if (
      typedGraphDeclared &&
      catalog === null &&
      !this.allowUncataloguedTestFixture
    ) {
      throw new Error("publication_catalog_required");
    }
    const inventory = new Map(
      manifest.entries.map((entry) => [entry.path, entry] as const)
    );
    const requiredEntries = this.assembler.requiredPaths.map((path) => {
      assertGovernedMuseumPath(path);
      const entry = inventory.get(path);
      if (entry === undefined || !isAcceptedLocalFixturePath(path)) {
        throw new Error("publication_required_path_undeclared");
      }
      if (entry.size > MAX_DOCUMENT_BYTES) {
        throw new Error("publication_document_too_large");
      }
      return entry;
    });
    // The explicit uncatalogued read-only fixture uses bounded individual
    // fetches. A verified catalog uses one immutable B bundle for every
    // assembly byte; media assets are membership-checked below and never
    // fetched here.
    const typedSourceEntries = manifest.entries.filter(
      (entry) =>
        isAcceptedLocalFixturePath(entry.path) &&
        /^(?:records|docs|policies)\//u.test(entry.path) &&
        /\.(?:json|md|txt)$/u.test(entry.path)
    );
    const entriesByPath = new Map(
      [...requiredEntries, ...ontologyEntries, ...typedSourceEntries].map(
        (entry) => [entry.path, entry] as const
      )
    );
    const documentsToFetch =
      catalog === null ? [...entriesByPath.values()] : [];
    const catalogAssemblyEntries =
      catalog === null
        ? []
        : catalog.assemblyDocuments.map((catalogEntry) => {
            const entry = inventory.get(catalogEntry.path);
            if (
              entry?.size !== catalogEntry.size ||
              entry.sha256 !== catalogEntry.sha256
            ) {
              throw new Error(
                "publication_catalog_manifest_inventory_mismatch"
              );
            }
            return { catalogEntry, entry };
          });
    if (catalog !== null) {
      const publicationInventoryEntry = inventory.get(
        catalog.publicationInventory.path
      );
      assertMuseumPublicationInventoryManifestBinding(
        publicationInventoryEntry,
        catalog
      );
      for (const mediaAsset of catalog.mediaAssets) {
        const entry = inventory.get(mediaAsset.path);
        if (
          entry?.size !== mediaAsset.size ||
          entry.sha256 !== mediaAsset.sha256
        ) {
          throw new Error("publication_catalog_media_manifest_mismatch");
        }
      }
      const bundleManifestEntry = inventory.get(
        catalog.assemblyBundle.descriptor.path
      );
      if (
        bundleManifestEntry?.size !== catalog.assemblyBundle.descriptor.size ||
        bundleManifestEntry.sha256 !== catalog.assemblyBundle.descriptor.sha256
      ) {
        throw new Error("publication_catalog_bundle_manifest_mismatch");
      }
    }
    const requiredDocumentBytes = requiredEntries.reduce(
      (total, entry) => total + entry.size,
      0
    );
    if (
      !Number.isSafeInteger(requiredDocumentBytes) ||
      requiredDocumentBytes > MAX_REQUIRED_DOCUMENT_BYTES
    ) {
      throw new Error("publication_required_documents_too_large");
    }

    const ontologyDocumentBytes =
      catalog === null
        ? documentsToFetch.reduce((total, entry) => total + entry.size, 0)
        : catalogAssemblyEntries.reduce(
            (total, { entry }) => total + entry.size,
            0
          );
    if (
      !Number.isSafeInteger(ontologyDocumentBytes) ||
      ontologyDocumentBytes > MAX_REQUIRED_DOCUMENT_BYTES
    ) {
      throw new Error("publication_ontology_documents_too_large");
    }

    let documents: MuseumSourceDocument[];
    if (catalog === null) {
      documents = new Array<MuseumSourceDocument>(documentsToFetch.length);
      let nextDocumentIndex = 0;
      const fetchNextDocument = async (): Promise<void> => {
        while (nextDocumentIndex < documentsToFetch.length) {
          const index = nextDocumentIndex;
          nextDocumentIndex += 1;
          const entry = documentsToFetch[index];
          if (entry === undefined) {
            throw new Error("publication_required_document_missing");
          }
          const document = await this.fetchDocument(commit, entry, undefined);
          documents[index] =
            this.localFixtureDocumentTransform?.(document) ?? document;
        }
      };
      await Promise.all(
        Array.from(
          {
            length: Math.min(
              MAX_DOCUMENT_FETCH_CONCURRENCY,
              documentsToFetch.length
            ),
          },
          fetchNextDocument
        )
      );
    } else {
      if (this.catalogResolver === undefined) {
        throw new Error("publication_catalog_decoder_missing");
      }
      const bundleBytes = await this.fetchBytes(
        catalog.assemblyBundle.descriptor.rawUrl,
        MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES,
        "application/octet-stream, application/json"
      );
      const normalizedBundleBytes = assertMuseumCatalogDocumentBytes(
        catalog.assemblyBundle.descriptor,
        bundleBytes,
        catalog.assemblyBundle.descriptor.jcsKeccak === undefined
          ? undefined
          : (normalizedBytes) =>
              this.catalogResolver?.verifyDocumentCommitment(
                catalog.assemblyBundle.descriptor,
                normalizedBytes
              )
      );
      const decodedBundle = this.catalogResolver.decodeAssemblyBundle(
        normalizedBundleBytes,
        catalog
      );
      const bundleBytesByPath = assertMuseumPublicationCatalogAssemblyBundle(
        decodedBundle,
        catalog,
        (entry, embeddedBytes) =>
          this.catalogResolver?.verifyDocumentCommitment(entry, embeddedBytes)
      );
      documents = catalogAssemblyEntries.map(({ catalogEntry, entry }) => {
        const bytes = bundleBytesByPath.get(catalogEntry.path);
        if (bytes === undefined) {
          throw new Error("publication_catalog_bundle_document_missing");
        }
        return this.documentFromCatalogBytes(entry, catalogEntry, bytes);
      });
    }
    const assembledAt = this.now().toISOString();
    const context: MuseumPublicationAssemblyContext = {
      identity: {
        repository: MUSEUM_REPOSITORY_NAME,
        requestedRef: this.ref,
        commit,
        manifestPath: catalog?.manifest.path ?? MUSEUM_MANIFEST_PATH,
        manifestSha256: manifest.manifestSha256,
        manifestCommitment: manifest.manifestCommitment,
        inventoryCount: manifest.entries.length,
        assembledAt,
        ...(catalog === null
          ? {}
          : {
              catalogId: catalog.id,
              catalogContentHash: catalog.contentHash.digest,
            }),
      },
      declaredSourcePaths:
        catalog?.assemblyDocuments.map((entry) => entry.path) ??
        (this.localFixtureAcceptedPaths === undefined
          ? manifest.entries.map((entry) => entry.path)
          : [...entriesByPath.keys()]),
      documents: new Map(
        documents.map((document) => [document.path, document] as const)
      ),
    };
    const publication = this.assembler.assemble(context);
    const graph = parseMuseumPublicEntityGraph(
      context.documents,
      context.declaredSourcePaths,
      commit
    );
    return graph === null
      ? publication
      : applyMuseumPublicEntityGraph(publication, graph, context.documents);
  }

  private async resolveCatalog(
    movingMainCommit: string
  ): Promise<MuseumPublicationCatalog | null> {
    if (this.catalogResolver === undefined) return null;
    const result = await resolveMuseumPublicationCatalog({
      resolvedMainCommit: movingMainCommit,
      resolver: this.catalogResolver,
      requiredPaths: this.assembler.requiredPaths,
      fetchBytes: (url, maxBytes, accept) =>
        this.fetchBytes(url, maxBytes, accept),
    });
    const cacheKey = `${result.catalog.id}:${result.catalog.contentHash.digest}`;
    const cached = this.catalogCache.get(cacheKey);
    if (cached !== undefined) return cached;
    this.catalogCache.set(cacheKey, result.catalog);
    return result.catalog;
  }

  private async resolveExactCommit(): Promise<string> {
    if (isExactGitCommit(this.ref)) {
      return this.ref;
    }

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
      !("object" in parsed) ||
      typeof parsed.object !== "object" ||
      parsed.object === null ||
      Array.isArray(parsed.object) ||
      !("sha" in parsed.object) ||
      typeof parsed.object.sha !== "string" ||
      !isExactGitCommit(parsed.object.sha)
    ) {
      throw new Error("publication_commit_not_exact");
    }
    return parsed.object.sha;
  }

  private async fetchManifest(
    commit: string,
    catalog: MuseumPublicationCatalog | null
  ) {
    const manifestPath = catalog?.manifest.path ?? MUSEUM_MANIFEST_PATH;
    const url =
      catalog?.manifest.rawUrl ??
      buildImmutableMuseumRawUrl(commit, manifestPath);
    const bytes = await this.fetchBytes(
      url,
      MAX_MANIFEST_BYTES,
      "application/json"
    );
    if (catalog !== null) {
      if (
        bytes.byteLength !== catalog.manifest.fileSize ||
        !verifyMuseumSha256(bytes, catalog.manifest.fileSha256)
      ) {
        throw new Error("publication_catalog_manifest_fixity_mismatch");
      }
      if (
        (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) ||
        bytes.includes(0x0d)
      ) {
        throw new Error("publication_catalog_manifest_normalization");
      }
    }
    const text = this.decodeMuseumText(bytes, manifestPath, undefined);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      throw new Error("publication_manifest_json_invalid");
    }
    const manifest = parseMuseumPublicationManifest(parsed);
    if (
      catalog !== null &&
      (manifest.manifestSha256 !== catalog.manifest.sha256 ||
        manifest.manifestCommitment !== catalog.manifest.jcsKeccak)
    ) {
      throw new Error("publication_catalog_manifest_hash_mismatch");
    }
    return manifest;
  }

  private async fetchDocument(
    commit: string,
    entry: MuseumPublicationManifestEntry,
    catalogEntry: MuseumPublicationCatalogDocument | undefined
  ): Promise<MuseumSourceDocument> {
    if (catalogEntry !== undefined && catalogEntry.path !== entry.path) {
      throw new Error("publication_catalog_document_path_mismatch");
    }
    const url =
      catalogEntry?.rawUrl ?? buildImmutableMuseumRawUrl(commit, entry.path);
    const bytes = await this.fetchBytes(
      url,
      MAX_DOCUMENT_BYTES,
      "application/json, text/markdown, text/plain"
    );
    if (catalogEntry !== undefined) {
      return this.documentFromCatalogBytes(entry, catalogEntry, bytes);
    }
    if (bytes.byteLength !== entry.size) {
      throw new Error("publication_document_size_mismatch");
    }
    if (entry.sha256 !== null && !verifyMuseumSha256(bytes, entry.sha256)) {
      throw new Error("publication_document_hash_mismatch");
    }

    const text = this.decodeMuseumText(bytes, entry.path, catalogEntry);
    return {
      path: entry.path,
      sha256: entry.sha256,
      mediaType: mediaTypeForPath(entry.path),
      text,
    };
  }

  private documentFromCatalogBytes(
    entry: MuseumPublicationManifestEntry,
    catalogEntry: MuseumPublicationCatalogDocument,
    bytes: Uint8Array
  ): MuseumSourceDocument {
    if (catalogEntry.path !== entry.path) {
      throw new Error("publication_catalog_document_path_mismatch");
    }
    const normalized = assertMuseumCatalogDocumentBytes(
      catalogEntry,
      bytes,
      catalogEntry.jcsKeccak === undefined
        ? undefined
        : (normalizedBytes) =>
            this.catalogResolver?.verifyDocumentCommitment(
              catalogEntry,
              normalizedBytes
            )
    );
    if (
      normalized.byteLength !== entry.size ||
      entry.sha256 === null ||
      entry.sha256 !== catalogEntry.sha256 ||
      !verifyMuseumSha256(normalized, entry.sha256)
    ) {
      throw new Error("publication_catalog_manifest_inventory_mismatch");
    }
    const text = this.decodeMuseumText(normalized, entry.path, catalogEntry);
    return {
      path: entry.path,
      sha256: entry.sha256,
      mediaType: mediaTypeForPath(entry.path),
      text,
    };
  }

  private decodeMuseumText(
    bytes: Uint8Array,
    path: string,
    catalogEntry: MuseumPublicationCatalogDocument | undefined
  ): string {
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (catalogEntry === undefined || catalogEntry.byteMode === "raw") {
        return text;
      }
      if (text.startsWith("\uFEFF") || text.includes("\r")) {
        throw new Error("publication_document_text_mode");
      }
      return text;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "publication_document_text_mode"
      ) {
        throw error;
      }
      throw new Error(
        catalogEntry === undefined
          ? "publication_document_utf8_invalid"
          : `publication_catalog_document_utf8_invalid:${path}`
      );
    }
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
