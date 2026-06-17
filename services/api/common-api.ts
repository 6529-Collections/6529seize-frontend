import { publicEnv } from "@/config/env";
import { recordMobileLaunchApiRequest } from "@/utils/monitoring/mobileLaunchTiming";
import { getAuthJwt, getStagingAuth } from "../auth/auth.utils";

type ApiErrorMode = "legacy-string" | "structured";

type StructuredApiError = Error & {
  status: number;
  headers: Headers;
  response: {
    status: number;
    headers: Headers;
    statusText?: string;
    body?: unknown;
  };
};

const getHeaders = (
  headers?: Record<string, string>,
  contentType: boolean = true
) => {
  const apiAuth = getStagingAuth();
  const walletAuth = getAuthJwt();
  return {
    ...(contentType ? { "Content-Type": "application/json" } : {}),
    ...(apiAuth ? { "x-6529-auth": apiAuth } : {}),
    ...(walletAuth ? { Authorization: `Bearer ${walletAuth}` } : {}),
    ...(headers ?? {}),
  };
};

const buildUrl = (
  endpoint: string,
  params?: Record<string, string>,
  transformParams?: (params: Record<string, string>) => Record<string, string>
): string => {
  let path = `/api/${endpoint}`;
  let url = `${publicEnv.API_ENDPOINT}${path}`;

  if (params) {
    const queryParams = new URLSearchParams();
    const processedParams = transformParams ? transformParams(params) : params;
    Object.entries(processedParams).forEach(([key, value]) => {
      queryParams.set(key, value);
    });
    const queryString = queryParams.toString();
    url += `?${queryString}`;
  }

  return url;
};

const normalizeHeaders = (value: unknown): Headers => {
  if (value instanceof Headers) {
    return value;
  }
  try {
    return new Headers(value as HeadersInit);
  } catch {
    return new Headers();
  }
};

const getUsableErrorMessage = (
  message: string,
  fallbackMessage: string
): string => (message.trim().length > 0 ? message : fallbackMessage);

const getUsableErrorField = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  return value.trim().length > 0 ? value : undefined;
};

const createStructuredApiError = ({
  message,
  status,
  headers,
  statusText,
  body,
}: {
  message: string;
  status: number;
  headers: Headers;
  statusText?: string;
  body?: unknown;
}): StructuredApiError => {
  const error = new Error(message) as StructuredApiError;
  error.name = "ApiError";
  error.status = status;
  error.headers = headers;
  error.response = {
    status,
    headers,
    ...(statusText !== undefined ? { statusText } : {}),
    ...(body !== undefined ? { body } : {}),
  };
  return error;
};

const handleApiError = async (
  res: Response,
  errorMode: ApiErrorMode
): Promise<never> => {
  const fallbackErrorMessage = getUsableErrorMessage(
    res.statusText,
    "Something went wrong"
  );
  let errorMessage = fallbackErrorMessage;
  let errorBody: unknown = undefined;

  try {
    const rawContent = await res.text();

    if (rawContent) {
      errorBody = rawContent;
      try {
        const parsedBody: unknown = JSON.parse(rawContent);
        const bodyRecord =
          parsedBody && typeof parsedBody === "object"
            ? (parsedBody as Record<string, unknown>)
            : null;
        const bodyError = bodyRecord?.["error"];
        const bodyMessage = bodyRecord?.["message"];
        const bodyDetails = bodyRecord?.["details"];
        const detailsFirstMessage =
          Array.isArray(bodyDetails) &&
          typeof bodyDetails[0] === "object" &&
          bodyDetails[0] !== null &&
          "message" in bodyDetails[0] &&
          typeof (bodyDetails[0] as { message?: unknown }).message === "string"
            ? (bodyDetails[0] as { message: string }).message
            : undefined;
        const structuredErrorMessage =
          getUsableErrorField(bodyError) ??
          getUsableErrorField(bodyMessage) ??
          getUsableErrorField(detailsFirstMessage);
        const hasStructuredErrorField =
          typeof bodyError === "string" ||
          typeof bodyMessage === "string" ||
          typeof detailsFirstMessage === "string";

        if (structuredErrorMessage !== undefined) {
          errorMessage = structuredErrorMessage;
        } else if (hasStructuredErrorField) {
          errorMessage = fallbackErrorMessage;
        } else {
          errorMessage = rawContent;
        }
      } catch {
        errorMessage = rawContent;
      }
    }
  } catch {
    errorMessage = fallbackErrorMessage;
  }

  const normalizedErrorMessage = getUsableErrorMessage(
    errorMessage,
    fallbackErrorMessage
  );

  if (errorMode === "structured") {
    throw createStructuredApiError({
      message: normalizedErrorMessage,
      status: res.status,
      headers: normalizeHeaders((res as { headers?: unknown }).headers),
      statusText: res.statusText,
      body: errorBody,
    });
  }

  return Promise.reject(normalizedErrorMessage);
};

