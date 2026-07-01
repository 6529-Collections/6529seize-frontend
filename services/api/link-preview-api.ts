import LruTtlCache from "@/lib/cache/lruTtl";
import type { EnsPreview } from "@/components/waves/ens/types";
import type { ExternalFileKind } from "@/lib/link-preview/fileKinds";
import { getManifoldPreviewImageUrl } from "@/lib/link-preview/manifoldMedia";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";

export interface LinkPreviewMedia {
  readonly url?: string | null | undefined;
  readonly secureUrl?: string | null | undefined;
  readonly type?: string | null | undefined;
  readonly width?: number | null | undefined;
  readonly height?: number | null | undefined;
  readonly alt?: string | null | undefined;
  readonly [key: string]: unknown;
}

interface LinkPreviewBase {
  readonly requestUrl?: string | null | undefined;
  readonly url?: string | null | undefined;
  readonly title?: string | null | undefined;
  readonly description?: string | null | undefined;
  readonly siteName?: string | null | undefined;
  readonly mediaType?: string | null | undefined;
  readonly contentType?: string | null | undefined;
  readonly favicon?: string | null | undefined;
  readonly favicons?: readonly string[] | null | undefined;
  readonly image?: LinkPreviewMedia | null | undefined;
  readonly images?: readonly LinkPreviewMedia[] | null | undefined;
  readonly source?: string | null | undefined;
  readonly author?: string | null | undefined;
  readonly publishedTime?: string | null | undefined;
  readonly modifiedTime?: string | null | undefined;
  readonly section?: string | null | undefined;
  readonly [key: string]: unknown;
}

export type SeizeCollectionPreviewKind =
  | "the-memes"
  | "meme-lab"
  | "6529-gradient"
  | "nextgen-token"
  | "rememes";

export interface SeizeCollectionPreviewPerson {
  readonly label?: string | null | undefined;
  readonly name: string;
  readonly href?: string | null | undefined;
}

export interface SeizeCollectionPreviewFact {
  readonly label: string;
  readonly value: string;
}

export interface SeizeCollectionPreviewTrait {
  readonly label: string;
  readonly value: string;
}

export interface SeizeCollectionLinkPreview extends LinkPreviewBase {
  readonly type: "6529.collection";
  readonly kind: SeizeCollectionPreviewKind;
  readonly title: string;
  readonly kicker?: string | null | undefined;
  readonly people?: readonly SeizeCollectionPreviewPerson[] | null | undefined;
  readonly facts?: readonly SeizeCollectionPreviewFact[] | null | undefined;
  readonly traits?: readonly SeizeCollectionPreviewTrait[] | null | undefined;
}

type GoogleWorkspaceAvailability = "public" | "restricted";

interface GoogleWorkspaceLinksBase {
  readonly open: string;
  readonly preview: string;
}

export interface GoogleDocsLinkPreview extends LinkPreviewBase {
  readonly type: "google.docs";
  readonly fileId: string;
  readonly thumbnail?: string | null | undefined;
  readonly links: GoogleWorkspaceLinksBase & {
    readonly exportPdf?: string | undefined;
  };
  readonly availability: GoogleWorkspaceAvailability;
}

export interface GoogleSheetsLinkPreview extends LinkPreviewBase {
  readonly type: "google.sheets";
  readonly fileId: string;
  readonly gid?: string | null | undefined;
  readonly thumbnail?: string | null | undefined;
  readonly links: GoogleWorkspaceLinksBase & {
    readonly embedPub?: string | undefined;
  };
  readonly availability: GoogleWorkspaceAvailability;
}

export interface GoogleSlidesLinkPreview extends LinkPreviewBase {
  readonly type: "google.slides";
  readonly fileId: string;
  readonly thumbnail?: string | null | undefined;
  readonly links: GoogleWorkspaceLinksBase & {
    readonly exportPdf?: string | undefined;
  };
  readonly availability: GoogleWorkspaceAvailability;
}

