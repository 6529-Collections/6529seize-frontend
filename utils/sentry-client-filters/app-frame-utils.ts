import {
  appOwnedFramePathPrefixes,
  appOwnedFramePathTokens,
  appOwnedStackPatterns,
  browserExtensionUrlPrefixes,
  gifPickerReactPackageToken,
  gifPickerTenorManagerPathToken,
  injectedWalletCollisionAppUriPaths,
  injectedProviderProxyPath,
  injectedWasmCspAppUriPath,
  injectedWasmCspCollapsedPath,
  injectedWasmCspStaticChunkFunction,
  injectedWasmCspStaticChunkPathPattern,
  nextStaticFramePathToken,
  NEXT_STATIC_CHUNK_FRAME_PATTERNS,
  REACT_DOM_INSERT_BEFORE_RUNTIME_FUNCTIONS,
  REACT_DOM_RUNTIME_FRAME_PATTERNS,
  sentryPackagePathTokens,
  sentryRouteParameterizationPathToken,
} from "./constants";
import type {
  SentryClientEvent,
  SentryEventHint,
  SentryExceptionValue,
  SentryStackFrame,
} from "./types";
import {
  getFramePaths,
  getHintExceptionStack,
  getSerializedExceptionStack,
  isFirstPartyHost,
} from "./value-utils";

const reactDomInsertBeforeRawFrameCount = 50;
const reactDomInsertBeforeRawRuntimeFunctions = new Set([
  "sN",
  "sR",
  "lo",
  "li",
  "lr",
]);
const reactDomInsertBeforeRawRequiredFunctions = ["lo", "li", "lr"];
const reactDomInsertBeforeRawTerminalFunctions = new Set(["sN", "sR"]);

function isReactDomRuntimeFrame(frame: SentryStackFrame): boolean {
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

function hasOnlyReactDomRuntimeFrames(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.length > 0 &&
    frames.every(isReactDomRuntimeFrame)
  );
}

function hasOnlyOneNextStaticChunk(frames: SentryStackFrame[]): boolean {
  const [firstFrame] = frames;
  if (!firstFrame) {
    return false;
  }

  const chunkPathToken = `${nextStaticFramePathToken}chunks/`;
  const firstFramePaths = getFramePaths(firstFrame).map((path) => path.trim());
  if (
    firstFramePaths.length === 0 ||
    firstFramePaths.some((path) => !path.includes(chunkPathToken))
  ) {
    return false;
  }

  const chunkPaths = new Set(firstFramePaths);
  if (chunkPaths.size !== 1) {
    return false;
  }

  return frames.every((frame) => {
    const paths = getFramePaths(frame).map((path) => path.trim());
    return (
      paths.length > 0 &&
      paths.every(
        (path) => path.includes(chunkPathToken) && chunkPaths.has(path)
      )
    );
  });
}

function hasRawReactDomInsertBeforeFrameSignature(
  frames: SentryStackFrame[] | undefined
): boolean {
  // beforeSend sees this minified stack before Sentry applies source maps.
  // Keep the cohort-backed shape exact so minifier drift fails open.
  if (
    !Array.isArray(frames) ||
    frames.length !== reactDomInsertBeforeRawFrameCount
  ) {
    return false;
  }

  const terminalFunction = frames[frames.length - 1]?.function?.trim();
  if (
    !terminalFunction ||
    !reactDomInsertBeforeRawTerminalFunctions.has(terminalFunction)
  ) {
    return false;
  }

  const functionNames = new Set<string>();
  for (const frame of frames) {
    const functionName = frame.function?.trim();
    if (
      !functionName ||
      !reactDomInsertBeforeRawRuntimeFunctions.has(functionName)
    ) {
      return false;
    }
    functionNames.add(functionName);
  }

  return (
    functionNames.size ===
      reactDomInsertBeforeRawRequiredFunctions.length + 1 &&
    reactDomInsertBeforeRawRequiredFunctions.every((functionName) =>
      functionNames.has(functionName)
    ) && hasOnlyOneNextStaticChunk(frames)
  );
}

function getReactDomNotFoundErrorFrames(
  event: SentryClientEvent,
  message: string
): SentryStackFrame[] | undefined {
  const values = event.exception?.values;
  if (values?.length !== 1) {
    return undefined;
  }

  const [value] = values;
  if (value?.type !== "NotFoundError" || value.value !== message) {
    return undefined;
  }

  return value.stacktrace?.frames;
}

export function hasReactDomNotFoundErrorSignature(
  event: SentryClientEvent,
  message: string
): boolean {
  return hasOnlyReactDomRuntimeFrames(
    getReactDomNotFoundErrorFrames(event, message)
  );
}

export function hasReactDomInsertBeforeNotFoundErrorSignature(
  event: SentryClientEvent,
  message: string
): boolean {
  const frames = getReactDomNotFoundErrorFrames(event, message);
  return (
    hasOnlyReactDomRuntimeFrames(frames) ||
    hasRawReactDomInsertBeforeFrameSignature(frames)
  );
}

function isAppUriFrame(frame: SentryStackFrame): boolean {
  return [frame.filename, frame.abs_path].some(
    (path) => typeof path === "string" && path.startsWith("app:///")
  );
}

function isInjectedAppUriFrame(frame: SentryStackFrame): boolean {
  return getFramePaths(frame).some(hasInjectedWalletCollisionAppUriStackValue);
}

