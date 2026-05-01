export type SentryStackFrame = {
  filename?: string | undefined;
  abs_path?: string | undefined;
};

export type SentryTransactionSpan = {
  op?: string | undefined;
  description?: string | undefined;
  data?: Record<string, unknown> | undefined;
};

type SentryContext = Record<string, unknown>;

type SentryBreadcrumb = {
  type?: string | undefined;
  category?: string | undefined;
  message?: string | undefined;
  data?: Record<string, unknown> | undefined;
};

type NetworkTargetCandidate = {
  url: string;
  isFirstParty?: boolean | undefined;
  isFirstPartyApi?: boolean | undefined;
};

type SentryExceptionValue = {
  type?: string | undefined;
  value?: string | undefined;
  stacktrace?:
    | {
        frames?: SentryStackFrame[] | undefined;
      }
    | undefined;
};

type SentryTags = Record<string, unknown>;

export type SentryClientEvent = {
  event_id?: string | undefined;
  message?: string | undefined;
  exception?:
    | {
        values?: SentryExceptionValue[] | undefined;
      }
    | undefined;
  contexts?: Record<string, SentryContext | undefined> | undefined;
  tags?: SentryTags | undefined;
  breadcrumbs?:
    | SentryBreadcrumb[]
    | {
        values?: SentryBreadcrumb[] | undefined;
      }
    | undefined;
};

export type SentryEventHint = {
  originalException?: unknown;
  syntheticException?: unknown;
};

export type LowValueNetworkErrorDecision =
  | "not_applicable"
  | "drop"
  | "keep_sampled";

const filenameExceptions = [
  "inpage.js",
  "extensionServiceWorker.js",
  "extensionPageScript.js",
  "injectLeap.js",
  "inject.chrome",
];
const injectedAppUriPath = "app:///injected/injected.js";
const walletCollisionPatterns = [
  "tronlinkparams",
  "cannot set property ethereum of #<window> which has only a getter",
  "cannot assign to read only property 'ethereum'",
  'cannot assign to read only property "ethereum"',
  "cannot redefine property: ethereum",
];
const noisyThirdPartyTelemetryTargets = new Set([
  "cca-lite.coinbase.com/amp",
  "cca-lite.coinbase.com/metrics",
  "region1.google-analytics.com/g/collect",
]);
export const LOW_VALUE_NETWORK_ERROR_SAMPLE_RATE = 0.1;

const URL_IN_PARENS_PATTERN = /\(([^)]+)\)/g;
const URL_IS_FIRST_PARTY_KEY = "url.is_first_party";
const URL_IS_FIRST_PARTY_API_KEY = "url.is_first_party_api";
const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;
const UINT_32_SIZE = 4294967296;
const FILTERED_URL_TOKENS = new Set(["[filtered]", "[redacted]", "filtered"]);

function getStringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getBooleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function getNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function isNetworkErrorMessage(value: string): boolean {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("failed to fetch") ||
    normalized.includes("load failed") ||
    normalized.includes("networkerror") ||
    normalized.includes("network error") ||
    normalized.includes("network request failed")
  );
}

function getEventMessage(event: SentryClientEvent): string {
  const exceptionValue = event.exception?.values?.[0]?.value;
  if (typeof exceptionValue === "string" && exceptionValue) {
    return exceptionValue;
  }

  return typeof event.message === "string" ? event.message : "";
}

function getUrlCandidatesFromText(value: string): string[] {
  const urls: string[] = [];
  for (const match of value.matchAll(URL_IN_PARENS_PATTERN)) {
    const candidate = match[1]?.trim();
    if (candidate) {
      urls.push(candidate);
    }
  }
  return urls;
}

