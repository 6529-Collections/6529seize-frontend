import { extractErrorStatusCode } from "@/utils/errorStatus";

const PROXY_REACTION_PERMISSION_DENIED_MESSAGE =
  "Proxy doesn't have permission to add reactions";
const WAVE_REACTION_DISABLED_MESSAGE =
  "Chatting and reacting is not enabled in this wave";

type ReactionErrorKind =
  | "network"
  | "auth"
  | "rate-limit"
  | "server"
  | "endpoint-contract";

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error) {
    const typedError = error as {
      message?: unknown;
      error?: unknown;
    };
    if (typeof typedError.message === "string") {
      return typedError.message;
    }
    if (typeof typedError.error === "string") {
      return typedError.error;
    }
  }
  return String(error);
}

export function toCaptureExceptionInput(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(toErrorMessage(error));
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  const normalizedMessage = toErrorMessage(error).toLowerCase();
  return (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("load failed") ||
    normalizedMessage.includes("networkerror") ||
    normalizedMessage.includes("network error") ||
    normalizedMessage.includes("network request failed")
  );
}

export function classifyReactionError(error: unknown): {
  statusCode: number | null;
  errorKind: ReactionErrorKind;
} {
  const statusCode = extractErrorStatusCode(error);

  if (statusCode === 401 || statusCode === 403) {
    return { statusCode, errorKind: "auth" };
  }

  if (statusCode === 429) {
    return { statusCode, errorKind: "rate-limit" };
  }

  if (statusCode === 404 || statusCode === 405) {
    return { statusCode, errorKind: "endpoint-contract" };
  }

  if (typeof statusCode === "number" && statusCode >= 500) {
    return { statusCode, errorKind: "server" };
  }

  if (isNetworkError(error)) {
    return { statusCode, errorKind: "network" };
  }

  return { statusCode, errorKind: "server" };
}

export function isWaveReactionDisabledApiError(error: unknown): boolean {
  return (
    extractErrorStatusCode(error) === 403 &&
    toErrorMessage(error) === WAVE_REACTION_DISABLED_MESSAGE
  );
}

export function isExpectedWaveReactionDisabledError({
  dropId,
  endpoint,
  error,
  method,
}: {
  readonly dropId: string;
  readonly endpoint: string | null | undefined;
  readonly error: unknown;
  readonly method: string | null | undefined;
}): boolean {
  return (
    endpoint === `drops/${dropId}/reaction` &&
    (method === "POST" || method === "DELETE") &&
    isWaveReactionDisabledApiError(error)
  );
}

export function isExpectedStaleDropNotFoundError({
  dropId,
  endpoint,
  errorMessage,
  statusCode,
}: {
  readonly dropId: string;
  readonly endpoint: string | null | undefined;
  readonly errorMessage: string;
  readonly statusCode: number | null;
}): boolean {
  // Intentionally exact: if the backend changes this stale-drop 404 shape,
  // capture resumes so we can re-evaluate the contract.
  return (
    statusCode === 404 &&
    endpoint === `drops/${dropId}/reaction` &&
    errorMessage === `Drop ${dropId} not found`
  );
}

export function isExpectedProxyReactionPermissionDeniedError({
  dropId,
  endpoint,
  errorMessage,
  method,
  statusCode,
}: {
  readonly dropId: string;
  readonly endpoint: string | null | undefined;
  readonly errorMessage: string;
  readonly method: string | null | undefined;
  readonly statusCode: number | null;
}): boolean {
  // Intentionally exact: any different auth failure remains actionable.
  return (
    statusCode === 403 &&
    endpoint === `drops/${dropId}/reaction` &&
    method === "POST" &&
    errorMessage === PROXY_REACTION_PERMISSION_DENIED_MESSAGE
  );
}
