import type { Breadcrumb, Event } from "@sentry/nextjs";

const REDACTED = "[Filtered]";
const URL_IS_FIRST_PARTY_KEY = "url.is_first_party";
const URL_IS_FIRST_PARTY_API_KEY = "url.is_first_party_api";
const UNUSABLE_URL_TOKENS = new Set([
  "[filtered]",
  "[redacted]",
  "filtered",
  "unknown",
]);

const JWT_PATTERN = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;
const STRIPE_KEY_PATTERN = /\b(sk|pk)_[a-zA-Z0-9]{16,}\b/g;
const BEARER_PATTERN = /\bBearer\s+([A-Za-z0-9._~+/=-]+)\b/g;
const BASIC_PATTERN = /\bBasic\s+([A-Za-z0-9+/=]+)\b/g;

const SENSITIVE_KEY_FRAGMENT_PATTERN =
  /(auth|authorization|cookie|set-cookie|token|secret|password|passwd|session|api[_-]?key|private[_-]?key|signature|body|payload)/i;

const SENSITIVE_HEADER_NAME_PATTERN =
  /^(authorization|cookie|set-cookie|x-api-key|x-auth-token|x-csrf-token|x-xsrf-token|proxy-authorization|x-forwarded-for|x-real-ip|cf-connecting-ip)$/i;

type SanitizableSentryEvent<T extends Event> = Omit<T, "request" | "user"> & {
  request?: Record<string, unknown> | null;
  user?: unknown;
};

function isFirstPartyHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === "6529.io" || normalized.endsWith(".6529.io");
}

function isFirstPartyApiHost(hostname: string): boolean {
  const labels = hostname.toLowerCase().split(".");
  if (labels.length === 3) {
    return labels[0] === "api" && labels[1] === "6529" && labels[2] === "io";
  }

  return (
    labels.length === 4 &&
    labels[0] === "api" &&
    labels[1] !== "" &&
    labels[2] === "6529" &&
    labels[3] === "io"
  );
}

function isAbsoluteUrlLike(value: string): boolean {
  return /^[a-z][a-z\d+\-.]*:/i.test(value) || value.startsWith("//");
}

function isUnusableUrlToken(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed || isAbsoluteUrlLike(trimmed)) {
    return false;
  }

  const noHash = trimmed.split("#", 1)[0] ?? trimmed;
  const noQuery = noHash.split("?", 1)[0] ?? noHash;
  const withoutPathPrefix =
    noQuery.startsWith("/") && !noQuery.startsWith("//")
      ? noQuery.slice(1)
      : noQuery;
  let decoded = withoutPathPrefix;
  try {
    decoded = decodeURIComponent(withoutPathPrefix);
  } catch {
    decoded = withoutPathPrefix;
  }
  const token =
    decoded.startsWith("/") && !decoded.startsWith("//")
      ? decoded.slice(1).toLowerCase()
      : decoded.toLowerCase();

  return UNUSABLE_URL_TOKENS.has(token);
}

function isRelativeUrlPathLike(value: string): boolean {
  for (const char of value) {
    if (char.trim() === "") {
      return false;
    }
  }

  if (
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("../")
  ) {
    return true;
  }

  const queryIndex = value.indexOf("?");
  const hashIndex = value.indexOf("#");
  let pathEnd = -1;
  if (queryIndex === -1) {
    pathEnd = hashIndex;
  } else if (hashIndex === -1) {
    pathEnd = queryIndex;
  } else {
    pathEnd = Math.min(queryIndex, hashIndex);
  }
  const path = pathEnd === -1 ? value : value.slice(0, pathEnd);

  return path.indexOf("/") > 0;
}

function getBreadcrumbUrlIsFirstParty(value: unknown): boolean | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (isUnusableUrlToken(trimmed)) {
    return undefined;
  }

  if (!isAbsoluteUrlLike(trimmed)) {
    return isRelativeUrlPathLike(trimmed) ? true : undefined;
  }

  try {
    const parsed = new URL(trimmed, "https://6529.io");
    return isFirstPartyHost(parsed.hostname);
  } catch {
    return undefined;
  }
}