function isFilteredUrl(value: string | undefined): boolean {
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

function isRelativePath(value: string): boolean {
  const normalized = value.trim();
  return normalized.startsWith("/") && !normalized.startsWith("//");
}

function parseAbsoluteRequestUrl(value: string | undefined): URL | null {
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

function getRequestPathname(value: string | undefined): string | null {
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

function isFirstPartyApiUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  if (hostname === "api.6529.io") {
    return true;
  }

  return isFirstPartyHost(hostname) && url.pathname.startsWith("/api/");
}

function isFirstPartyApiTarget(candidate: NetworkTargetCandidate): boolean {
  if (candidate.isFirstPartyApi === true) {
    return true;
  }

  const url = parseAbsoluteRequestUrl(candidate.url);
  if (url) {
    return isFirstPartyApiUrl(url);
  }

  const pathname = getRequestPathname(candidate.url);
  return (
    candidate.isFirstParty === true &&
    !!pathname &&
    pathname.startsWith("/api/")
  );
}

function canUseAsSanitizedRelativePath(
  candidate: NetworkTargetCandidate
): boolean {
  return isRelativePath(candidate.url) && candidate.isFirstParty !== false;
}

function hasExplicitThirdPartyRelativeOrigin(
  candidate: NetworkTargetCandidate
): boolean {
  return isRelativePath(candidate.url) && candidate.isFirstParty === false;
}

function isSameFirstPartyApiTarget(
  left: NetworkTargetCandidate,
  right: NetworkTargetCandidate
): boolean {
  if (
    hasExplicitThirdPartyRelativeOrigin(left) ||
    hasExplicitThirdPartyRelativeOrigin(right)
  ) {
    return false;
  }

  const leftPathname = getRequestPathname(left.url);
  const rightPathname = getRequestPathname(right.url);
  if (!leftPathname || !rightPathname || leftPathname !== rightPathname) {
    return false;
  }

  const leftIsFirstPartyApi = isFirstPartyApiTarget(left);
  const rightIsFirstPartyApi = isFirstPartyApiTarget(right);

  if (leftIsFirstPartyApi && rightIsFirstPartyApi) {
    return true;
  }

  return (
    (leftIsFirstPartyApi && canUseAsSanitizedRelativePath(right)) ||
    (rightIsFirstPartyApi && canUseAsSanitizedRelativePath(left))
  );
}

function isFilteredBreadcrumbFallbackApiTarget(
  candidate: NetworkTargetCandidate
): boolean {
  if (candidate.isFirstParty === false || isFilteredUrl(candidate.url)) {
    return false;
  }

  const normalizedUrl = candidate.url.trim();
  if (normalizedUrl.startsWith("//")) {
    return false;
  }

  const absoluteUrl = parseAbsoluteRequestUrl(normalizedUrl);
  if (absoluteUrl) {
    return isFirstPartyApiUrl(absoluteUrl);
  }

  const pathname = getRequestPathname(normalizedUrl);
  return (
    isRelativePath(normalizedUrl) && !!pathname && pathname.startsWith("/api/")
  );
}

function getHttpBreadcrumbs(event: SentryClientEvent): SentryBreadcrumb[] {
  return getBreadcrumbValues(event).filter(
    (breadcrumb) =>
      breadcrumb.type === "http" ||
      breadcrumb.category === "fetch" ||
      breadcrumb.category === "xhr"
  );
}

function getBreadcrumbStatusCode(breadcrumb: SentryBreadcrumb): number | null {
  const data = breadcrumb.data;
  return (
    getNumericValue(data?.["status_code"]) ??
    getNumericValue(data?.["http.response.status_code"])
  );
}

function getBreadcrumbUrl(breadcrumb: SentryBreadcrumb): string | undefined {
  return getStringValue(breadcrumb.data?.["url"]);
}

function getBreadcrumbUrlIsFirstParty(
  breadcrumb: SentryBreadcrumb
): boolean | undefined {
  return getBooleanValue(breadcrumb.data?.[URL_IS_FIRST_PARTY_KEY]);
}

function getBreadcrumbUrlIsFirstPartyApi(
  breadcrumb: SentryBreadcrumb
): boolean | undefined {
  return getBooleanValue(breadcrumb.data?.[URL_IS_FIRST_PARTY_API_KEY]);
}

function getBreadcrumbTargetCandidate(
  breadcrumb: SentryBreadcrumb
): NetworkTargetCandidate | null {
  const url = getBreadcrumbUrl(breadcrumb);
  if (!url || isFilteredUrl(url)) {
    return null;
  }

  return {
    url,
    isFirstParty: getBreadcrumbUrlIsFirstParty(breadcrumb),
    isFirstPartyApi: getBreadcrumbUrlIsFirstPartyApi(breadcrumb),
  };
}

function getLatestHttpBreadcrumbWithStatus(
  event: SentryClientEvent
): (NetworkTargetCandidate & { statusCode: number }) | null {
  const breadcrumbs = getHttpBreadcrumbs(event);
  for (let index = breadcrumbs.length - 1; index >= 0; index -= 1) {
    const breadcrumb = breadcrumbs[index];
    if (!breadcrumb) {
      continue;
    }

    const statusCode = getBreadcrumbStatusCode(breadcrumb);
    if (statusCode === null) {
      continue;
    }

    return {
      url: getBreadcrumbUrl(breadcrumb) ?? "",
      isFirstParty: getBreadcrumbUrlIsFirstParty(breadcrumb),
      isFirstPartyApi: getBreadcrumbUrlIsFirstPartyApi(breadcrumb),
      statusCode,
    };
  }

  return null;
}

function getMessageTargetCandidates(
  event: SentryClientEvent
): NetworkTargetCandidate[] {
  return getUrlCandidatesFromText(getEventMessage(event)).map((url) => ({
    url,
  }));
}

function getBreadcrumbTargetCandidates(
  event: SentryClientEvent
): NetworkTargetCandidate[] {
  return getHttpBreadcrumbs(event)
    .map(getBreadcrumbTargetCandidate)
    .filter((value): value is NetworkTargetCandidate => value !== null);
}

function getNetworkTargetCandidates(
  event: SentryClientEvent
): NetworkTargetCandidate[] {
  return [
    ...getMessageTargetCandidates(event),
    ...getBreadcrumbTargetCandidates(event),
  ];
}

function getNetworkTargetUrlCandidates(event: SentryClientEvent): string[] {
  return uniqueStrings(
    getNetworkTargetCandidates(event).map((candidate) => candidate.url)
  );
}

function getPrimaryNetworkTargetCandidates(
  event: SentryClientEvent
): NetworkTargetCandidate[] {
  const messageCandidates = getMessageTargetCandidates(event);
  return messageCandidates.length > 0
    ? messageCandidates
    : getNetworkTargetCandidates(event);
}

function hasMatchingFailedTransportBreadcrumb(
  event: SentryClientEvent
): boolean {
  const latestBreadcrumb = getLatestHttpBreadcrumbWithStatus(event);
  if (latestBreadcrumb?.statusCode !== 0) {
    return false;
  }

  if (isFilteredUrl(latestBreadcrumb.url)) {
    if (latestBreadcrumb.isFirstParty === false) {
      return false;
    }

    return getMessageTargetCandidates(event).some(
      isFilteredBreadcrumbFallbackApiTarget
    );
  }

  return getPrimaryNetworkTargetCandidates(event).some((target) =>
    isSameFirstPartyApiTarget(
      target,
      latestBreadcrumb as NetworkTargetCandidate
    )
  );
}

function isLowValueFirstPartyNetworkError(event: SentryClientEvent): boolean {
  if (event.tags?.["errorType"] !== "network") {
    return false;
  }

  const message = getEventMessage(event);
  if (!isNetworkErrorMessage(message)) {
    return false;
  }

  return hasMatchingFailedTransportBreadcrumb(event);
}

function normalizeSampleRate(sampleRate: number): number {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    return 0;
  }

  return sampleRate >= 1 ? 1 : sampleRate;
}

function stableHashToUnitInterval(value: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return (hash >>> 0) / UINT_32_SIZE;
}

function getLowValueNetworkSamplingKey(event: SentryClientEvent): string {
  const eventId = getStringValue(event.event_id);
  if (eventId) {
    return eventId;
  }

  return `${getEventMessage(event)}|${getNetworkTargetUrlCandidates(event).join(
    "|"
  )}`;
}

export function getLowValueNetworkErrorDecision(
  event: SentryClientEvent,
  sampleRate: number = LOW_VALUE_NETWORK_ERROR_SAMPLE_RATE
): LowValueNetworkErrorDecision {
  if (!isLowValueFirstPartyNetworkError(event)) {
    return "not_applicable";
  }

  const normalizedSampleRate = normalizeSampleRate(sampleRate);
  if (normalizedSampleRate <= 0) {
    return "drop";
  }

  if (normalizedSampleRate >= 1) {
    return "keep_sampled";
  }

  return stableHashToUnitInterval(getLowValueNetworkSamplingKey(event)) <
    normalizedSampleRate
    ? "keep_sampled"
    : "drop";
}

export function tagSampledLowValueNetworkError(event: SentryClientEvent): void {
  event.tags = {
    ...event.tags,
    network_failure_kind: "browser_transport",
    network_noise_sampled: "true",
  };
}

function shouldFilterFilenameExceptions(
  frames: SentryStackFrame[] | undefined
): boolean {
  if (!frames) {
    return false;
  }
  return frames.some((frame) =>
    filenameExceptions.some(
      (pattern) =>
        (frame.filename?.includes(pattern) ?? false) ||
        (frame.abs_path?.includes(pattern) ?? false)
    )
  );
}

function shouldFilterExceptionStack(hint?: SentryEventHint): boolean {
  const exception = hint?.originalException ?? hint?.syntheticException;
  if (!(exception instanceof Error)) {
    return false;
  }
  const stack = exception.stack;
  if (typeof stack !== "string") {
    return false;
  }
  return filenameExceptions.some((pattern) => stack.includes(pattern));
}

function isAppUriFrame(frame: SentryStackFrame): boolean {
  return [frame.filename, frame.abs_path].some(
    (path) => typeof path === "string" && path.startsWith("app:///")
  );
}

function isInjectedAppUriFrame(frame: SentryStackFrame): boolean {
  return [frame.filename, frame.abs_path].some(
    (path) => typeof path === "string" && path.includes(injectedAppUriPath)
  );
}

function hasOnlyAppUriFrames(frames: SentryStackFrame[] | undefined): boolean {
  return (
    Array.isArray(frames) && frames.length > 0 && frames.every(isAppUriFrame)
  );
}

function hasInjectedAppUriFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return Array.isArray(frames) && frames.some(isInjectedAppUriFrame);
}