export type GoogleWorkspaceLinkPreview =
  | GoogleDocsLinkPreview
  | GoogleSheetsLinkPreview
  | GoogleSlidesLinkPreview;

export interface YoutubeVideoLinkPreview extends LinkPreviewBase {
  readonly type: "youtube.video";
  readonly provider?: string | null | undefined;
  readonly providerUrl?: string | null | undefined;
  readonly videoId: string;
  readonly watchUrl: string;
  readonly embedUrl: string;
  readonly thumbnailUrl?: string | null | undefined;
  readonly thumbnailWidth?: number | null | undefined;
  readonly thumbnailHeight?: number | null | undefined;
  readonly authorName?: string | null | undefined;
  readonly authorUrl?: string | null | undefined;
  readonly playlistId?: string | null | undefined;
  readonly playlistIndex?: string | null | undefined;
  readonly startSeconds?: number | null | undefined;
}

export type FarcasterEmbedKind = "miniapp" | "frame" | "legacy-frame";
export type FarcasterEmbedType = "farcaster.miniapp" | "farcaster.frame";

export interface FarcasterEmbedLinkPreview extends LinkPreviewBase {
  readonly type: FarcasterEmbedType;
  readonly embedKind: FarcasterEmbedKind;
  readonly appName?: string | null | undefined;
  readonly buttonTitle?: string | null | undefined;
  readonly actionType?: string | null | undefined;
  readonly actionUrl?: string | null | undefined;
  readonly imageUrl?: string | null | undefined;
  readonly splashImageUrl?: string | null | undefined;
  readonly splashBackgroundColor?: string | null | undefined;
  readonly buttons?: readonly string[] | null | undefined;
}

interface ManifoldListingDetails {
  readonly listingId: string;
  readonly creatorHandle?: string | null | undefined;
  readonly priceEth?: string | null | undefined;
}

interface ManifoldListingLinkPreview extends LinkPreviewBase {
  readonly type: "manifold.listing";
  readonly manifold: ManifoldListingDetails;
}

interface GenericLinkPreviewResponse extends LinkPreviewBase {
  readonly type?: string | null | undefined;
}

export interface ExternalFileLinkPreviewResponse extends LinkPreviewBase {
  readonly type: "external.file";
  readonly title: string;
  readonly fileName: string;
  readonly extension: string | null;
  readonly fileKind: ExternalFileKind;
  readonly contentType: string | null;
  readonly sizeBytes: number | null;
  readonly sourceHost: string;
  readonly trust: "external_unscanned";
  readonly links: {
    readonly open: string;
  };
}

type EnsLinkPreviewResponse = EnsPreview & LinkPreviewBase;

export type LinkPreviewResponse =
  | GenericLinkPreviewResponse
  | EnsLinkPreviewResponse
  | ManifoldListingLinkPreview
  | ExternalFileLinkPreviewResponse
  | SeizeCollectionLinkPreview
  | GoogleWorkspaceLinkPreview
  | YoutubeVideoLinkPreview
  | FarcasterEmbedLinkPreview;

const LINK_PREVIEW_CACHE_TTL_MS = 5 * 60 * 1000;
const LINK_PREVIEW_CACHE_MAX_ITEMS = 200;
const LINK_PREVIEW_BATCH_MAX_URLS = 5;
const LINK_PREVIEW_BATCH_MAX_ACTIVE_CHUNKS = 2;
const LINK_PREVIEW_FETCH_TIMEOUT_MS = 10_000;
const LINK_PREVIEW_METADATA_ERROR_MESSAGE =
  "Failed to fetch link preview metadata.";
const LINK_PREVIEW_METADATA_TIMEOUT_ERROR_MESSAGE = `${LINK_PREVIEW_METADATA_ERROR_MESSAGE} Request timed out.`;
const OPENSEA_CACHE_KEY_SUFFIX = "|opensea-v3-token-uri-fallback";
const GITHUB_CACHE_KEY_SUFFIX = "|github-preview-state-v1";

