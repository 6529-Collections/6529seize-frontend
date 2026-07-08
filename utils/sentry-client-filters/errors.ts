import {
  browserUnhandledRejectionMechanism,
  filenameExceptions,
  gifPickerTenorFailureMessage,
  gifPickerTenorUndefinedTagsMessage,
  metaMaskMobileContextTokens,
  mobileSafariWebViewContextTokens,
  REACT_DOM_INSERT_BEFORE_NOT_FOUND_ERROR_MESSAGE,
  REACT_DOM_REMOVE_CHILD_NOT_FOUND_ERROR_MESSAGE,
  sentryRouteParameterizationMechanismType,
  sentryRouteParameterizationMessage,
  tenorCategoriesPath,
  webViewUserAgentTokens,
  routeParameterizationContextKeys,
  routeParameterizationTagKeys,
} from "./constants";
import type {
  SentryClientEvent,
  SentryEventHint,
  SentryStackFrame,
} from "./types";
import {
  getBreadcrumbMessages,
  getBreadcrumbValues,
  getContextString,
  getHintExceptionMessage,
  getRequestHeaderString,
  getRequestPathname,
  getRoutePathFromString,
  getRuntimeUserAgentString,
  getStringValue,
  hasReactDomRemoveChildRoute,
  hasRouteParameterizationRoute,
  hasWavesRoute,
  isRecord,
  isRouteParameterizationRoutePath,
  uniqueStrings,
} from "./value-utils";
import {
  getBreadcrumbFailureKind,
  getBreadcrumbUrl,
  getBreadcrumbUrlIsFirstParty,
  getBreadcrumbUrlIsFirstPartyApi,
  isHttpBreadcrumb,
} from "./network";
import {
  getStackSignatureValues,
  hasAppOwnedNonExtensionSignature,
  hasAppOwnedSourceEvidence,
  hasAppOwnedFrame,
  hasGifPickerTenorManagerFrame,
  hasInjectedWasmCspFrameSignature,
  hasLikelyAppOwnedFrame,
  hasNativeJsonStringifyFrame,
  hasOnlyAppUriFrames,
  hasReactDomNotFoundErrorSignature,
  hasSentryRouteParameterizationFrame,
} from "./app-frame-utils";

const sentryBrowserPathTokens = ["@sentry/browser", "@sentry+browser"];

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

function hasGifPickerTenorFailureBreadcrumb(event: SentryClientEvent): boolean {
  return getBreadcrumbMessages(event).some((message) =>
    message.includes(gifPickerTenorFailureMessage)
  );
}

function isTenorCategoriesPath(value: string | undefined): boolean {
  if (getRequestPathname(value) === tenorCategoriesPath) {
    return true;
  }

  return typeof value === "string" && value.includes(tenorCategoriesPath);
}

function hasTenorCategoriesRequestBreadcrumb(
  event: SentryClientEvent
): boolean {
  return getBreadcrumbValues(event).some((breadcrumb) => {
    if (!isHttpBreadcrumb(breadcrumb)) {
      return false;
    }

    if (
      getBreadcrumbUrlIsFirstParty(breadcrumb) !== false ||
      getBreadcrumbUrlIsFirstPartyApi(breadcrumb) !== false
    ) {
      return false;
    }

    if (getBreadcrumbFailureKind(breadcrumb) === null) {
      return false;
    }

    return (
      isTenorCategoriesPath(getBreadcrumbUrl(breadcrumb)) ||
      isTenorCategoriesPath(breadcrumb.message)
    );
  });
}

function hasGifPickerTenorBreadcrumbSignature(
  event: SentryClientEvent
): boolean {
  return (
    hasGifPickerTenorFailureBreadcrumb(event) &&
    hasTenorCategoriesRequestBreadcrumb(event)
  );
}

function hasRouteParameterizationNavigationBreadcrumb(
  event: SentryClientEvent
): boolean {
  return getBreadcrumbValues(event).some((breadcrumb) => {
    const data = breadcrumb.data;
    if (breadcrumb.category !== "navigation" || !data) {
      return false;
    }

    if (typeof data["from"] !== "string" || typeof data["to"] !== "string") {
      return false;
    }

    return [data["from"], data["to"]].some((candidate) =>
      isRouteParameterizationRoutePath(getRoutePathFromString(candidate))
    );
  });
}

