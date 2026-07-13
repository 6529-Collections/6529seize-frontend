interface ExtractErrorStatusCodeOptions {
  /** Parse leading digits from strings such as `"404 Not Found"`. */
  readonly allowPartialStringStatus?: boolean;
}

function parseStatusCode(
  status: unknown,
  allowPartialStringStatus: boolean
): number | null {
  if (typeof status === "number" && Number.isFinite(status)) {
    return status;
  }

  if (typeof status === "string") {
    const normalizedStatus = status.trim();
    if (
      !allowPartialStringStatus &&
      !/^\d+$/.test(normalizedStatus)
    ) {
      return null;
    }
    const parsed = Number.parseInt(normalizedStatus, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

export function extractErrorStatusCode(
  error: unknown,
  options: ExtractErrorStatusCodeOptions = {}
): number | null {
  if (error === null || typeof error !== "object") {
    return null;
  }

  const typedError = error as {
    status?: unknown;
    code?: unknown;
    response?: {
      status?: unknown;
    };
    cause?: {
      status?: unknown;
      code?: unknown;
      response?: {
        status?: unknown;
      };
    };
  };

  const parse = (value: unknown): number | null =>
    parseStatusCode(value, options.allowPartialStringStatus === true);

  return (
    parse(typedError.status) ??
    parse(typedError.response?.status) ??
    parse(typedError.code) ??
    parse(typedError.cause?.status) ??
    parse(typedError.cause?.response?.status) ??
    parse(typedError.cause?.code)
  );
}