const linkPreviewCache = new LruTtlCache<string, Promise<LinkPreviewResponse>>({
  max: LINK_PREVIEW_CACHE_MAX_ITEMS,
  ttlMs: LINK_PREVIEW_CACHE_TTL_MS,
});

const normalizeUrl = (url: string): string => url.trim();

const buildCacheKey = (url: string): string => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (matchesDomainOrSubdomain(hostname, "opensea.io")) {
      return `${url}${OPENSEA_CACHE_KEY_SUFFIX}`;
    }
    if (matchesDomainOrSubdomain(hostname, "github.com")) {
      return `${url}${GITHUB_CACHE_KEY_SUFFIX}`;
    }
  } catch {
    // fall through to default key
  }

  return url;
};

interface OpenGraphErrorBody {
  readonly error: string;
}

interface OpenGraphBatchResponse {
  readonly results?: Record<string, LinkPreviewResponse | undefined>;
  readonly errors?: Record<string, string | undefined>;
}

const hasOwnRecordKey = <T>(
  record: Record<string, T | undefined> | undefined,
  key: string
): record is Record<string, T | undefined> =>
  record !== undefined && Object.hasOwn(record, key);

const normalizeLinkPreviewMedia = (
  media: LinkPreviewMedia | null | undefined
): LinkPreviewMedia | null | undefined => {
  if (media === null || media === undefined) {
    return media;
  }

  const normalizedUrl =
    typeof media.url === "string"
      ? getManifoldPreviewImageUrl(media.url)
      : media.url;
  const normalizedSecureUrl =
    typeof media.secureUrl === "string"
      ? getManifoldPreviewImageUrl(media.secureUrl)
      : media.secureUrl;

  if (normalizedUrl === media.url && normalizedSecureUrl === media.secureUrl) {
    return media;
  }

  return {
    ...media,
    url: normalizedUrl,
    secureUrl: normalizedSecureUrl,
  };
};

const normalizeLinkPreviewResponse = (
  preview: LinkPreviewResponse
): LinkPreviewResponse => {
  const normalizedImage = normalizeLinkPreviewMedia(preview.image);
  const normalizedImages =
    preview.images === null || preview.images === undefined
      ? preview.images
      : preview.images.map(
          (image) => normalizeLinkPreviewMedia(image) ?? image
        );
  const imageChanged = normalizedImage !== preview.image;
  const imagesChanged =
    normalizedImages !== undefined &&
    normalizedImages.some((image, index) => image !== preview.images?.[index]);

  if (!imageChanged && !imagesChanged) {
    return preview;
  }

  return {
    ...preview,
    image: normalizedImage,
    images: normalizedImages,
  };
};

const normalizeOpenGraphBatchResponse = (
  response: OpenGraphBatchResponse
): OpenGraphBatchResponse => {
  if (response.results === undefined) {
    return response;
  }

  let didChange = false;
  const normalizedResults: Record<string, LinkPreviewResponse | undefined> = {};

  for (const [url, preview] of Object.entries(response.results)) {
    const normalizedPreview =
      preview === undefined ? undefined : normalizeLinkPreviewResponse(preview);
    normalizedResults[url] = normalizedPreview;
    if (normalizedPreview !== preview) {
      didChange = true;
    }
  }

  if (!didChange) {
    return response;
  }

  return {
    ...response,
    results: normalizedResults,
  };
};

type PendingLinkPreviewRequest = {
  readonly url: string;
  readonly cacheKey: string;
  readonly promise: Promise<LinkPreviewResponse>;
  readonly resolve: (value: LinkPreviewResponse) => void;
  readonly reject: (reason: Error) => void;
};

const pendingLinkPreviewBatch = new Map<string, PendingLinkPreviewRequest>();
const queuedLinkPreviewBatchChunks: PendingLinkPreviewRequest[][] = [];
let batchFlushTimer: ReturnType<typeof setTimeout> | undefined;
let activeLinkPreviewBatchChunks = 0;

const hasErrorMessage = (value: unknown): value is OpenGraphErrorBody => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const maybeError = (value as Record<string, unknown>)["error"];

  return typeof maybeError === "string" && maybeError.length > 0;
};