export function hasRouteParameterizationRouteEvidence(
  event: SentryClientEvent
): boolean {
  return (
    hasRouteParameterizationRoute(event) ||
    hasRouteParameterizationNavigationBreadcrumb(event)
  );
}

function getRouteParameterizationContextValues(
  event: SentryClientEvent
): string[] {
  const contextValues = routeParameterizationContextKeys.flatMap((key) => {
    const context = event.contexts?.[key];
    return isRecord(context) ? Object.values(context) : [];
  });
  const tagValues = routeParameterizationTagKeys.map(
    (key) => event.tags?.[key]
  );

  return uniqueStrings(
    [...contextValues, ...tagValues].filter(
      (value): value is string => typeof value === "string" && value.length > 0
    )
  );
}

function getRouteParameterizationUserAgentValues(
  event: SentryClientEvent
): string[] {
  const candidates = [
    getRequestHeaderString(event, "user-agent"),
    getStringValue(event.tags?.["user_agent"]),
    getStringValue(event.tags?.["userAgent"]),
    getRuntimeUserAgentString(),
  ];

  return candidates.filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );
}

function matchesContextToken(value: string, tokens: string[]): boolean {
  const normalized = value.toLowerCase();
  return tokens.some((token) => normalized.includes(token));
}

export function hasMetaMaskMobileWebViewContext(
  event: SentryClientEvent
): boolean {
  const contextValues = getRouteParameterizationContextValues(event);
  const userAgentValues = getRouteParameterizationUserAgentValues(event);
  const values = [...contextValues, ...userAgentValues];

  return (
    values.some((value) =>
      matchesContextToken(value, metaMaskMobileContextTokens)
    ) &&
    values.some(
      (value) =>
        matchesContextToken(value, mobileSafariWebViewContextTokens) ||
        matchesContextToken(value, webViewUserAgentTokens)
    )
  );
}

function matchesWasmCspUnsafeEvalMessage(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  return (
    (normalizedValue.includes("webassembly.instantiate") ||
      normalizedValue.includes("webassembly.module")) &&
    (normalizedValue.includes("content security") ||
      /\bcsp\b/.test(normalizedValue)) &&
    normalizedValue.includes("unsafe-eval")
  );
}

function hasWasmCspUnsafeEvalMessage(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const value = event.exception?.values?.[0];
  const candidates = [
    value?.value,
    event.message,
    getHintExceptionMessage(hint),
  ];

  return candidates.some(
    (candidate) =>
      typeof candidate === "string" &&
      matchesWasmCspUnsafeEvalMessage(candidate)
  );
}

function matchesAnonymousUnsafeEvalCspMessage(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  return (
    normalizedValue.includes("refused to evaluate a string as javascript") &&
    normalizedValue.includes("unsafe-eval") &&
    normalizedValue.includes("content security policy") &&
    normalizedValue.includes("script-src")
  );
}

function hasAnonymousUnsafeEvalCspMessage(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const value = event.exception?.values?.[0];
  const candidates = [
    value?.value,
    event.message,
    getHintExceptionMessage(hint),
  ];

  return candidates.some(
    (candidate) =>
      typeof candidate === "string" &&
      matchesAnonymousUnsafeEvalCspMessage(candidate)
  );
}

function isAnonymousUnsafeEvalCspFrame(frame: SentryStackFrame): boolean {
  const paths = [frame.filename, frame.abs_path].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );

  if (paths.length === 0) {
    return frame.function?.trim() === "eval";
  }

  return paths.every((path) => {
    const normalizedPath = path.toLowerCase().trim();
    return (
      normalizedPath.startsWith("<anonymous>") ||
      sentryBrowserPathTokens.some((token) => normalizedPath.includes(token))
    );
  });
}

function hasAnonymousUnsafeEvalCspFrameSignature(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.length > 0 &&
    frames.some((frame) => frame.function?.trim() === "eval") &&
    frames.every(isAnonymousUnsafeEvalCspFrame)
  );
}