interface ExecuteApiRequestParams {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly body?: BodyInit | undefined;
  readonly signal?: AbortSignal | undefined;
  readonly parseJson?: boolean | undefined;
  readonly errorMode?: ApiErrorMode | undefined;
  readonly credentials?: RequestCredentials | undefined;
}

type RequestStatus = number | "aborted" | "network_error" | "unknown";

const createRequestInit = ({
  method,
  headers,
  body,
  signal,
  credentials,
}: Pick<
  ExecuteApiRequestParams,
  "method" | "headers" | "body" | "signal" | "credentials"
>): RequestInit => {
  const requestInit: RequestInit = {
    method,
    headers,
  };
  const hasBody = body !== undefined;
  const hasSignal = signal !== undefined;
  const hasCredentials = credentials !== undefined;

  if (hasBody) {
    requestInit.body = body;
  }
  if (hasSignal) {
    requestInit.signal = signal;
  }
  if (hasCredentials) {
    requestInit.credentials = credentials;
  }

  return requestInit;
};

const parseApiResponse = async <T>(
  res: Response,
  url: string,
  parseJson: boolean
): Promise<T> => {
  if (!parseJson) {
    return undefined as T;
  }

  try {
    return await res.json();
  } catch (jsonError) {
    const errorMessage =
      jsonError instanceof Error ? jsonError.message : String(jsonError);
    throw new Error(
      `Failed to parse response as JSON from ${url}: ${errorMessage}`
    );
  }
};

const getErrorStatus = (
  currentStatus: RequestStatus,
  error: unknown
): RequestStatus => {
  if (currentStatus !== "unknown") {
    return currentStatus;
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return "aborted";
  }
  if (error instanceof TypeError) {
    return "network_error";
  }
  return currentStatus;
};

const getNetworkErrorMessage = (
  errorMessage: string,
  originalMessage: string,
  url: string
): string | null => {
  if (
    errorMessage.includes("load failed") ||
    errorMessage.includes("failed to fetch")
  ) {
    return `Network request failed. Please check your connection and try again. (${url})`;
  }
  if (errorMessage.includes("network")) {
    return `Network error: ${originalMessage} (${url})`;
  }
  return null;
};

const normalizeFetchError = (error: unknown, url: string): unknown => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return error;
  }
  if (error instanceof TypeError) {
    const networkErrorMessage = getNetworkErrorMessage(
      error.message.toLowerCase(),
      error.message,
      url
    );
    if (networkErrorMessage) {
      return new Error(networkErrorMessage);
    }
  }
  return error;
};

const executeApiRequest = async <T>({
  url,
  method,
  headers,
  body,
  signal,
  parseJson = true,
  errorMode = "legacy-string",
  credentials,
}: ExecuteApiRequestParams): Promise<T> => {
  const requestStartedAtMs = getRequestTimingNow();
  let status: RequestStatus = "unknown";
  const requestInit = createRequestInit({
    method,
    headers,
    body,
    signal,
    credentials,
  });

  try {
    const res = await fetch(url, requestInit);
    status = res.status;

    if (!res.ok) {
      return handleApiError(res, errorMode);
    }

    return await parseApiResponse<T>(res, url, parseJson);
  } catch (error) {
    status = getErrorStatus(status, error);
    throw normalizeFetchError(error, url);
  } finally {
    recordMobileLaunchApiRequest({
      endpoint: url,
      method,
      status,
      startedAtMs: requestStartedAtMs,
      durationMs: getRequestTimingNow() - requestStartedAtMs,
    });
  }
};

function getRequestTimingNow(): number {
  if (globalThis.performance?.now) {
    return globalThis.performance.now();
  }
  return Date.now();
}