const isAbortError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  return (error as { readonly name?: unknown }).name === "AbortError";
};

const readOpenGraphError = async (
  response: Response,
  fallbackMessage: string
): Promise<Error> => {
  let errorMessage = fallbackMessage;
  try {
    const body: unknown = await response.json();
    if (hasErrorMessage(body)) {
      errorMessage = body.error;
    }
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw error;
    }

    // ignore parse errors and use default message
  }

  return new Error(errorMessage);
};

const fetchLinkPreviewMetadata = async <T>(
  input: RequestInfo | URL,
  init: RequestInit
): Promise<T> => {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(LINK_PREVIEW_METADATA_TIMEOUT_ERROR_MESSAGE));
    }, LINK_PREVIEW_FETCH_TIMEOUT_MS);
  });

  const fetchAndReadJson = async (): Promise<T> => {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await readOpenGraphError(
        response,
        LINK_PREVIEW_METADATA_ERROR_MESSAGE
      );
    }

    return (await response.json()) as T;
  };

  try {
    return await Promise.race([fetchAndReadJson(), timeoutPromise]);
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw new Error(LINK_PREVIEW_METADATA_TIMEOUT_ERROR_MESSAGE);
    }

    throw error;
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
};

const fetchSingleLinkPreview = async (
  normalizedUrl: string
): Promise<LinkPreviewResponse> => {
  const params = new URLSearchParams({ url: normalizedUrl });

  const preview = await fetchLinkPreviewMetadata<LinkPreviewResponse>(
    `/api/open-graph?${params.toString()}`,
    {
      headers: { Accept: "application/json" },
    }
  );

  return normalizeLinkPreviewResponse(preview);
};

const fetchLinkPreviewBatch = async (
  urls: readonly string[]
): Promise<OpenGraphBatchResponse> => {
  const response = await fetchLinkPreviewMetadata<OpenGraphBatchResponse>(
    "/api/open-graph",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls }),
    }
  );

  return normalizeOpenGraphBatchResponse(response);
};

const chunkRequests = (
  requests: readonly PendingLinkPreviewRequest[]
): readonly PendingLinkPreviewRequest[][] => {
  const chunks: PendingLinkPreviewRequest[][] = [];

  for (
    let index = 0;
    index < requests.length;
    index += LINK_PREVIEW_BATCH_MAX_URLS
  ) {
    chunks.push(requests.slice(index, index + LINK_PREVIEW_BATCH_MAX_URLS));
  }

  return chunks;
};

const rejectPendingRequest = (
  request: PendingLinkPreviewRequest,
  error: Error
): void => {
  linkPreviewCache.delete(request.cacheKey);
  request.reject(error);
};

const resolveWithSingleRequestFallback = async (
  request: PendingLinkPreviewRequest
): Promise<void> => {
  try {
    const data = await fetchSingleLinkPreview(request.url);
    request.resolve(data);
  } catch (error) {
    rejectPendingRequest(
      request,
      error instanceof Error
        ? error
        : new Error(LINK_PREVIEW_METADATA_ERROR_MESSAGE)
    );
  }
};

const rejectBatchChunk = (
  requests: readonly PendingLinkPreviewRequest[],
  error: unknown
): void => {
  const rejection =
    error instanceof Error
      ? error
      : new Error(LINK_PREVIEW_METADATA_ERROR_MESSAGE);

  for (const request of requests) {
    rejectPendingRequest(request, rejection);
  }
};

const resolveBatchChunk = async (
  requests: readonly PendingLinkPreviewRequest[]
): Promise<void> => {
  let batchResponse: OpenGraphBatchResponse;

  try {
    batchResponse = await fetchLinkPreviewBatch(
      requests.map((request) => request.url)
    );
  } catch {
    await Promise.all(
      requests.map(async (request) => {
        await resolveWithSingleRequestFallback(request);
      })
    );
    return;
  }

  for (const request of requests) {
    const result = hasOwnRecordKey(batchResponse.results, request.url)
      ? batchResponse.results[request.url]
      : undefined;
    if (result !== undefined) {
      request.resolve(result);
      continue;
    }

    const errorMessage = hasOwnRecordKey(batchResponse.errors, request.url)
      ? batchResponse.errors[request.url]
      : undefined;
    rejectPendingRequest(
      request,
      new Error(
        errorMessage && errorMessage.length > 0
          ? errorMessage
          : LINK_PREVIEW_METADATA_ERROR_MESSAGE
      )
    );
  }
};

