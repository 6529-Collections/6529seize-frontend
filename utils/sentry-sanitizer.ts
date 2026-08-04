import type { Breadcrumb, Event } from "@sentry/nextjs";
import {
  sanitizeEndpointGroup,
  sanitizeRouteFamily,
} from "./monitoring/mobileLaunchTimingSanitizers";

const REDACTED = "[Filtered]";
const THIRD_PARTY = "third-party";
const URL_IS_FIRST_PARTY_KEY = "url.is_first_party";
const URL_IS_FIRST_PARTY_API_KEY = "url.is_first_party_api";
const UNUSABLE_URL_TOKENS = new Set(
  "[filtered] [redacted] filtered unknown".split(" ")
);
const JWT_PATTERN = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;
const STRIPE_KEY_PATTERN = /\b(sk|pk)_[a-zA-Z0-9]{16,}\b/g;
const BEARER_PATTERN = /\bBearer\s+([A-Za-z0-9._~+/=-]+)\b/g;
const BASIC_PATTERN = /\bBasic\s+([A-Za-z0-9+/=]+)\b/g;
const ROUTE_SPAN_OPERATION_PATTERN = /^(?:navigation|pageload)(?:\.|$)/;
const STATIC_RESOURCE_ROOT_SEGMENTS = new Set(
  ".well-known _next api assets cdn-cgi favicon.ico fonts icons images manifest.json robots.txt sitemap.xml static".split(
    " "
  )
);
const NON_APP_FIRST_PARTY_SUBDOMAIN_PATTERN =
  /^(?:allowlist-api|api|cdn|media)\./i;
const SENTRY_IDENTIFIER_PARENT_SEGMENTS = new Set(
  "author authors competition competitions entries entry media nft nfts outcome outcomes package packages profile-cms upload uploads".split(
    " "
  )
);
const SENTRY_IDENTIFIER_CONTAINER_PATTERN = /^(?:author|media)[_-]/;
const SENTRY_ROUTE_PLACEHOLDER_PATTERN =
  /^(?::[a-z][a-z0-9_-]*|\[\[?(?:\.\.\.)?[a-z][a-z0-9_-]*\]?\])$/i;
const URL_VALUE_KEY_PATTERN =
  /^(?:from|http\.target|http\.url|targetUrl|to|url|url\.full|url\.path)$/i;
const URL_DETAIL_KEY_PATTERN =
  /^(?:http\.(?:fragment|query)|url\.(?:fragment|query))$/i;
const HOST_VALUE_KEY_PATTERN = /^(?:http\.host|server\.address|url\.domain)$/i;
const HOST_ATTRIBUTION_VALUES = new Set(
  `first-party first-party-api first-party-app ${THIRD_PARTY}`.split(" ")
);
const OMIT_SANITIZED_VALUE = Symbol("omit-sanitized-value");

const SENSITIVE_KEY_FRAGMENT_PATTERN =
  /(auth|authorization|cookie|set-cookie|token|secret|password|passwd|session|api[_-]?key|private[_-]?key|signature|body|payload)/i;

const SENSITIVE_HEADER_NAME_PATTERN =
  /^(authorization|cookie|set-cookie|x-api-key|x-auth-token|x-csrf-token|x-xsrf-token|proxy-authorization|x-forwarded-for|x-real-ip|cf-connecting-ip)$/i;

type SanitizableSentrySpan = {
  description?: string | undefined;
  op?: string | undefined;
  data?: Record<string, unknown> | undefined;
};

type SanitizableSentryEvent<T extends Event> = Omit<
  T,
  "request" | "spans" | "user"
> & {
  request?: Record<string, unknown> | null;
  spans?: SanitizableSentrySpan[] | undefined;
  user?: unknown;
};

type SentryPathKind = "auto" | "endpoint" | "route";

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

function isFirstPartyAppHost(hostname: string): boolean {
  return (
    isFirstPartyHost(hostname) &&
    !isFirstPartyApiHost(hostname) &&
    !NON_APP_FIRST_PARTY_SUBDOMAIN_PATTERN.test(hostname)
  );
}