function hasAnonymousUnsafeEvalCspAppEvidence(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const value = event.exception?.values?.[0];
  const frames = value?.stacktrace?.frames;

  if (
    hasAppOwnedNonExtensionSignature(frames, hint) ||
    hasAppOwnedSourceEvidence(event, value, hint)
  ) {
    return true;
  }

  return getStackSignatureValues(frames, hint).some((candidate) => {
    const normalizedCandidate = candidate.toLowerCase();
    return (
      normalizedCandidate.includes("/_next/static/") ||
      normalizedCandidate.includes("webpack-internal:///(app-")
    );
  });
}

export function isTwitterBrowser(event: SentryClientEvent): boolean {
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

export function shouldFilterReactDomInsertBeforeNotFoundError(
  event: SentryClientEvent
): boolean {
  if (!hasWavesRoute(event)) {
    return false;
  }

  return hasReactDomNotFoundErrorSignature(
    event,
    REACT_DOM_INSERT_BEFORE_NOT_FOUND_ERROR_MESSAGE
  );
}

export function shouldFilterReactDomRemoveChildNotFoundError(
  event: SentryClientEvent
): boolean {
  if (!hasReactDomRemoveChildRoute(event)) {
    return false;
  }

  return hasReactDomNotFoundErrorSignature(
    event,
    REACT_DOM_REMOVE_CHILD_NOT_FOUND_ERROR_MESSAGE
  );
}

export function shouldFilterGifPickerTenorCategoriesError(
  event: SentryClientEvent
): boolean {
  const value = event.exception?.values?.[0];
  if (
    value?.type !== "TypeError" ||
    value.value !== gifPickerTenorUndefinedTagsMessage
  ) {
    return false;
  }

  if (
    value.mechanism?.type !== browserUnhandledRejectionMechanism ||
    value.mechanism.handled !== false
  ) {
    return false;
  }

  if (!hasWavesRoute(event)) {
    return false;
  }

  const frames = value.stacktrace?.frames;
  if (hasAppOwnedFrame(frames)) {
    return false;
  }

  return (
    hasGifPickerTenorManagerFrame(frames) ||
    hasGifPickerTenorBreadcrumbSignature(event)
  );
}

export function shouldFilterSentryRouteParameterizationError(
  event: SentryClientEvent
): boolean {
  // Sentry SDK route parameterization noise observed in MetaMaskMobile WKWebView;
  // keep app-owned and generic browser cyclic JSON errors.
  const value = event.exception?.values?.[0];
  if (
    value?.type !== "TypeError" ||
    value.value !== sentryRouteParameterizationMessage
  ) {
    return false;
  }

  const mechanism = value.mechanism;
  if (
    mechanism?.type !== sentryRouteParameterizationMechanismType ||
    mechanism.handled !== false
  ) {
    return false;
  }

  const frames = value.stacktrace?.frames;
  if (hasLikelyAppOwnedFrame(frames) || !hasNativeJsonStringifyFrame(frames)) {
    return false;
  }

  return (
    (hasRouteParameterizationRouteEvidence(event) ||
      hasSentryRouteParameterizationFrame(frames)) &&
    hasMetaMaskMobileWebViewContext(event)
  );
}

export function shouldFilterInjectedWasmCspUnsafeEval(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const frames = event.exception?.values?.[0]?.stacktrace?.frames;
  if (!hasInjectedWasmCspFrameSignature(frames)) {
    return false;
  }

  return hasWasmCspUnsafeEvalMessage(event, hint);
}

export function shouldFilterAnonymousUnsafeEvalCspError(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const value = event.exception?.values?.[0];
  if (value?.type !== "EvalError") {
    return false;
  }

  const mechanism = value.mechanism;
  if (
    mechanism?.type !== browserUnhandledRejectionMechanism ||
    mechanism.handled !== false
  ) {
    return false;
  }

  if (!hasAnonymousUnsafeEvalCspMessage(event, hint)) {
    return false;
  }

  if (!hasAnonymousUnsafeEvalCspFrameSignature(value.stacktrace?.frames)) {
    return false;
  }

  return !hasAnonymousUnsafeEvalCspAppEvidence(event, hint);
}