const resolveBatchChunkSafely = async (
  requests: readonly PendingLinkPreviewRequest[]
): Promise<void> => {
  try {
    await resolveBatchChunk(requests);
  } catch (error: unknown) {
    rejectBatchChunk(requests, error);
  }
};

const processQueuedBatchChunks = (): void => {
  while (
    activeLinkPreviewBatchChunks < LINK_PREVIEW_BATCH_MAX_ACTIVE_CHUNKS &&
    queuedLinkPreviewBatchChunks.length > 0
  ) {
    const chunk = queuedLinkPreviewBatchChunks.shift();
    if (chunk === undefined) {
      return;
    }

    activeLinkPreviewBatchChunks += 1;

    const handleChunkCompletion = (): void => {
      activeLinkPreviewBatchChunks -= 1;
      processQueuedBatchChunks();
    };

    void resolveBatchChunkSafely(chunk).then(
      handleChunkCompletion,
      handleChunkCompletion
    );
  }
};

const enqueueBatchChunk = (
  requests: readonly PendingLinkPreviewRequest[]
): void => {
  queuedLinkPreviewBatchChunks.push([...requests]);
  processQueuedBatchChunks();
};

const flushPendingLinkPreviewBatch = (): void => {
  batchFlushTimer = undefined;
  const requests = Array.from(pendingLinkPreviewBatch.values());
  pendingLinkPreviewBatch.clear();

  for (const chunk of chunkRequests(requests)) {
    enqueueBatchChunk(chunk);
  }
};

const scheduleBatchFlush = (): void => {
  if (batchFlushTimer !== undefined) {
    return;
  }

  batchFlushTimer = setTimeout(flushPendingLinkPreviewBatch, 0);
};

const clearLinkPreviewCacheOnError = async (
  rawPromise: Promise<LinkPreviewResponse>,
  cacheKey: string
): Promise<LinkPreviewResponse> => {
  try {
    return await rawPromise;
  } catch (error: unknown) {
    linkPreviewCache.delete(cacheKey);
    throw error;
  }
};

const queueLinkPreviewRequest = (
  normalizedUrl: string,
  cacheKey: string
): Promise<LinkPreviewResponse> => {
  const pendingRequest = pendingLinkPreviewBatch.get(cacheKey);
  if (pendingRequest) {
    return pendingRequest.promise;
  }

  let resolveRequest!: (value: LinkPreviewResponse) => void;
  let rejectRequest!: (reason: Error) => void;
  const rawPromise = new Promise<LinkPreviewResponse>((resolve, reject) => {
    resolveRequest = resolve;
    rejectRequest = reject;
  });
  const promise = clearLinkPreviewCacheOnError(rawPromise, cacheKey);

  pendingLinkPreviewBatch.set(cacheKey, {
    url: normalizedUrl,
    cacheKey,
    promise,
    resolve: resolveRequest,
    reject: rejectRequest,
  });
  scheduleBatchFlush();

  return promise;
};

export const fetchLinkPreview = (url: string): Promise<LinkPreviewResponse> => {
  const normalizedUrl = normalizeUrl(url);
  const cacheKey = buildCacheKey(normalizedUrl);

  if (!normalizedUrl) {
    return Promise.reject(
      new Error("A valid URL is required to fetch link preview metadata.")
    );
  }

  const cachedResponse = linkPreviewCache.get(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  const requestPromise = queueLinkPreviewRequest(normalizedUrl, cacheKey);

  linkPreviewCache.set(cacheKey, requestPromise);

  return requestPromise;
};
