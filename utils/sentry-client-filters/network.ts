import {
  FNV_OFFSET_BASIS,
  FNV_PRIME,
  LOW_VALUE_NETWORK_ERROR_SAMPLE_RATE,
  noisyThirdPartyTelemetryNetworkPaths,
  noisyThirdPartyTelemetryTargets,
  UINT_32_SIZE,
  URL_IS_FIRST_PARTY_API_KEY,
  URL_IS_FIRST_PARTY_KEY,
} from "./constants";
import type {
  FailedBreadcrumbScanResult,
  LowValueNetworkErrorDecision,
  NetworkBreadcrumbFailureKind,
  NetworkTargetCandidate,
  SentryBreadcrumb,
  SentryClientEvent,
  SentryTransactionSpan,
} from "./types";
import {
  hasAppOwnedSourceStackValue,
  hasLikelyAppOwnedFrame,
} from "./app-frame-utils";
import {
  getBooleanValue,
  getBreadcrumbValues,
  getEventMessage,
  getNumericValue,
  getRequestPathname,
  getSerializedExceptionStack,
  getStringValue,
  getUrlCandidatesFromText,
  isFilteredUrl,
  isFirstPartyApiUrl,
  isFirstPartyHost,
  isNetworkErrorMessage,
  isRelativePath,
  isUnknownPlaceholderUrl,
  parseAbsoluteRequestUrl,
  uniqueStrings,
} from "./value-utils";

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
  return (
    isRelativePath(candidate.url) &&
    candidate.isFirstParty !== false &&
    candidate.isFirstPartyApi !== false
  );
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

export function isHttpBreadcrumb(breadcrumb: SentryBreadcrumb): boolean {
  return (
    breadcrumb.type === "http" ||
    breadcrumb.category === "fetch" ||
    breadcrumb.category === "xhr"
  );
}

function getHttpBreadcrumbs(event: SentryClientEvent): SentryBreadcrumb[] {
  return getBreadcrumbValues(event).filter(isHttpBreadcrumb);
}

function getBreadcrumbStatusCode(breadcrumb: SentryBreadcrumb): number | null {
  const data = breadcrumb.data;
  return (
    getNumericValue(data?.["status_code"]) ??
    getNumericValue(data?.["http.response.status_code"])
  );
}

function getBreadcrumbTransportStatusCode(
  breadcrumb: SentryBreadcrumb
): number | null {
  const statusCode = getBreadcrumbStatusCode(breadcrumb);
  if (statusCode !== null) {
    return statusCode;
  }

  if (breadcrumb.level === "error" && isHttpBreadcrumb(breadcrumb)) {
    return 0;
  }

  return null;
}

export function getBreadcrumbFailureKind(
  breadcrumb: SentryBreadcrumb
): NetworkBreadcrumbFailureKind | null {
  const statusCode = getBreadcrumbTransportStatusCode(breadcrumb);
  if (statusCode === 0) {
    return "transport";
  }

  if (statusCode !== null && statusCode >= 400) {
    return "http";
  }

  return null;
}

export function getBreadcrumbUrl(
  breadcrumb: SentryBreadcrumb
): string | undefined {
  return getStringValue(breadcrumb.data?.["url"]);
}

export function getBreadcrumbUrlIsFirstParty(
  breadcrumb: SentryBreadcrumb
): boolean | undefined {
  return getBooleanValue(breadcrumb.data?.[URL_IS_FIRST_PARTY_KEY]);
}

export function getBreadcrumbUrlIsFirstPartyApi(
  breadcrumb: SentryBreadcrumb
): boolean | undefined {
  return getBooleanValue(breadcrumb.data?.[URL_IS_FIRST_PARTY_API_KEY]);
}

function isUnknownBreadcrumbUrlPlaceholder(
  breadcrumb: SentryBreadcrumb
): boolean {
  const url = getBreadcrumbUrl(breadcrumb);
  if (!url) {
    return false;
  }

  return (
    getBreadcrumbUrlIsFirstParty(breadcrumb) === undefined &&
    getBreadcrumbUrlIsFirstPartyApi(breadcrumb) === undefined &&
    isUnknownPlaceholderUrl(url)
  );
}

function getBreadcrumbTargetCandidate(
  breadcrumb: SentryBreadcrumb
): NetworkTargetCandidate | null {
  const url = getBreadcrumbUrl(breadcrumb);
  if (
    !url ||
    isFilteredUrl(url) ||
    isUnknownBreadcrumbUrlPlaceholder(breadcrumb)
  ) {
    return null;
  }

  return {
    url,
    isFirstParty: getBreadcrumbUrlIsFirstParty(breadcrumb),
    isFirstPartyApi: getBreadcrumbUrlIsFirstPartyApi(breadcrumb),
  };
}

