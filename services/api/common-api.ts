import { publicEnv } from "@/config/env";
import { getAuthJwt, getStagingAuth } from "../auth/auth.utils";

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

const handleApiError = async (res: Response): Promise<never> => {
  let errorMessage: string;
  let rawContent: string = "";

  try {
    const body: any = await res.json();
    errorMessage = body?.error ?? res.statusText ?? "Something went wrong";
  } catch {
    try {
      rawContent = await res.text();
      errorMessage = rawContent || res.statusText || "Something went wrong";
    } catch {
      errorMessage = res.statusText || "Something went wrong";
    }
  }

  throw new Error(errorMessage);
};

const executeApiRequest = async <T>(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: BodyInit,
  signal?: AbortSignal,
  parseJson: boolean = true
): Promise<T> => {
  const res = await fetch(url, {
    method,
    headers,
    body,
    signal,
  });

  if (!res.ok) {
    return handleApiError(res);
  }

  if (!parseJson) {
    return undefined as T;
  }

  return res.json();
};

export const commonApiFetch = async <T, U = Record<string, string>>(param: {
  endpoint: string;
  headers?: Record<string, string>;
  params?: U;
  signal?: AbortSignal;
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

  return executeApiRequest<T>(
    url,
    "GET",
    getHeaders(param.headers, false),
    undefined,
    param.signal
  );
};

interface RetryOptions {
  /** Maximum number of retry attempts. Default: 0 (no retries). */
  readonly maxRetries?: number;
  /** Initial delay in milliseconds before the first retry. Default: 1000ms. */
  readonly initialDelayMs?: number;
  /** Factor by which the delay increases for each subsequent retry. Default: 2. */
  readonly backoffFactor?: number;
  /**
   * Adds randomness to the delay (jitter) to prevent thundering herd problem.
   * Value is a percentage of the current delay (e.g., 0.1 for 10%). Default: 0.1.
   */
  readonly jitter?: number;
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
  U = Record<string, string>
>(param: {
  readonly endpoint: string;
  readonly headers?: Record<string, string>;
  readonly params?: U;
  readonly signal?: AbortSignal;
  readonly retryOptions?: RetryOptions;
}): Promise<T> => {
  const { retryOptions, ...fetchParams } = param;
  const maxRetries = retryOptions?.maxRetries ?? 0;
  const initialDelayMs = retryOptions?.initialDelayMs ?? 1000;
  const backoffFactor = retryOptions?.backoffFactor ?? 2;
  const jitterFactor = retryOptions?.jitter ?? 0.1;

  let attempts = 0;
  let currentDelayMs = initialDelayMs;

  // eslint-disable-next-line no-constant-condition
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
            new Promise((_, reject) => {
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
  headers?: Record<string, string>;
  params?: Z;
  signal?: AbortSignal;
}): Promise<U> => {
  const url = buildUrl(
    param.endpoint,
    param.params as Record<string, string> | undefined
  );

  return executeApiRequest<U>(
    url,
    "POST",
    getHeaders(param.headers, true),
    JSON.stringify(param.body),
    param.signal
  );
};

export const commonApiPostWithoutBodyAndResponse = async (param: {
  endpoint: string;
  headers?: Record<string, string>;
}): Promise<void> => {
  const url = buildUrl(param.endpoint);

  await executeApiRequest<void>(
    url,
    "POST",
    getHeaders(param.headers, true),
    "",
    undefined,
    false
  );
};

export const commonApiDelete = async (param: {
  endpoint: string;
  headers?: Record<string, string>;
}): Promise<void> => {
  const url = buildUrl(param.endpoint);

  await executeApiRequest<void>(
    url,
    "DELETE",
    getHeaders(param.headers),
    undefined,
    undefined,
    false
  );
};

export const commonApiDeleteWithBody = async <
  T,
  U,
  Z = Record<string, string>
>(param: {
  endpoint: string;
  body: T;
  headers?: Record<string, string>;
  params?: Z;
}): Promise<U> => {
  const url = buildUrl(
    param.endpoint,
    param.params as Record<string, string> | undefined
  );

  return executeApiRequest<U>(
    url,
    "DELETE",
    getHeaders(param.headers, true),
    JSON.stringify(param.body)
  );
};

export const commonApiPut = async <T, U, Z = Record<string, string>>(param: {
  endpoint: string;
  body: T;
  headers?: Record<string, string>;
  params?: Z;
}): Promise<U> => {
  const url = buildUrl(
    param.endpoint,
    param.params as Record<string, string> | undefined
  );

  return executeApiRequest<U>(
    url,
    "PUT",
    getHeaders(param.headers, true),
    JSON.stringify(param.body)
  );
};

export const commonApiPostForm = async <U>(param: {
  endpoint: string;
  body: FormData;
  headers?: Record<string, string>;
}): Promise<U> => {
  const url = buildUrl(param.endpoint);

  return executeApiRequest<U>(
    url,
    "POST",
    getHeaders(param.headers, false),
    param.body
  );
};
