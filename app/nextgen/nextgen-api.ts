import { commonApiFetch } from "@/services/api/common-api";

const NEXTGEN_API_MAX_ATTEMPTS = 3;
const NEXTGEN_API_INITIAL_RETRY_DELAY_MS = 250;

type ApiStatusError = Error & {
  readonly status?: unknown;
};

interface NextGenApiRequest {
  readonly endpoint: string;
  readonly headers: Record<string, string>;
}

function getApiErrorStatus(error: unknown): number | null {
  if (!(error instanceof Error) || error.name !== "ApiError") {
    return null;
  }

  const statusError = error as ApiStatusError;
  const status = statusError.status;
  return typeof status === "number" && Number.isInteger(status) ? status : null;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  return (
    error instanceof Error &&
    (error.message.startsWith("Network request failed.") ||
      error.message.startsWith("Network error:"))
  );
}

function isRetryableError(error: unknown): boolean {
  if (isAbortError(error)) {
    return false;
  }

  const status = getApiErrorStatus(error);
  return isNetworkError(error) || status === 429 || (status ?? 0) >= 500;
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function fetchNextGenApi<T>({
  endpoint,
  headers,
}: NextGenApiRequest): Promise<T> {
  async function execute(attempt: number, retryDelayMs: number): Promise<T> {
    try {
      return await commonApiFetch<T>({
        endpoint,
        headers,
        errorMode: "structured",
      });
    } catch (error) {
      if (attempt >= NEXTGEN_API_MAX_ATTEMPTS || !isRetryableError(error)) {
        throw error;
      }

      await wait(retryDelayMs);
      return execute(attempt + 1, retryDelayMs * 2);
    }
  }

  return execute(1, NEXTGEN_API_INITIAL_RETRY_DELAY_MS);
}

export async function fetchNextGenApiOrNull<T>(
  request: NextGenApiRequest
): Promise<T | null> {
  try {
    return await fetchNextGenApi<T>(request);
  } catch (error) {
    if (getApiErrorStatus(error) === 404) {
      return null;
    }
    throw error;
  }
}
