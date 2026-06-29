import LruTtlCache from "@/lib/cache/lruTtl";
import type { TweetPreview } from "@/lib/twitter";
import { parseTweetUrl } from "@/lib/twitter/url";

interface TwitterPreviewErrorBody {
  readonly error: string;
}

interface TwitterPreviewBatchResponse {
  readonly results?: Record<string, TweetPreview | undefined>;
  readonly errors?: Record<string, string | undefined>;
}

const TWITTER_PREVIEW_TIMEOUT_MS = 10_000;
const TWITTER_PREVIEW_CACHE_TTL_MS = 10 * 60 * 1000;
const TWITTER_PREVIEW_CACHE_MAX_ITEMS = 200;
const TWITTER_PREVIEW_BATCH_MAX_URLS = 5;
const TWITTER_PREVIEW_BATCH_MAX_ACTIVE_CHUNKS = 2;
const TWITTER_PREVIEW_METADATA_ERROR_MESSAGE =
  "Failed to fetch Twitter/X preview metadata.";
const TWITTER_PREVIEW_METADATA_TIMEOUT_ERROR_MESSAGE = `${TWITTER_PREVIEW_METADATA_ERROR_MESSAGE} Request timed out.`;

type PendingTwitterPreviewRequest = {
  readonly url: string;
  readonly cacheKey: string;
  readonly promise: Promise<TweetPreview>;
  readonly resolve: (value: TweetPreview) => void;
  readonly reject: (reason: Error) => void;
};

const twitterPreviewCache = new LruTtlCache<string, Promise<TweetPreview>>({
  max: TWITTER_PREVIEW_CACHE_MAX_ITEMS,
  ttlMs: TWITTER_PREVIEW_CACHE_TTL_MS,
});

const pendingTwitterPreviewBatch = new Map<
  string,
  PendingTwitterPreviewRequest
>();
const queuedTwitterPreviewBatchChunks: PendingTwitterPreviewRequest[][] = [];
let batchFlushTimer: ReturnType<typeof setTimeout> | undefined;
let activeTwitterPreviewBatchChunks = 0;

const normalizeUrl = (url: string): string => url.trim();

const buildCacheKey = (url: string): string =>
  parseTweetUrl(url)?.tweetId ?? url;

const hasOwnRecordKey = <T>(
  record: Record<string, T | undefined> | undefined,
  key: string
): record is Record<string, T | undefined> =>
  record !== undefined && Object.hasOwn(record, key);

const hasErrorMessage = (value: unknown): value is TwitterPreviewErrorBody => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return typeof (value as Record<string, unknown>)["error"] === "string";
};

const isAbortError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { readonly name?: unknown }).name === "AbortError";

const readTwitterPreviewError = async (
  response: Response,
  fallbackMessage: string
): Promise<Error> => {
  try {
    const body: unknown = await response.json();
    if (hasErrorMessage(body)) {
      return new Error(body.error);
    }
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw error;
    }
  }

  return new Error(fallbackMessage);
};

const fetchTwitterPreviewMetadata = async <T>(
  input: RequestInfo | URL,
  init: RequestInit
): Promise<T> => {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = globalThis.setTimeout(() => {
      controller.abort();
      reject(new Error(TWITTER_PREVIEW_METADATA_TIMEOUT_ERROR_MESSAGE));
    }, TWITTER_PREVIEW_TIMEOUT_MS);
  });

  const fetchAndReadJson = async (): Promise<T> => {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await readTwitterPreviewError(
        response,
        TWITTER_PREVIEW_METADATA_ERROR_MESSAGE
      );
    }

    return (await response.json()) as T;
  };

  try {
    return await Promise.race([fetchAndReadJson(), timeoutPromise]);
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw new Error(TWITTER_PREVIEW_METADATA_TIMEOUT_ERROR_MESSAGE);
    }

    throw error;
  } finally {
    if (timeout !== undefined) {
      globalThis.clearTimeout(timeout);
    }
  }
};

const fetchSingleTwitterPreview = async (
  normalizedUrl: string
): Promise<TweetPreview> => {
  const params = new URLSearchParams({ url: normalizedUrl });

  return fetchTwitterPreviewMetadata<TweetPreview>(
    `/api/twitter/preview?${params.toString()}`,
    {
      headers: { Accept: "application/json" },
    }
  );
};

const fetchTwitterPreviewBatch = async (
  urls: readonly string[]
): Promise<TwitterPreviewBatchResponse> =>
  fetchTwitterPreviewMetadata<TwitterPreviewBatchResponse>(
    "/api/twitter/preview",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls }),
    }
  );

const chunkRequests = (
  requests: readonly PendingTwitterPreviewRequest[]
): readonly PendingTwitterPreviewRequest[][] => {
  const chunks: PendingTwitterPreviewRequest[][] = [];

  for (
    let index = 0;
    index < requests.length;
    index += TWITTER_PREVIEW_BATCH_MAX_URLS
  ) {
    chunks.push(requests.slice(index, index + TWITTER_PREVIEW_BATCH_MAX_URLS));
  }

  return chunks;
};