function getBreadcrumbUrlIsFirstPartyApi(
  value: unknown,
  urlIsFirstParty: unknown
): boolean | undefined {
  if (isUnusableUrlToken(value)) {
    return undefined;
  }

  if (urlIsFirstParty === false) {
    return false;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (!isAbsoluteUrlLike(trimmed) && !isRelativeUrlPathLike(trimmed)) {
    return undefined;
  }

  try {
    const parsed = new URL(trimmed, "https://6529.io");
    const hostname = parsed.hostname.toLowerCase();
    if (isFirstPartyApiHost(hostname)) {
      return true;
    }

    return isFirstPartyHost(hostname) && parsed.pathname.startsWith("/api/");
  } catch {
    return undefined;
  }
}

function sanitizeString(value: string): string {
  if (!value) return value;
  let sanitized = value;
  sanitized = sanitized.replace(JWT_PATTERN, REDACTED);
  sanitized = sanitized.replace(STRIPE_KEY_PATTERN, REDACTED);
  sanitized = sanitized.replace(BEARER_PATTERN, "Bearer " + REDACTED);
  sanitized = sanitized.replace(BASIC_PATTERN, "Basic " + REDACTED);
  return sanitized.length > 2048 ? sanitized.slice(0, 2048) : sanitized;
}

export function sanitizeUrlString(value: unknown): unknown {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  // Fast-path: drop query / hash without needing URL parsing.
  const noHash = trimmed.split("#", 1)[0] ?? trimmed;
  const noQuery = noHash.split("?", 1)[0] ?? noHash;
  if (isUnusableUrlToken(noQuery)) {
    return noQuery;
  }

  if (!isAbsoluteUrlLike(trimmed) && !isRelativeUrlPathLike(noQuery)) {
    return noQuery;
  }

  // If it looks like a URL, keep only the pathname.
  try {
    const parsed = new URL(trimmed, "http://localhost");
    return parsed.pathname || "/";
  } catch {
    return noQuery;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

function sanitizeUnknown(
  value: unknown,
  depth: number,
  seen: WeakSet<object>
): unknown {
  if (depth > 8) return REDACTED;

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((v) => sanitizeUnknown(v, depth + 1, seen));
  }

  if (isPlainObject(value)) {
    if (seen.has(value)) return REDACTED;
    seen.add(value);

    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEY_FRAGMENT_PATTERN.test(key)) {
        result[key] = REDACTED;
        continue;
      }

      if (key === "url" || key === "from" || key === "to") {
        result[key] = sanitizeUrlString(val);
        continue;
      }

      result[key] = sanitizeUnknown(val, depth + 1, seen);
    }
    return result;
  }

  return value;
}

function sanitizeHeaders(
  headers: unknown
): Record<string, unknown> | undefined {
  if (!isPlainObject(headers)) return undefined;

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(headers)) {
    if (/^(referer|referrer)$/i.test(key)) {
      result[key] = typeof val === "string" ? sanitizeUrlString(val) : REDACTED;
      continue;
    }

    if (SENSITIVE_HEADER_NAME_PATTERN.test(key)) {
      result[key] = REDACTED;
      continue;
    }

    if (typeof val === "string") {
      result[key] = sanitizeString(val);
      continue;
    }

    result[key] = sanitizeUnknown(val, 0, new WeakSet<object>());
  }
  return result;
}

function sanitizeBreadcrumbTextFields(crumb: Breadcrumb): void {
  if (typeof crumb.message === "string") {
    crumb.message = sanitizeString(crumb.message);
  }
  if (typeof crumb.category === "string") {
    crumb.category = sanitizeString(crumb.category);
  }
  if (typeof crumb.type === "string") {
    crumb.type = sanitizeString(crumb.type);
  }
}

