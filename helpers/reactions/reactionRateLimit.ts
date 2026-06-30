const RETRY_AFTER_HEADER = "retry-after";

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (value === null || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
};

const parseRetryAfterDelaySeconds = (value: string): number | null => {
  let hasDigit = false;
  let hasDecimalPoint = false;

  for (const character of value) {
    if (character >= "0" && character <= "9") {
      hasDigit = true;
      continue;
    }

    if (character === "." && !hasDecimalPoint) {
      hasDecimalPoint = true;
      continue;
    }

    return null;
  }

  if (!hasDigit) {
    return null;
  }

  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds : null;
};

const parseRetryAfterHeaderValue = (
  value: string,
  nowMs: number = Date.now()
): number | null => {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  const seconds = parseRetryAfterDelaySeconds(trimmedValue);
  if (seconds !== null) {
    return Math.round(seconds * 1000);
  }

  const retryAtMs = Date.parse(trimmedValue);
  if (!Number.isNaN(retryAtMs)) {
    return Math.max(0, retryAtMs - nowMs);
  }

  return null;
};

const extractRetryAfterMsFromHeaders = (
  headers: unknown,
  nowMs: number = Date.now()
): number | null => {
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    const retryAfter = headers.get(RETRY_AFTER_HEADER);
    return retryAfter ? parseRetryAfterHeaderValue(retryAfter, nowMs) : null;
  }

  const headersRecord = toRecord(headers);
  if (!headersRecord) {
    return null;
  }

  const retryAfter =
    headersRecord[RETRY_AFTER_HEADER] ?? headersRecord["Retry-After"] ?? null;
  if (typeof retryAfter !== "string") {
    return null;
  }

  return parseRetryAfterHeaderValue(retryAfter, nowMs);
};

export const extractRetryAfterMs = (
  error: unknown,
  nowMs: number = Date.now()
): number | null => {
  if (error === null || typeof error !== "object") {
    return null;
  }

  const typedError = error as {
    readonly headers?: unknown;
    readonly response?: {
      readonly headers?: unknown;
    } | null;
    readonly cause?: {
      readonly headers?: unknown;
      readonly response?: {
        readonly headers?: unknown;
      } | null;
    } | null;
  };

  return (
    extractRetryAfterMsFromHeaders(typedError.response?.headers, nowMs) ??
    extractRetryAfterMsFromHeaders(typedError.headers, nowMs) ??
    extractRetryAfterMsFromHeaders(
      typedError.cause?.response?.headers,
      nowMs
    ) ??
    extractRetryAfterMsFromHeaders(typedError.cause?.headers, nowMs)
  );
};