export const commonApiFetch = async <T, U = Record<string, string>>(param: {
  endpoint: string;
  headers?: Record<string, string> | undefined;
  params?: U | undefined;
  signal?: AbortSignal | undefined;
}): Promise<T> => {
  const url = buildUrl(
    param.endpoint,
    param.params as Record<string, string> | undefined,
    (params) => {
      const transformed: Record<string, string> = {};
      Object.entries(params).forEach(([key, value]) => {
        transformed[key] = value === "nic" ? "cic" : value;
      });
      return transformed;
    }
  );

  return executeApiRequest<T>({
    url,
    method: "GET",
    headers: getHeaders(param.headers, false),
    signal: param.signal,
  });
};

interface RetryOptions {
  /** Maximum number of retry attempts. Default: 0 (no retries). */
  readonly maxRetries?: number | undefined;
  /** Initial delay in milliseconds before the first retry. Default: 1000ms. */
  readonly initialDelayMs?: number | undefined;
  /** Factor by which the delay increases for each subsequent retry. Default: 2. */
  readonly backoffFactor?: number | undefined;
  /**
   * Adds randomness to the delay (jitter) to prevent thundering herd problem.
   * Value is a percentage of the current delay (e.g., 0.1 for 10%). Default: 0.1.
   */
  readonly jitter?: number | undefined;
}

/**
 * Fetches data from a specified API endpoint with support for retries and progressive backoff.
 * This function wraps `commonApiFetch` to add retry capabilities.
 *
 * @template T The expected type of the data in the response body.
 * @template U The type of the `params` object for URL query parameters.
 * @param param The parameters for the fetch operation.
 * @param param.endpoint The API endpoint path.
 * @param param.headers Optional custom headers for the request.
 * @param param.params Optional URL query parameters.
 * @param param.signal Optional AbortSignal to cancel the request.
 * @param param.retryOptions Optional configuration for retry behavior.
 * @returns A Promise that resolves with the fetched data of type T.
 * @throws An error if the request fails after all retry attempts or if aborted.
 */
export const commonApiFetchWithRetry = async <
  T,
  U = Record<string, string>,
>(param: {
  readonly endpoint: string;
  readonly headers?: Record<string, string> | undefined;
  readonly params?: U | undefined;
  readonly signal?: AbortSignal | undefined;
  readonly retryOptions?: RetryOptions | undefined;
}): Promise<T> => {
  const { retryOptions, ...fetchParams } = param;
  const maxRetries = retryOptions?.maxRetries ?? 0;
  const initialDelayMs = retryOptions?.initialDelayMs ?? 1000;
  const backoffFactor = retryOptions?.backoffFactor ?? 2;
  const jitterFactor = retryOptions?.jitter ?? 0.1;

  let attempts = 0;
  let currentDelayMs = initialDelayMs;

  while (true) {
    try {
      if (fetchParams.signal?.aborted) {
        // If the signal is already aborted, throw immediately.
        // Use DOMException for consistency with fetch abort.
        throw new DOMException("Request aborted", "AbortError");
      }
      return await commonApiFetch<T, U>(fetchParams);
    } catch (error) {
      attempts++;
      if (attempts > maxRetries || fetchParams.signal?.aborted) {
        // If max retries reached or aborted during an attempt/before delay, re-throw.
        throw error;
      }

      // Log the retry attempt (optional, consider a more robust logging strategy for production)
      console.warn(
        `Attempt ${attempts}/${maxRetries} failed for endpoint '${fetchParams.endpoint}'. Retrying in ${currentDelayMs}ms. Error:`,
        error
      );

      const delayWithJitter =
        currentDelayMs * (1 + Math.random() * jitterFactor);

      const delayPromise = new Promise((resolve) =>
        setTimeout(resolve, delayWithJitter)
      );

      try {
        if (fetchParams.signal) {
          // Race the delay with the abort signal.
          await Promise.race([
            delayPromise,
            new Promise((_resolve, reject) => {
              // Check if already aborted before adding listener
              if (fetchParams.signal?.aborted) {
                reject(
                  new DOMException("Request aborted during delay", "AbortError")
                );
                return;
              }
              let timeoutId: NodeJS.Timeout | undefined = undefined;
              const abortListener = () => {
                if (timeoutId) clearTimeout(timeoutId); // Clear the timeout if aborted
                reject(
                  new DOMException("Request aborted during delay", "AbortError")
                );
              };
              // Ensure the delayPromise resolves and cleans up listener if not aborted
              timeoutId = setTimeout(() => {
                fetchParams.signal?.removeEventListener("abort", abortListener);
              }, delayWithJitter);
              fetchParams.signal?.addEventListener("abort", abortListener, {
                once: true,
              });
            }),
          ]);
        } else {
          await delayPromise;
        }
      } catch (abortError) {
        // If Promise.race rejected due to abort, or if the signal was aborted before/during delay
        throw abortError;
      }

      currentDelayMs *= backoffFactor;
    }
  }
};

