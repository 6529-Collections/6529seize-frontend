import {
  FILTERED_URL_TOKENS,
  objectCapturedPromiseRejectionMessages,
  THE_MEMES_MINT_ROUTE_PATH,
  WAVES_ROUTE_PATH,
} from "./constants";
import type {
  SentryBreadcrumb,
  SentryClientEvent,
  SentryEventHint,
  SentryStackFrame,
} from "./types";

export function getStringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getBooleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function getNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function isNetworkErrorMessage(value: string): boolean {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("failed to fetch") ||
    normalized.includes("load failed") ||
    normalized.includes("networkerror") ||
    normalized.includes("network error") ||
    normalized.includes("network connection was lost") ||
    normalized.includes("network request failed")
  );
}

export function getEventMessage(event: SentryClientEvent): string {
  const exceptionValue = event.exception?.values?.[0]?.value;
  if (typeof exceptionValue === "string" && exceptionValue) {
    return exceptionValue;
  }

  return typeof event.message === "string" ? event.message : "";
}

export function isObjectCapturedPromiseRejectionMessage(
  value: string
): boolean {
  return objectCapturedPromiseRejectionMessages.has(value);
}

export function getFramePaths(frame: SentryStackFrame): string[] {
  return [frame.filename, frame.abs_path].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );
}

