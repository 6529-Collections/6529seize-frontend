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
  category?: string | undefined;
  message?: string | undefined;
  data?: Record<string, unknown> | undefined;
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

function getStringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
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

function shouldFilterFilenameExceptions(
  frames: SentryStackFrame[] | undefined
): boolean {
  if (!frames) {
    return false;
  }
  return frames.some((frame) =>
    filenameExceptions.some(
      (pattern) =>
        frame.filename?.includes(pattern) || frame.abs_path?.includes(pattern)
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