function getHintException(hint?: SentryEventHint): unknown {
  return hint?.originalException ?? hint?.syntheticException;
}

function getHintExceptionMessage(hint?: SentryEventHint): string {
  const exception = getHintException(hint);
  if (typeof exception === "string") {
    return exception;
  }
  if (exception instanceof Error) {
    return exception.message;
  }
  return "";
}

function getHintExceptionStack(hint?: SentryEventHint): string {
  const exception = getHintException(hint);
  if (exception instanceof Error && typeof exception.stack === "string") {
    return exception.stack;
  }
  return "";
}

function matchesWalletCollisionPattern(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  return walletCollisionPatterns.some((pattern) =>
    normalizedValue.includes(pattern)
  );
}

function getBreadcrumbMessages(event: SentryClientEvent): string[] {
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

function getBreadcrumbValues(event: SentryClientEvent): SentryBreadcrumb[] {
  const breadcrumbs = event.breadcrumbs;
  if (Array.isArray(breadcrumbs)) {
    return breadcrumbs;
  }

  if (Array.isArray(breadcrumbs?.values)) {
    return breadcrumbs.values;
  }

  return [];
}

function getContextString(
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

function isFirstPartyHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === "6529.io" || normalized.endsWith(".6529.io");
}

function getSpanUrlString(span: SentryTransactionSpan): string | undefined {
  const data = span.data;
  const urlCandidates = [
    getStringValue(data?.["http.url"]),
    getStringValue(data?.["url"]),
  ];

  for (const candidate of urlCandidates) {
    if (candidate) {
      return candidate;
    }
  }

  const description = span.description?.trim();
  if (!description) {
    return undefined;
  }

  const strippedDescription = description.replace(/^[A-Z]+\s+/, "");
  return strippedDescription.startsWith("http://") ||
    strippedDescription.startsWith("https://")
    ? strippedDescription
    : undefined;
}

function getSpanUrl(span: SentryTransactionSpan): URL | null {
  const urlString = getSpanUrlString(span);
  if (!urlString) {
    return null;
  }

  try {
    return new URL(urlString);
  } catch {
    return null;
  }
}

function isCrossOriginSpan(
  span: SentryTransactionSpan,
  url: URL | null
): boolean {
  const sameOrigin = span.data?.["url.same_origin"];
  if (typeof sameOrigin === "boolean") {
    return !sameOrigin;
  }

  if (!url) {
    return false;
  }

  return !isFirstPartyHost(url.hostname);
}

function getSpanStatusCode(span: SentryTransactionSpan): number | null {
  const data = span.data;
  return (
    getNumericValue(data?.["http.response.status_code"]) ??
    getNumericValue(data?.["status_code"])
  );
}

function getSpanTransferSize(span: SentryTransactionSpan): number | null {
  const data = span.data;
  return (
    getNumericValue(data?.["http.response_transfer_size"]) ??
    getNumericValue(data?.["http.response.transfer_size"])
  );
}

export function getThirdPartyTelemetrySpanTargetKey(
  span: SentryTransactionSpan
): string | null {
  const url = getSpanUrl(span);
  if (!url) {
    return null;
  }

  return `${url.hostname.toLowerCase()}${url.pathname}`;
}

export function shouldFilterThirdPartyTelemetrySpan(
  span: SentryTransactionSpan
): boolean {
  const targetKey = getThirdPartyTelemetrySpanTargetKey(span);
  if (!targetKey || !noisyThirdPartyTelemetryTargets.has(targetKey)) {
    return false;
  }

  const url = getSpanUrl(span);
  if (!isCrossOriginSpan(span, url)) {
    return false;
  }

  const statusCode = getSpanStatusCode(span);
  if (span.op === "http.client") {
    return statusCode === 0;
  }

  if (span.op === "resource.beacon") {
    return statusCode === 0 && getSpanTransferSize(span) === 0;
  }

  return false;
}

function hasInjectedAppUriSignature(
  frames: SentryStackFrame[] | undefined,
  hint?: SentryEventHint
): boolean {
  const hasOnlyInjectedFrames =
    hasOnlyAppUriFrames(frames) && hasInjectedAppUriFrame(frames);
  if (hasOnlyInjectedFrames) {
    return true;
  }

  const stack = getHintExceptionStack(hint);
  if (!stack.includes(injectedAppUriPath)) {
    return false;
  }

  if (!Array.isArray(frames) || frames.length === 0) {
    return true;
  }

  return hasOnlyAppUriFrames(frames);
}

function hasWalletCollisionSignature(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const value = event.exception?.values?.[0];
  const candidates = [
    value?.value,
    getHintExceptionMessage(hint),
    getHintExceptionStack(hint),
    ...getBreadcrumbMessages(event),
  ];

  return candidates.some(
    (candidate) =>
      typeof candidate === "string" && matchesWalletCollisionPattern(candidate)
  );
}

function isTwitterBrowser(event: SentryClientEvent): boolean {
  const contextBrowserName = getContextString(event, "browser", "name");
  if (contextBrowserName === "Twitter") {
    return true;
  }

  const browserNameTag = event.tags?.["browser.name"];
  if (browserNameTag === "Twitter") {
    return true;
  }

  const browserTag = event.tags?.["browser"];
  return typeof browserTag === "string" && browserTag.startsWith("Twitter");
}

export function shouldFilterByFilenameExceptions(
  frames: SentryStackFrame[] | undefined,
  hint?: SentryEventHint
): boolean {
  return (
    shouldFilterFilenameExceptions(frames) || shouldFilterExceptionStack(hint)
  );
}

export function shouldFilterTwitterConfigReferenceError(
  event: SentryClientEvent
): boolean {
  const value = event.exception?.values?.[0];
  if (value?.type !== "ReferenceError") {
    return false;
  }

  if (value.value !== "Can't find variable: CONFIG") {
    return false;
  }

  if (!isTwitterBrowser(event)) {
    return false;
  }

  return hasOnlyAppUriFrames(value.stacktrace?.frames);
}

export function shouldFilterInjectedWalletCollision(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const frames = event.exception?.values?.[0]?.stacktrace?.frames;
  if (!hasInjectedAppUriSignature(frames, hint)) {
    return false;
  }

  return hasWalletCollisionSignature(event, hint);
}

export const __testing = {
  filenameExceptions,
  hasOnlyAppUriFrames,
  hasInjectedAppUriFrame,
  isTwitterBrowser,
  matchesWalletCollisionPattern,
  noisyThirdPartyTelemetryTargets,
  shouldFilterThirdPartyTelemetrySpan,
};