export const commonApiPost = async <T, U, Z = Record<string, string>>(param: {
  endpoint: string;
  body: T;
  headers?: Record<string, string> | undefined;
  params?: Z | undefined;
  signal?: AbortSignal | undefined;
  errorMode?: ApiErrorMode | undefined;
  credentials?: RequestCredentials | undefined;
  parseJson?: boolean | undefined;
}): Promise<U> => {
  const url = buildUrl(
    param.endpoint,
    param.params as Record<string, string> | undefined
  );

  return executeApiRequest<U>({
    url,
    method: "POST",
    headers: getHeaders(param.headers, true),
    body: JSON.stringify(param.body),
    signal: param.signal,
    parseJson: param.parseJson ?? true,
    errorMode: param.errorMode ?? "legacy-string",
    credentials: param.credentials,
  });
};

export const commonApiPostWithoutBodyAndResponse = async (param: {
  endpoint: string;
  headers?: Record<string, string> | undefined;
}): Promise<void> => {
  const url = buildUrl(param.endpoint);

  await executeApiRequest<void>({
    url,
    method: "POST",
    headers: getHeaders(param.headers, true),
    body: "",
    parseJson: false,
  });
};

export const commonApiDelete = async (param: {
  endpoint: string;
  headers?: Record<string, string> | undefined;
  errorMode?: ApiErrorMode | undefined;
}): Promise<void> => {
  const url = buildUrl(param.endpoint);

  await executeApiRequest<void>({
    url,
    method: "DELETE",
    headers: getHeaders(param.headers),
    parseJson: false,
    errorMode: param.errorMode ?? "legacy-string",
  });
};

export const commonApiDeleteWithBody = async <
  T,
  U,
  Z = Record<string, string>,
>(param: {
  endpoint: string;
  body: T;
  headers?: Record<string, string> | undefined;
  params?: Z | undefined;
}): Promise<U> => {
  const url = buildUrl(
    param.endpoint,
    param.params as Record<string, string> | undefined
  );

  return executeApiRequest<U>({
    url,
    method: "DELETE",
    headers: getHeaders(param.headers, true),
    body: JSON.stringify(param.body),
  });
};

export const commonApiPut = async <T, U, Z = Record<string, string>>(param: {
  endpoint: string;
  body: T;
  headers?: Record<string, string> | undefined;
  params?: Z | undefined;
  signal?: AbortSignal | undefined;
}): Promise<U> => {
  const url = buildUrl(
    param.endpoint,
    param.params as Record<string, string> | undefined
  );

  return executeApiRequest<U>({
    url,
    method: "PUT",
    headers: getHeaders(param.headers, true),
    body: JSON.stringify(param.body),
    signal: param.signal,
  });
};

export const commonApiPatch = async <T, U, Z = Record<string, string>>(param: {
  endpoint: string;
  body: T;
  headers?: Record<string, string> | undefined;
  params?: Z | undefined;
  signal?: AbortSignal | undefined;
}): Promise<U> => {
  const url = buildUrl(
    param.endpoint,
    param.params as Record<string, string> | undefined
  );

  return executeApiRequest<U>({
    url,
    method: "PATCH",
    headers: getHeaders(param.headers, true),
    body: JSON.stringify(param.body),
    signal: param.signal,
  });
};

export const commonApiPostForm = async <U>(param: {
  endpoint: string;
  body: FormData;
  headers?: Record<string, string> | undefined;
}): Promise<U> => {
  const url = buildUrl(param.endpoint);

  return executeApiRequest<U>({
    url,
    method: "POST",
    headers: getHeaders(param.headers, false),
    body: param.body,
  });
};