function isStaticResourcePath(pathname: string): boolean {
  const basePath = pathname.split(/[?#]/, 1)[0] ?? pathname;
  const pathWithoutLeadingSlash = basePath.startsWith("/")
    ? basePath.slice(1)
    : basePath;
  const slashIndex = pathWithoutLeadingSlash.indexOf("/");
  const rootSegment = (
    slashIndex === -1
      ? pathWithoutLeadingSlash
      : pathWithoutLeadingSlash.slice(0, slashIndex)
  ).toLowerCase();

  return STATIC_RESOURCE_ROOT_SEGMENTS.has(rootSegment);
}

function hasRoutePlaceholder(pathname: string): boolean {
  return /\/(?:\[[^/]+\]|:[a-z][a-z0-9_-]*)/i.test(pathname);
}

function sanitizeSentryEndpointFamily(pathname: string): string {
  const basePath = pathname.split(/[?#]/, 1)[0] ?? pathname;
  const rawSegments = basePath.split("/").filter(Boolean);
  const baselineSegments = sanitizeEndpointGroup(basePath)
    .split("/")
    .filter(Boolean);
  const sanitizedSegments = rawSegments.map((segment, index) => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      decoded = segment;
    }
    const lower = decoded.toLowerCase();
    const baseline = baselineSegments[index] ?? ":segment";

    if (SENTRY_ROUTE_PLACEHOLDER_PATTERN.test(lower)) {
      return lower;
    }

    const previousRaw = rawSegments[index - 1];
    let previous = previousRaw?.toLowerCase();
    if (previousRaw !== undefined) {
      try {
        previous = decodeURIComponent(previousRaw).toLowerCase();
      } catch {
        previous = previousRaw.toLowerCase();
      }
    }
    if (lower === "by-wallet") {
      return lower;
    }
    if (
      previous !== undefined &&
      (SENTRY_IDENTIFIER_PARENT_SEGMENTS.has(previous) ||
        SENTRY_IDENTIFIER_CONTAINER_PATTERN.test(previous))
    ) {
      return ":id";
    }

    return baseline;
  });

  return sanitizedSegments.length > 0 ? `/${sanitizedSegments.join("/")}` : "/";
}

function sanitizeRoutePath(pathname: string): string {
  return hasRoutePlaceholder(pathname)
    ? sanitizeSentryEndpointFamily(pathname)
    : sanitizeRouteFamily(pathname);
}

function shouldUseRouteFamily(
  parsed: URL,
  pathname: string,
  kind: SentryPathKind,
  isRelativeInput = false
): boolean {
  if (kind === "route") {
    return true;
  }
  if (
    kind === "endpoint" ||
    pathname.startsWith("/api/") ||
    isStaticResourcePath(pathname)
  ) {
    return false;
  }

  return isRelativeInput || isFirstPartyAppHost(parsed.hostname);
}

function sanitizeUrlLikeString(
  value: string,
  kind: SentryPathKind = "auto"
): string {
  const trimmed = value.trim();
  const noHash = trimmed.split("#", 1)[0] ?? trimmed;
  const noQuery = noHash.split("?", 1)[0] ?? noHash;
  if (isUnusableUrlToken(noQuery)) {
    return noQuery;
  }

  if (!isAbsoluteUrlLike(trimmed) && !isRelativeUrlPathLike(noQuery)) {
    return noQuery;
  }
  if (/^data:/i.test(trimmed)) {
    return "data:[Filtered]";
  }

  try {
    const parsed = new URL(trimmed, "https://relative.invalid");
    const pathname = parsed.pathname || "/";
    const useRouteFamily = shouldUseRouteFamily(
      parsed,
      pathname,
      kind,
      !isAbsoluteUrlLike(trimmed)
    );
    return useRouteFamily
      ? sanitizeRoutePath(pathname)
      : sanitizeSentryEndpointFamily(pathname);
  } catch {
    return sanitizeSentryEndpointFamily(noQuery);
  }
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

function parseHostValue(value: string): URL | undefined {
  try {
    const hasAuthority = value.startsWith("//") || value.indexOf("://") > 0;
    return new URL(hasAuthority ? value : `http://${value}`);
  } catch {
    return undefined;
  }
}

function classifyHostAttribution(hostname: string): string {
  if (isFirstPartyApiHost(hostname)) {
    return "first-party-api";
  }
  if (isFirstPartyAppHost(hostname)) {
    return "first-party-app";
  }
  return isFirstPartyHost(hostname) ? "first-party" : THIRD_PARTY;
}

function sanitizeHostAttribution(value: unknown): string {
  if (typeof value !== "string") {
    return THIRD_PARTY;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized || HOST_ATTRIBUTION_VALUES.has(normalized)) {
    return normalized || THIRD_PARTY;
  }

  const parsed = parseHostValue(normalized);
  return parsed ? classifyHostAttribution(parsed.hostname) : THIRD_PARTY;
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
  return sanitizeUrlLikeString(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

function sanitizeObjectValue(
  key: string,
  value: unknown,
  depth: number,
  seen: WeakSet<object>
): unknown {
  if (URL_DETAIL_KEY_PATTERN.test(key)) {
    return OMIT_SANITIZED_VALUE;
  }
  if (SENSITIVE_KEY_FRAGMENT_PATTERN.test(key)) {
    return REDACTED;
  }
  if (HOST_VALUE_KEY_PATTERN.test(key)) {
    return sanitizeHostAttribution(value);
  }
  if (URL_VALUE_KEY_PATTERN.test(key)) {
    return sanitizeUrlString(value);
  }
  return sanitizeUnknown(value, depth + 1, seen);
}

function sanitizePlainObject(
  value: Record<string, unknown>,
  depth: number,
  seen: WeakSet<object>
): Record<string, unknown> | string {
  if (seen.has(value)) {
    return REDACTED;
  }
  seen.add(value);

  const result: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    const sanitizedValue = sanitizeObjectValue(key, nestedValue, depth, seen);
    if (sanitizedValue !== OMIT_SANITIZED_VALUE) {
      result[key] = sanitizedValue;
    }
  }
  return result;
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
    return sanitizePlainObject(value, depth, seen);
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

  let sanitizedTopLevelUrl: string | undefined;
  if (isPlainObject(dataWithMetadata)) {
    const url = dataWithMetadata["url"];
    if (typeof url === "string") {
      const isFirstParty = dataWithMetadata[URL_IS_FIRST_PARTY_KEY] === true;
      const isFirstPartyApi =
        dataWithMetadata[URL_IS_FIRST_PARTY_API_KEY] === true;
      let kind: SentryPathKind = "endpoint";
      if (isAbsoluteUrlLike(url)) {
        kind = isRouteUrl(url) ? "route" : "endpoint";
      } else if (
        isFirstParty &&
        !isFirstPartyApi &&
        !isStaticResourcePath(url)
      ) {
        kind = "route";
      }
      sanitizedTopLevelUrl = sanitizeUrlLikeString(url, kind);
      dataWithMetadata["url"] = sanitizedTopLevelUrl;
    }
  }

  const seen = new WeakSet<object>();
  const sanitizedData = sanitizeUnknown(
    dataWithMetadata,
    0,
    seen
  ) as NonNullable<Breadcrumb["data"]>;
  if (sanitizedTopLevelUrl !== undefined && isPlainObject(sanitizedData)) {
    sanitizedData["url"] = sanitizedTopLevelUrl;
  }
  return sanitizedData;
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

function isRouteUrl(value: unknown): boolean {
  if (typeof value !== "string" || !isAbsoluteUrlLike(value)) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return shouldUseRouteFamily(parsed, parsed.pathname || "/", "auto");
  } catch {
    return false;
  }
}

function getSpanPathKind(span: SanitizableSentrySpan): SentryPathKind {
  if (ROUTE_SPAN_OPERATION_PATTERN.test(span.op ?? "")) {
    return "route";
  }

  const fullUrl = span.data?.["http.url"] ?? span.data?.["url.full"];
  if (isRouteUrl(fullUrl)) {
    return "route";
  }

  const url = span.data?.["url"];
  if (isRouteUrl(url)) {
    return "route";
  }
  if (span.data?.["url.same_origin"] === true && typeof url === "string") {
    let pathname = url.split(/[?#]/, 1)[0] ?? url;
    try {
      pathname = new URL(url, "https://relative.invalid").pathname || "/";
    } catch {
      // Keep the query-free path fallback for malformed URL-like values.
    }
    if (!pathname.startsWith("/api/") && !isStaticResourcePath(pathname)) {
      return "route";
    }
  }

  return "endpoint";
}

function sanitizeSpanDescription(
  description: string,
  kind: SentryPathKind
): string {
  const methodTarget = parseHttpMethodDescription(description);
  const method = methodTarget?.[0];
  const target = methodTarget?.[1];
  if (
    method &&
    target &&
    (isAbsoluteUrlLike(target) || isRelativeUrlPathLike(target))
  ) {
    return `${method} ${sanitizeUrlLikeString(target, kind)}`;
  }
  if (isAbsoluteUrlLike(description) || isRelativeUrlPathLike(description)) {
    return sanitizeUrlLikeString(description, kind);
  }

  return sanitizeString(description);
}

function isAsciiLetterAt(value: string, index: number): boolean {
  const code = value.codePointAt(index) ?? -1;
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function parseHttpMethodDescription(
  value: string
): [method: string, target: string] | undefined {
  let methodEnd = 0;
  while (isAsciiLetterAt(value, methodEnd)) methodEnd += 1;
  let targetStart = methodEnd;
  while (value[targetStart]?.trim() === "") targetStart += 1;
  if (!methodEnd || targetStart === methodEnd || targetStart === value.length) {
    return undefined;
  }
  return [value.slice(0, methodEnd), value.slice(targetStart)];
}

function sanitizeSpanData(
  data: Record<string, unknown>,
  kind: SentryPathKind
): Record<string, unknown> {
  const nextData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (URL_DETAIL_KEY_PATTERN.test(key)) {
      continue;
    }
    if (HOST_VALUE_KEY_PATTERN.test(key)) {
      nextData[key] = sanitizeHostAttribution(value);
      continue;
    }
    if (URL_VALUE_KEY_PATTERN.test(key)) {
      nextData[key] =
        typeof value === "string" ? sanitizeUrlLikeString(value, kind) : value;
      continue;
    }
    nextData[key] = sanitizeUnknown(value, 0, new WeakSet<object>());
  }
  return nextData;
}

export function sanitizeSentrySpan<T extends SanitizableSentrySpan>(
  span: T
): T {
  const next = { ...span };
  const kind = getSpanPathKind(next);

  if (typeof next.description === "string") {
    next.description = sanitizeSpanDescription(next.description, kind);
  }
  if (next.data) {
    next.data = sanitizeSpanData(next.data, kind);
  }

  return next;
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

  if (typeof next.transaction === "string") {
    next.transaction = sanitizeSpanDescription(next.transaction, "auto");
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

  if (Array.isArray(next.spans)) {
    next.spans = next.spans.map((span) => sanitizeSentrySpan(span));
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