const rejectPendingRequest = (
  request: PendingTwitterPreviewRequest,
  error: Error
): void => {
  twitterPreviewCache.delete(request.cacheKey);
  request.reject(error);
};

const resolveWithSingleRequestFallback = async (
  request: PendingTwitterPreviewRequest
): Promise<void> => {
  try {
    const data = await fetchSingleTwitterPreview(request.url);
    request.resolve(data);
  } catch (error: unknown) {
    rejectPendingRequest(
      request,
      error instanceof Error
        ? error
        : new Error(TWITTER_PREVIEW_METADATA_ERROR_MESSAGE)
    );
  }
};

const rejectBatchChunk = (
  requests: readonly PendingTwitterPreviewRequest[],
  error: unknown
): void => {
  const rejection =
    error instanceof Error
      ? error
      : new Error(TWITTER_PREVIEW_METADATA_ERROR_MESSAGE);

  for (const request of requests) {
    rejectPendingRequest(request, rejection);
  }
};

const resolveBatchChunk = async (
  requests: readonly PendingTwitterPreviewRequest[]
): Promise<void> => {
  let batchResponse: TwitterPreviewBatchResponse;

  try {
    batchResponse = await fetchTwitterPreviewBatch(
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
          : TWITTER_PREVIEW_METADATA_ERROR_MESSAGE
      )
    );
  }
};

const resolveBatchChunkSafely = async (
  requests: readonly PendingTwitterPreviewRequest[]
): Promise<void> => {
  try {
    await resolveBatchChunk(requests);
  } catch (error: unknown) {
    rejectBatchChunk(requests, error);
  }
};

const processQueuedBatchChunks = (): void => {
  while (
    activeTwitterPreviewBatchChunks <
      TWITTER_PREVIEW_BATCH_MAX_ACTIVE_CHUNKS &&
    queuedTwitterPreviewBatchChunks.length > 0
  ) {
    const chunk = queuedTwitterPreviewBatchChunks.shift();
    if (chunk === undefined) {
      return;
    }

    activeTwitterPreviewBatchChunks += 1;

    const handleChunkCompletion = (): void => {
      activeTwitterPreviewBatchChunks -= 1;
      processQueuedBatchChunks();
    };

    void resolveBatchChunkSafely(chunk).finally(handleChunkCompletion);
  }
};

const enqueueBatchChunk = (
  requests: readonly PendingTwitterPreviewRequest[]
): void => {
  queuedTwitterPreviewBatchChunks.push([...requests]);
  processQueuedBatchChunks();
};

const flushPendingTwitterPreviewBatch = (): void => {
  batchFlushTimer = undefined;
  const requests = Array.from(pendingTwitterPreviewBatch.values());
  pendingTwitterPreviewBatch.clear();

  for (const chunk of chunkRequests(requests)) {
    enqueueBatchChunk(chunk);
  }
};

const scheduleBatchFlush = (): void => {
  if (batchFlushTimer !== undefined) {
    return;
  }

  batchFlushTimer = globalThis.setTimeout(flushPendingTwitterPreviewBatch, 0);
};

const clearTwitterPreviewCacheOnError = async (
  rawPromise: Promise<TweetPreview>,
  cacheKey: string
): Promise<TweetPreview> => {
  try {
    return await rawPromise;
  } catch (error: unknown) {
    twitterPreviewCache.delete(cacheKey);
    throw error;
  }
};

const queueTwitterPreviewRequest = (
  normalizedUrl: string,
  cacheKey: string
): Promise<TweetPreview> => {
  const pendingRequest = pendingTwitterPreviewBatch.get(cacheKey);
  if (pendingRequest) {
    return pendingRequest.promise;
  }

  let resolveRequest!: (value: TweetPreview) => void;
  let rejectRequest!: (reason: Error) => void;
  const rawPromise = new Promise<TweetPreview>((resolve, reject) => {
    resolveRequest = resolve;
    rejectRequest = reject;
  });
  const promise = clearTwitterPreviewCacheOnError(rawPromise, cacheKey);

  pendingTwitterPreviewBatch.set(cacheKey, {
    url: normalizedUrl,
    cacheKey,
    promise,
    resolve: resolveRequest,
    reject: rejectRequest,
  });
  twitterPreviewCache.set(cacheKey, promise);
  scheduleBatchFlush();

  return promise;
};

export const fetchTwitterPreview = (url: string): Promise<TweetPreview> => {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    return Promise.reject(new Error("Missing Twitter/X URL."));
  }

  const cacheKey = buildCacheKey(normalizedUrl);
  const cachedResponse = twitterPreviewCache.get(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  return queueTwitterPreviewRequest(normalizedUrl, cacheKey);
};