function addMissingBreadcrumbUrlMetadata(
  data: Record<string, unknown>,
  key: string,
  getValue: (data: Record<string, unknown>) => boolean | undefined
): boolean {
  if (Object.prototype.hasOwnProperty.call(data, key)) {
    return false;
  }

  const value = getValue(data);
  if (typeof value !== "boolean") {
    return false;
  }

  data[key] = value;
  return true;
}

function withBreadcrumbUrlMetadata(
  data: Record<string, unknown>
): Record<string, unknown> {
  const nextData = { ...data };

  addMissingBreadcrumbUrlMetadata(
    nextData,
    URL_IS_FIRST_PARTY_KEY,
    (currentData) => getBreadcrumbUrlIsFirstParty(currentData["url"])
  );
  addMissingBreadcrumbUrlMetadata(
    nextData,
    URL_IS_FIRST_PARTY_API_KEY,
    (currentData) =>
      getBreadcrumbUrlIsFirstPartyApi(
        currentData["url"],
        currentData[URL_IS_FIRST_PARTY_KEY]
      )
  );

  return nextData;
}

function sanitizeBreadcrumbData(
  data: NonNullable<Breadcrumb["data"]>
): NonNullable<Breadcrumb["data"]> {
  const dataWithMetadata = isPlainObject(data)
    ? withBreadcrumbUrlMetadata(data)
    : data;

  const seen = new WeakSet<object>();
  return sanitizeUnknown(dataWithMetadata, 0, seen) as NonNullable<
    Breadcrumb["data"]
  >;
}

export function sanitizeSentryBreadcrumb(
  breadcrumb: Breadcrumb | undefined | null
): Breadcrumb | null {
  if (!breadcrumb) return null;

  const crumb = { ...breadcrumb };
  sanitizeBreadcrumbTextFields(crumb);

  if (crumb.data) {
    crumb.data = sanitizeBreadcrumbData(crumb.data);
  }

  return crumb;
}

export function sanitizeSentryEvent<T extends Event>(event: T): T {
  // Avoid mutating the original reference in case Sentry reuses it.
  const next = { ...event } as unknown as SanitizableSentryEvent<T>;

  // Do not send user-identifying fields by default.
  delete next.user;

  if (next.request) {
    const req: Record<string, unknown> = { ...next.request };

    if (typeof req["url"] === "string") {
      req["url"] = sanitizeUrlString(req["url"]);
    }

    const sanitizedHeaders = sanitizeHeaders(req["headers"]);
    if (sanitizedHeaders) {
      req["headers"] = sanitizedHeaders;
    } else {
      delete req["headers"];
    }

    // Request bodies and cookies can contain user content and credentials.
    delete req["cookies"];
    delete req["data"];
    delete req["query_string"];

    next.request = req;
  }

  if (typeof next.message === "string") {
    next.message = sanitizeString(next.message);
  }

  if (next.exception?.values) {
    next.exception = {
      ...next.exception,
      values: next.exception.values.map((v) => {
        const value = { ...v };
        if (typeof value.value === "string") {
          value.value = sanitizeString(value.value);
        }
        if (typeof value.type === "string") {
          value.type = sanitizeString(value.type);
        }
        return value;
      }),
    };
  }

  if (Array.isArray(next.breadcrumbs)) {
    next.breadcrumbs = next.breadcrumbs
      .map((b) => sanitizeSentryBreadcrumb(b))
      .filter(Boolean) as Breadcrumb[];
  }

  const seen = new WeakSet<object>();
  if (next.extra) {
    next.extra = sanitizeUnknown(next.extra, 0, seen) as NonNullable<
      Event["extra"]
    >;
  }
  if (next.contexts) {
    next.contexts = sanitizeUnknown(next.contexts, 0, seen) as NonNullable<
      Event["contexts"]
    >;
  }

  return next as unknown as T;
}