export function getRoutePathFromString(value: string): string | null {
  const candidate = value.trim();
  if (!candidate) {
    return null;
  }

  if (candidate.startsWith("/") && !candidate.startsWith("//")) {
    return candidate.split(/[?#]/, 1)[0] ?? null;
  }

  try {
    return new URL(candidate).pathname;
  } catch {
    return null;
  }
}

function isRoutePathAtOrBelow(path: string | null, routePath: string): boolean {
  return (
    path !== null && (path === routePath || path.startsWith(`${routePath}/`))
  );
}

function isExactRoutePath(path: string | null, routePath: string): boolean {
  return path !== null && (path === routePath || path === `${routePath}/`);
}

function isWavesRoutePath(path: string | null): boolean {
  return isRoutePathAtOrBelow(path, WAVES_ROUTE_PATH);
}

function hasMatchingRoute(
  event: SentryClientEvent,
  predicate: (path: string | null) => boolean
): boolean {
  const candidates = [
    event.transaction,
    getStringValue(event.tags?.["transaction"]),
    getStringValue(event.tags?.["url"]),
    event.request?.url,
  ];

  return candidates.some((candidate) =>
    candidate ? predicate(getRoutePathFromString(candidate)) : false
  );
}

export function hasWavesRoute(event: SentryClientEvent): boolean {
  return hasMatchingRoute(event, isWavesRoutePath);
}

export function isRouteParameterizationRoutePath(path: string | null): boolean {
  return (
    isWavesRoutePath(path) || isExactRoutePath(path, THE_MEMES_MINT_ROUTE_PATH)
  );
}

export function hasRouteParameterizationRoute(
  event: SentryClientEvent
): boolean {
  return hasMatchingRoute(event, isRouteParameterizationRoutePath);
}

export function hasReactDomRemoveChildRoute(event: SentryClientEvent): boolean {
  return hasMatchingRoute(event, isRouteParameterizationRoutePath);
}

export function getUrlCandidatesFromText(value: string): string[] {
  const urls: string[] = [];

  for (const candidate of getParenthesizedValues(value)) {
    if (candidate && isParenthesizedNetworkTargetUrl(candidate)) {
      urls.push(candidate);
    }
  }
  return urls;
}

function getParenthesizedValues(value: string): string[] {
  const values: string[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const openIndex = value.indexOf("(", cursor);
    if (openIndex === -1) {
      break;
    }

    const closeIndex = value.indexOf(")", openIndex + 1);
    if (closeIndex === -1) {
      break;
    }

    const candidate = value.slice(openIndex + 1, closeIndex).trim();
    if (candidate) {
      values.push(candidate);
    }

    cursor = closeIndex + 1;
  }

  return values;
}

function isParenthesizedNetworkTargetUrl(value: string): boolean {
  const candidate = value.trim();
  return candidate.startsWith("/") || /^https?:\/\//i.test(candidate);
}

export function isFilteredUrl(value: string | undefined): boolean {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  if (FILTERED_URL_TOKENS.has(normalized)) {
    return true;
  }

  const sanitizedPathToken =
    normalized.startsWith("/") && !normalized.startsWith("//")
      ? normalized.slice(1)
      : normalized;
  if (FILTERED_URL_TOKENS.has(sanitizedPathToken)) {
    return true;
  }

  try {
    return FILTERED_URL_TOKENS.has(decodeURIComponent(sanitizedPathToken));
  } catch {
    return false;
  }
}

function isUnknownPlaceholderToken(value: string): boolean {
  return value === "unknown" || value === "/unknown";
}

export function isUnknownPlaceholderUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (isUnknownPlaceholderToken(normalized)) {
    return true;
  }

  try {
    return isUnknownPlaceholderToken(
      decodeURIComponent(normalized).trim().toLowerCase()
    );
  } catch {
    return false;
  }
}

export function isRelativePath(value: string): boolean {
  const normalized = value.trim();
  return normalized.startsWith("/") && !normalized.startsWith("//");
}

export function parseAbsoluteRequestUrl(value: string | undefined): URL | null {
  if (!value || isFilteredUrl(value)) {
    return null;
  }

  const normalized = value.trim();
  try {
    if (normalized.startsWith("//")) {
      return new URL(`https:${normalized}`);
    }
    if (/^https?:\/\//i.test(normalized)) {
      return new URL(normalized);
    }
    return null;
  } catch {
    return null;
  }
}

export function getRequestPathname(value: string | undefined): string | null {
  if (!value || isFilteredUrl(value)) {
    return null;
  }

  const normalized = value.trim();
  if (isRelativePath(normalized)) {
    try {
      return new URL(normalized, "https://6529.io").pathname;
    } catch {
      return null;
    }
  }

  return parseAbsoluteRequestUrl(normalized)?.pathname ?? null;
}

export function getBreadcrumbMessages(event: SentryClientEvent): string[] {
  const breadcrumbs = getBreadcrumbValues(event);
  return breadcrumbs.flatMap((breadcrumb) => {
    const values: string[] = [];
    if (typeof breadcrumb.message === "string") {
      values.push(breadcrumb.message);
    }

    const args = breadcrumb.data?.["arguments"];
    if (Array.isArray(args)) {
      values.push(
        ...args.filter((value): value is string => typeof value === "string")
      );
    }

    return values;
  });
}

export function getBreadcrumbValues(
  event: SentryClientEvent
): SentryBreadcrumb[] {
  const breadcrumbs = event.breadcrumbs;
  if (Array.isArray(breadcrumbs)) {
    return breadcrumbs;
  }

  if (Array.isArray(breadcrumbs?.values)) {
    return breadcrumbs.values;
  }

  return [];
}

function getHintException(hint?: SentryEventHint): unknown {
  return hint?.originalException ?? hint?.syntheticException;
}

export function getSerializedObjectRejection(
  event: SentryClientEvent,
  hint?: SentryEventHint
): Record<string, unknown> | null {
  const serialized = event.extra?.["__serialized__"];
  if (isRecord(serialized)) {
    return serialized;
  }

  const hintException = getHintException(hint);
  return isRecord(hintException) ? hintException : null;
}

export function getHintExceptionMessage(hint?: SentryEventHint): string {
  const exception = getHintException(hint);
  if (typeof exception === "string") {
    return exception;
  }
  if (exception instanceof Error) {
    return exception.message;
  }
  return "";
}

export function normalizeErrorPrefix(value: string): string {
  const trimmedValue = value.trim();
  return trimmedValue.startsWith("Error: ")
    ? trimmedValue.slice("Error: ".length).trim()
    : trimmedValue;
}

export function getHintExceptionStack(hint?: SentryEventHint): string {
  const exception = getHintException(hint);
  if (exception instanceof Error && typeof exception.stack === "string") {
    return exception.stack;
  }
  if (isRecord(exception) && typeof exception["stack"] === "string") {
    return exception["stack"];
  }
  return "";
}

export function getSerializedExceptionStack(event: SentryClientEvent): string {
  const serialized = event.extra?.["__serialized__"];
  if (isRecord(serialized) && typeof serialized["stack"] === "string") {
    return serialized["stack"];
  }
  return "";
}

export function getContextString(
  event: SentryClientEvent,
  contextKey: string,
  valueKey: string
): string | undefined {
  const context = event.contexts?.[contextKey];
  if (!context) {
    return undefined;
  }

  const value = context[valueKey];
  return typeof value === "string" ? value : undefined;
}

export function getRequestHeaderString(
  event: SentryClientEvent,
  headerName: string
): string | undefined {
  const headers = event.request?.headers;
  if (!headers) {
    return undefined;
  }

  const normalizedHeaderName = headerName.toLowerCase();
  const matchingEntry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === normalizedHeaderName
  );
  const value = matchingEntry?.[1];
  return typeof value === "string" ? value : undefined;
}

export function getRuntimeUserAgentString(): string | undefined {
  try {
    const userAgent = globalThis.navigator?.userAgent;
    return typeof userAgent === "string" ? userAgent : undefined;
  } catch {
    return undefined;
  }
}

export function isFirstPartyHost(hostname: string): boolean {
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

export function isFirstPartyApiUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  if (isFirstPartyApiHost(hostname)) {
    return true;
  }

  return isFirstPartyHost(hostname) && url.pathname.startsWith("/api/");
}
