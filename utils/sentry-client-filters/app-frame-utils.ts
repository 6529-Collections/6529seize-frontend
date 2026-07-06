import {
  appOwnedFramePathPrefixes,
  appOwnedFramePathTokens,
  appOwnedStackPatterns,
  browserExtensionUrlPrefixes,
  gifPickerReactPackageToken,
  gifPickerTenorManagerPathToken,
  injectedAppUriPath,
  injectedProviderProxyPath,
  injectedWasmCspAppUriPath,
  injectedWasmCspCollapsedPath,
  NEXT_STATIC_CHUNK_FRAME_PATTERNS,
  REACT_DOM_INSERT_BEFORE_RUNTIME_FUNCTIONS,
  REACT_DOM_RUNTIME_FRAME_PATTERNS,
  sentryPackagePathTokens,
  sentryRouteParameterizationPathToken,
} from "./constants";
import type {
  SentryClientEvent,
  SentryEventHint,
  SentryStackFrame,
} from "./types";
import {
  getFramePaths,
  getHintExceptionStack,
  isFirstPartyHost,
} from "./value-utils";

export function isReactDomRuntimeFrame(frame: SentryStackFrame): boolean {
  const paths = getFramePaths(frame);
  if (
    paths.some((path) =>
      REACT_DOM_RUNTIME_FRAME_PATTERNS.some((pattern) => path.includes(pattern))
    )
  ) {
    return true;
  }

  const functionName = frame.function?.trim();
  if (
    !functionName ||
    !REACT_DOM_INSERT_BEFORE_RUNTIME_FUNCTIONS.has(functionName)
  ) {
    return false;
  }

  return paths.some((path) =>
    NEXT_STATIC_CHUNK_FRAME_PATTERNS.some((pattern) => path.includes(pattern))
  );
}

export function hasOnlyReactDomRuntimeFrames(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.length > 0 &&
    frames.every(isReactDomRuntimeFrame)
  );
}

export function hasReactDomNotFoundErrorSignature(
  event: SentryClientEvent,
  message: string
): boolean {
  const value = event.exception?.values?.[0];
  if (value?.type !== "NotFoundError") {
    return false;
  }

  if (value.value !== message) {
    return false;
  }

  return hasOnlyReactDomRuntimeFrames(value.stacktrace?.frames);
}

export function isAppUriFrame(frame: SentryStackFrame): boolean {
  return [frame.filename, frame.abs_path].some(
    (path) => typeof path === "string" && path.startsWith("app:///")
  );
}

export function isInjectedAppUriFrame(frame: SentryStackFrame): boolean {
  return [frame.filename, frame.abs_path].some(
    (path) => typeof path === "string" && path.includes(injectedAppUriPath)
  );
}

export function isInjectedProviderProxyFrame(frame: SentryStackFrame): boolean {
  return getFramePaths(frame).some((path) =>
    path.includes(injectedProviderProxyPath)
  );
}

export function hasOnlyInjectedProviderProxyFrames(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.length > 0 &&
    frames.every(isInjectedProviderProxyFrame)
  );
}

export function isInjectedWasmCspFramePath(path: string): boolean {
  const normalizedPath = path.trim();
  return (
    normalizedPath.includes(injectedWasmCspAppUriPath) ||
    normalizedPath === injectedWasmCspCollapsedPath ||
    normalizedPath.startsWith(`${injectedWasmCspCollapsedPath}:`)
  );
}

export function isInjectedWasmCspFrame(frame: SentryStackFrame): boolean {
  return getFramePaths(frame).some(isInjectedWasmCspFramePath);
}

export function isFirstPartyFramePath(path: string): boolean {
  const normalizedPath = path.trim();
  if (!normalizedPath) {
    return false;
  }

  if (
    normalizedPath.startsWith("app:///") &&
    !isInjectedWasmCspFramePath(normalizedPath)
  ) {
    return true;
  }

  if (normalizedPath.includes("/_next/static/")) {
    return true;
  }

  try {
    return isFirstPartyHost(new URL(normalizedPath).hostname);
  } catch {
    return false;
  }
}

export function isAppOwnedWasmCspFrame(frame: SentryStackFrame): boolean {
  if (frame.in_app === true && !isInjectedWasmCspFrame(frame)) {
    return true;
  }

  return getFramePaths(frame).some(isFirstPartyFramePath);
}

export function isInjectedOrThirdPartyWalletExtensionPath(
  value: string
): boolean {
  const normalizedValue = value.toLowerCase();
  if (
    normalizedValue.includes(injectedAppUriPath) ||
    normalizedValue.includes("app:///page.js")
  ) {
    return true;
  }

  return (
    browserExtensionUrlPrefixes.some((prefix) =>
      normalizedValue.includes(prefix)
    ) && normalizedValue.includes("/page.js")
  );
}

export function isAppOwnedFramePath(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  if (isInjectedOrThirdPartyWalletExtensionPath(normalizedValue)) {
    return false;
  }

  return hasAppOwnedFramePathSignature(normalizedValue);
}

export function hasAppOwnedFramePathSignature(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  return appOwnedFramePathTokens.some((token) =>
    normalizedValue.includes(token)
  );
}

export function hasOnlyAppUriFrames(
  frames: SentryStackFrame[] | undefined
): frames is SentryStackFrame[] {
  return (
    Array.isArray(frames) && frames.length > 0 && frames.every(isAppUriFrame)
  );
}

export function hasInjectedAppUriFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return Array.isArray(frames) && frames.some(isInjectedAppUriFrame);
}