function getFailedTransportBreadcrumbTarget(
  breadcrumb: SentryBreadcrumb
): NetworkTargetCandidate {
  return {
    url: getBreadcrumbUrl(breadcrumb) ?? "",
    isFirstParty: getBreadcrumbUrlIsFirstParty(breadcrumb),
    isFirstPartyApi: getBreadcrumbUrlIsFirstPartyApi(breadcrumb),
    isPlaceholder: isUnknownBreadcrumbUrlPlaceholder(breadcrumb),
  };
}

function isPlaceholderOrFilteredTarget(
  candidate: NetworkTargetCandidate
): boolean {
  return candidate.isPlaceholder === true || isFilteredUrl(candidate.url);
}

function canUseFailedTransportForMessageTarget(
  failedTransportTarget: NetworkTargetCandidate,
  messageTargetCandidates: NetworkTargetCandidate[]
): boolean {
  if (isPlaceholderOrFilteredTarget(failedTransportTarget)) {
    if (failedTransportTarget.isFirstParty === false) {
      return false;
    }

    return messageTargetCandidates.some(isFilteredBreadcrumbFallbackApiTarget);
  }

  return messageTargetCandidates.some((target) =>
    isSameFirstPartyApiTarget(target, failedTransportTarget)
  );
}

function hasMessageTargetCandidates(
  messageTargetCandidates: NetworkTargetCandidate[]
): boolean {
  return messageTargetCandidates.length > 0;
}

function hasLaterSameRealFailureTarget(
  failedTransportTarget: NetworkTargetCandidate,
  laterRealFailureTargetCandidates: NetworkTargetCandidate[]
): boolean {
  return laterRealFailureTargetCandidates.some((target) =>
    isSameFirstPartyApiTarget(target, failedTransportTarget)
  );
}

function getHttpFailureScanResult(
  breadcrumb: SentryBreadcrumb,
  messageTargetCandidates: NetworkTargetCandidate[],
  laterRealFailureTargetCandidates: NetworkTargetCandidate[]
): FailedBreadcrumbScanResult {
  const failedHttpTarget = getBreadcrumbTargetCandidate(breadcrumb);
  if (!failedHttpTarget) {
    return getBreadcrumbUrlIsFirstParty(breadcrumb) === false
      ? { action: "continue" }
      : { action: "return", target: null };
  }

  const hasMessageTargets = hasMessageTargetCandidates(messageTargetCandidates);
  if (
    hasMessageTargets &&
    messageTargetCandidates.some((target) =>
      isSameFirstPartyApiTarget(target, failedHttpTarget)
    )
  ) {
    return { action: "return", target: null };
  }

  if (!hasMessageTargets) {
    laterRealFailureTargetCandidates.push(failedHttpTarget);
  }

  return { action: "continue" };
}

function getTransportFailureScanResult(
  breadcrumb: SentryBreadcrumb,
  messageTargetCandidates: NetworkTargetCandidate[],
  laterRealFailureTargetCandidates: NetworkTargetCandidate[]
): FailedBreadcrumbScanResult {
  const failedTransportTarget = getFailedTransportBreadcrumbTarget(breadcrumb);
  if (failedTransportTarget.isFirstParty === false) {
    return { action: "continue" };
  }

  const hasMessageTargets = hasMessageTargetCandidates(messageTargetCandidates);
  if (
    hasMessageTargets &&
    !canUseFailedTransportForMessageTarget(
      failedTransportTarget,
      messageTargetCandidates
    )
  ) {
    return { action: "continue" };
  }

  if (!hasMessageTargets && !isFirstPartyApiTarget(failedTransportTarget)) {
    return { action: "return", target: null };
  }

  if (
    !hasMessageTargets &&
    hasLaterSameRealFailureTarget(
      failedTransportTarget,
      laterRealFailureTargetCandidates
    )
  ) {
    return { action: "return", target: null };
  }

  return { action: "return", target: failedTransportTarget };
}

function getFailedBreadcrumbScanResult(
  breadcrumb: SentryBreadcrumb,
  messageTargetCandidates: NetworkTargetCandidate[],
  laterRealFailureTargetCandidates: NetworkTargetCandidate[]
): FailedBreadcrumbScanResult {
  const failureKind = getBreadcrumbFailureKind(breadcrumb);
  if (failureKind === "http") {
    return getHttpFailureScanResult(
      breadcrumb,
      messageTargetCandidates,
      laterRealFailureTargetCandidates
    );
  }

  if (failureKind === "transport") {
    return getTransportFailureScanResult(
      breadcrumb,
      messageTargetCandidates,
      laterRealFailureTargetCandidates
    );
  }

  return { action: "continue" };
}