function isInjectedProviderProxyFrame(frame: SentryStackFrame): boolean {
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

function isInjectedWasmCspFramePath(path: string): boolean {
  const normalizedPath = path.trim();
  return (
    normalizedPath.includes(injectedWasmCspAppUriPath) ||
    normalizedPath === injectedWasmCspCollapsedPath ||
    normalizedPath.startsWith(`${injectedWasmCspCollapsedPath}:`)
  );
}

function isInjectedWasmCspStaticChunkFrame(frame: SentryStackFrame): boolean {
  return getFramePaths(frame).some((path) =>
    isInjectedWasmCspStaticChunkFramePath(frame, path)
  );
}

function isInjectedWasmCspStaticChunkFramePath(
  frame: SentryStackFrame,
  path: string
): boolean {
  return (
    frame.function?.trim() === injectedWasmCspStaticChunkFunction &&
    injectedWasmCspStaticChunkPathPattern.test(path.trim())
  );
}

function hasOnlyInjectedWasmCspStaticChunkFrames(
  frames: SentryStackFrame[]
): boolean {
  const markerFrame = frames.find(isInjectedWasmCspStaticChunkFrame);
  if (!markerFrame) {
    return false;
  }

  const markerPaths = new Set(
    getFramePaths(markerFrame)
      .map((path) => path.trim())
      .filter((path) => injectedWasmCspStaticChunkPathPattern.test(path))
  );

  return frames.every((frame) => {
    const paths = getFramePaths(frame).map((path) => path.trim());
    return paths.length > 0 && paths.every((path) => markerPaths.has(path));
  });
}

function hasAppOwnedWasmCspFramePath(frame: SentryStackFrame): boolean {
  return getFramePaths(frame).some(
    (path) =>
      !isInjectedWasmCspFramePath(path) &&
      !isInjectedWasmCspStaticChunkFramePath(frame, path) &&
      isFirstPartyFramePath(path)
  );
}

function isInjectedWasmCspFrame(frame: SentryStackFrame): boolean {
  if (hasAppOwnedWasmCspFramePath(frame)) {
    return false;
  }

  return (
    getFramePaths(frame).some(isInjectedWasmCspFramePath) ||
    isInjectedWasmCspStaticChunkFrame(frame)
  );
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

  if (normalizedPath.includes(nextStaticFramePathToken)) {
    return true;
  }

  try {
    return isFirstPartyHost(new URL(normalizedPath).hostname);
  } catch {
    return false;
  }
}

function isAppOwnedWasmCspFrame(frame: SentryStackFrame): boolean {
  if (isInjectedWasmCspFrame(frame)) {
    return false;
  }

  if (frame.in_app === true) {
    return true;
  }

  return hasAppOwnedWasmCspFramePath(frame);
}

export function isInjectedOrThirdPartyWalletExtensionPath(
  value: string
): boolean {
  const normalizedValue = value.toLowerCase();
  if (
    hasInjectedWalletCollisionAppUriStackValue(normalizedValue) ||
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

function hasInjectedWalletCollisionAppUriStackValue(
  value: string | undefined
): boolean {
  const normalizedValue = value?.toLowerCase();
  return (
    !!normalizedValue &&
    injectedWalletCollisionAppUriPaths.some((path) =>
      normalizedValue.includes(path.toLowerCase())
    )
  );
}

function isAppOwnedFramePath(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  if (isInjectedOrThirdPartyWalletExtensionPath(normalizedValue)) {
    return false;
  }

  return hasAppOwnedFramePathSignature(normalizedValue);
}

function hasAppOwnedFramePathSignature(value: string): boolean {
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

  if (hasOnlyInjectedWasmCspStaticChunkFrames(frames)) {
    return true;
  }

  if (frames.some(isAppOwnedWasmCspFrame)) {
    return false;
  }

  return frames.some(isInjectedWasmCspFrame);
}

function isNativeJsonStringifyFrame(frame: SentryStackFrame): boolean {
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

function hasAppOwnedNonExtensionFrame(
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

function isSentryRouteParameterizationPath(path: string): boolean {
  return (
    path.includes(sentryRouteParameterizationPathToken) &&
    sentryPackagePathTokens.some((token) => path.includes(token))
  );
}

export function isSentryRouteParameterizationFrame(
  frame: SentryStackFrame
): boolean {
  return getFramePaths(frame).some(isSentryRouteParameterizationPath);
}

export function hasSentryRouteParameterizationFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.some(isSentryRouteParameterizationFrame)
  );
}

function isGifPickerTenorManagerPath(path: string | undefined): boolean {
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

function normalizeStackPath(value: string): string {
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

function isAppOwnedStackPath(value: string | undefined): boolean {
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

export function hasAppOwnedSourceEvidence(
  event: SentryClientEvent,
  value: SentryExceptionValue | undefined,
  hint?: SentryEventHint
): boolean {
  const frames = value?.stacktrace?.frames;
  return (
    hasAppOwnedSourceFrame(frames) ||
    hasAppOwnedSourceStackValue(getHintExceptionStack(hint)) ||
    hasAppOwnedSourceStackValue(getSerializedExceptionStack(event))
  );
}

function getStackFramePathCandidates(value: string): string[] {
  return value
    .split("\n")
    .map(getStackFramePathCandidate)
    .filter((candidate): candidate is string => !!candidate);
}

function getStackFramePathCandidate(line: string): string | null {
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