export function hasInjectedWasmCspFrameSignature(
  frames: SentryStackFrame[] | undefined
): boolean {
  if (!Array.isArray(frames) || frames.length === 0) {
    return false;
  }

  if (frames.some(isAppOwnedWasmCspFrame)) {
    return false;
  }

  return frames.some(isInjectedWasmCspFrame);
}

export function isNativeJsonStringifyFrame(frame: SentryStackFrame): boolean {
  if (frame.function !== "stringify") {
    return false;
  }

  return [frame.filename, frame.abs_path].includes("[native code]");
}

export function hasAppOwnedFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.some(
      (frame) => frame.in_app === true && !isNativeJsonStringifyFrame(frame)
    )
  );
}

export function hasAppOwnedNonExtensionFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.some((frame) => {
      if (isNativeJsonStringifyFrame(frame)) {
        return false;
      }

      const framePaths = getFramePaths(frame);
      if (framePaths.some(isInjectedOrThirdPartyWalletExtensionPath)) {
        return false;
      }

      return frame.in_app === true || framePaths.some(isAppOwnedFramePath);
    })
  );
}

export function hasAppOwnedNonExtensionSignature(
  frames: SentryStackFrame[] | undefined,
  hint?: SentryEventHint
): boolean {
  if (hasAppOwnedNonExtensionFrame(frames)) {
    return true;
  }

  const stack = getHintExceptionStack(hint);
  return stack ? hasAppOwnedFramePathSignature(stack) : false;
}

export function hasNativeJsonStringifyFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return Array.isArray(frames) && frames.some(isNativeJsonStringifyFrame);
}

export function isSentryRouteParameterizationPath(path: string): boolean {
  return (
    path.includes(sentryRouteParameterizationPathToken) &&
    sentryPackagePathTokens.some((token) => path.includes(token))
  );
}

export function hasSentryRouteParameterizationFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.some((frame) =>
      getFramePaths(frame).some(isSentryRouteParameterizationPath)
    )
  );
}

export function isGifPickerTenorManagerPath(path: string | undefined): boolean {
  return (
    typeof path === "string" &&
    path.includes(gifPickerReactPackageToken) &&
    path.includes(gifPickerTenorManagerPathToken)
  );
}

export function hasGifPickerTenorManagerFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.some((frame) =>
      [frame.filename, frame.abs_path].some(isGifPickerTenorManagerPath)
    )
  );
}

export function hasAppOwnedStackPath(value: string | undefined): boolean {
  const normalized = value?.toLowerCase();
  return (
    !!normalized &&
    appOwnedStackPatterns.some((pattern) => normalized.includes(pattern))
  );
}

export function hasLikelyAppOwnedFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    hasAppOwnedFrame(frames) ||
    (Array.isArray(frames) &&
      frames.some((frame) =>
        getFramePaths(frame).some((path) => hasAppOwnedStackPath(path))
      ))
  );
}

export function normalizeStackPath(value: string): string {
  const webpackPrefix = "webpack-internal:///";
  const webpackSourcePrefix = "webpack://_n_e/./";
  const appUriPrefix = "app:///";
  let normalized = value;

  if (normalized.startsWith(webpackPrefix)) {
    normalized = normalized.slice(webpackPrefix.length);
    if (normalized.startsWith("(")) {
      const groupEnd = normalized.indexOf(")/");
      if (groupEnd >= 0) {
        normalized = normalized.slice(groupEnd + 2);
      }
    }
    if (normalized.startsWith("./")) {
      normalized = normalized.slice(2);
    }
  }
  if (normalized.startsWith(webpackSourcePrefix)) {
    normalized = normalized.slice(webpackSourcePrefix.length);
  }
  if (normalized.startsWith(appUriPrefix)) {
    normalized = normalized.slice(appUriPrefix.length);
  }

  while (normalized.startsWith("/")) {
    normalized = normalized.slice(1);
  }

  return normalized;
}

export function isAppOwnedStackPath(value: string | undefined): boolean {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  const normalized = normalizeStackPath(value);
  return appOwnedFramePathPrefixes.some((prefix) =>
    normalized.startsWith(prefix)
  );
}

export function hasAppOwnedSourceFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.some((frame) =>
      [frame.filename, frame.abs_path].some(isAppOwnedStackPath)
    )
  );
}

export function hasAppOwnedSourceStackValue(value: string): boolean {
  if (value.length === 0) {
    return false;
  }

  return getStackFramePathCandidates(value).some(isAppOwnedStackPath);
}

export function getStackFramePathCandidates(value: string): string[] {
  return value
    .split("\n")
    .map(getStackFramePathCandidate)
    .filter((candidate): candidate is string => !!candidate);
}

export function getStackFramePathCandidate(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  if (!trimmed.startsWith("at ")) {
    return trimmed;
  }

  const wrapperStart = trimmed.indexOf(" (");
  if (wrapperStart >= 0 && trimmed.endsWith(")")) {
    return trimmed.slice(wrapperStart + 2, -1);
  }

  const withoutAt = trimmed.slice("at ".length).trim();
  const firstSpace = withoutAt.indexOf(" ");
  return firstSpace >= 0 ? withoutAt.slice(firstSpace + 1).trim() : withoutAt;
}

export function getStackSignatureValues(
  frames: SentryStackFrame[] | undefined,
  hint?: SentryEventHint
): string[] {
  const frameValues = Array.isArray(frames)
    ? frames.flatMap((frame) => [
        frame.function,
        frame.filename,
        frame.abs_path,
      ])
    : [];

  return [...frameValues, getHintExceptionStack(hint)].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );
}