function getLatestFailedTransportBreadcrumb(
  event: SentryClientEvent
): NetworkTargetCandidate | null {
  const breadcrumbs = getHttpBreadcrumbs(event);
  const messageTargetCandidates = getMessageTargetCandidates(event);
  const laterRealFailureTargetCandidates: NetworkTargetCandidate[] = [];

  for (let index = breadcrumbs.length - 1; index >= 0; index -= 1) {
    const breadcrumb = breadcrumbs[index];
    if (!breadcrumb) {
      continue;
    }

    const scanResult = getFailedBreadcrumbScanResult(
      breadcrumb,
      messageTargetCandidates,
      laterRealFailureTargetCandidates
    );
    if (scanResult.action === "return") {
      return scanResult.target;
    }
  }

  return null;
}

export function getLowValueNetworkErrorTargetUrl(
  event: SentryClientEvent
): string | null {
  const latestBreadcrumb = getLatestFailedTransportBreadcrumb(event);
  if (!latestBreadcrumb) {
    return null;
  }

  const messageTargetCandidates = getMessageTargetCandidates(event);
  if (isPlaceholderOrFilteredTarget(latestBreadcrumb)) {
    return (
      messageTargetCandidates.find(isFilteredBreadcrumbFallbackApiTarget)
        ?.url ?? null
    );
  }

  if (messageTargetCandidates.length === 0) {
    return isFirstPartyApiTarget(latestBreadcrumb)
      ? latestBreadcrumb.url
      : null;
  }

  return (
    messageTargetCandidates.find((target) =>
      isSameFirstPartyApiTarget(target, latestBreadcrumb)
    )?.url ?? null
  );
}

function getUsableBreadcrumbMessageUrl(
  breadcrumb: SentryBreadcrumb
): string | null {
  const url = getBreadcrumbUrl(breadcrumb)?.trim();
  if (
    !url ||
    isFilteredUrl(url) ||
    isUnknownBreadcrumbUrlPlaceholder(breadcrumb)
  ) {
    return null;
  }

  return url;
}

function getLatestUsableBreadcrumbMessageUrl(
  event: SentryClientEvent,
  predicate: (breadcrumb: SentryBreadcrumb) => boolean
): string | null {
  const breadcrumbs = getHttpBreadcrumbs(event);

  for (let index = breadcrumbs.length - 1; index >= 0; index -= 1) {
    const breadcrumb = breadcrumbs[index];
    if (!breadcrumb || !predicate(breadcrumb)) {
      continue;
    }

    const url = getUsableBreadcrumbMessageUrl(breadcrumb);
    if (url) {
      return url;
    }
  }

  return null;
}

export function getNetworkErrorMessageTargetUrl(
  event: SentryClientEvent
): string | null {
  const lowValueTargetUrl = getLowValueNetworkErrorTargetUrl(event)?.trim();
  if (lowValueTargetUrl && !isFilteredUrl(lowValueTargetUrl)) {
    return lowValueTargetUrl;
  }

  return (
    getLatestUsableBreadcrumbMessageUrl(
      event,
      (breadcrumb) => getBreadcrumbFailureKind(breadcrumb) === "transport"
    ) ??
    getLatestUsableBreadcrumbMessageUrl(
      event,
      (breadcrumb) => getBreadcrumbFailureKind(breadcrumb) === "http"
    )
  );
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

function hasMatchingFailedTransportBreadcrumb(
  event: SentryClientEvent
): boolean {
  return getLowValueNetworkErrorTargetUrl(event) !== null;
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

function isNoisyThirdPartyTelemetryNetworkTarget(value: string): boolean {
  const absoluteUrl = parseAbsoluteRequestUrl(value);
  if (absoluteUrl) {
    return noisyThirdPartyTelemetryTargets.has(
      `${absoluteUrl.hostname.toLowerCase()}${absoluteUrl.pathname}`
    );
  }

  const pathname = getRequestPathname(value);
  return (
    pathname !== null && noisyThirdPartyTelemetryNetworkPaths.has(pathname)
  );
}

function hasThirdPartyTelemetryNetworkMessageTarget(
  event: SentryClientEvent
): boolean {
  return getMessageTargetCandidates(event).some((candidate) =>
    isNoisyThirdPartyTelemetryNetworkTarget(candidate.url)
  );
}

function hasAppOwnedNetworkErrorEvidence(event: SentryClientEvent): boolean {
  const frames = event.exception?.values?.[0]?.stacktrace?.frames;
  return (
    hasLikelyAppOwnedFrame(frames) ||
    hasAppOwnedSourceStackValue(getSerializedExceptionStack(event))
  );
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

export function shouldFilterThirdPartyTelemetryNetworkError(
  event: SentryClientEvent
): boolean {
  const message = getEventMessage(event);
  if (!isNetworkErrorMessage(message)) {
    return false;
  }

  if (!hasThirdPartyTelemetryNetworkMessageTarget(event)) {
    return false;
  }

  return !hasAppOwnedNetworkErrorEvidence(event);
}
