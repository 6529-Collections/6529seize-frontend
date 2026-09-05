import {
  objectCapturedPromiseRejectionMessage,
  rabbyChromeExtensionContentScriptUrlPrefix,
  rabbyChromeUserRejectedCode,
  rabbyChromeUserRejectedMessage,
  rabbyChromeUserRejectedStackFunction,
  rabbyChromeUserRejectedStackHeader,
  rabbyMobileStackContextPattern,
  rabbyMobileUserRejectedCode,
  rabbyMobileUserRejectedMessage,
  rabbyMobileUserRejectedStackPattern,
  RABBY_MOBILE_ANDROID_USER_AGENT_TOKEN,
  RABBY_MOBILE_RAINBOWKIT_NOT_FOUND_MESSAGE,
  RABBY_MOBILE_USER_AGENT_TOKEN,
} from "./constants";
import type {
  SentryClientEvent,
  SentryEventHint,
  SentryStackFrame,
} from "./types";
import {
  getContextString,
  getEventMessage,
  getFramePaths,
  getHintExceptionMessage,
  getHintExceptionStack,
  getNumericValue,
  getRequestHeaderString,
  getRuntimeUserAgentString,
  getSerializedObjectRejection,
  getStringValue,
} from "./value-utils";
import {
  hasAppOwnedSourceEvidence,
  hasAppOwnedStackEvidence,
} from "./app-frame-utils";
import { hasBrowserUnhandledRejectionMechanism } from "./walletlink-websocket";

const rabbyRawChunkPathPrefix = "app:///_next/static/chunks/";
const rabbyRawWrapperFunctions = new Set(["n", "r"]);
const rabbyAndroidRawWrapperFunction = "r";
const rabbyAndroidJavaBridgeErrorMessage =
  "Error invoking postMessage: Java bridge method invocation error";
const browserSetTimeoutMechanismType =
  "auto.browser.browserapierrors.setTimeout";
const anonymousFramePath = "<anonymous>";
const sentryUnknownFunction = "?";
const rabbyAndroidInjectedFrameFunctions = [
  sentryUnknownFunction,
  "__rabby__updateUrl",
  "window.__RABBY_WEBVIEW_BRIDGE_POSTER__",
  "Proxy.myPostMessage",
] as const;
const stackFrameLocationSuffixPattern = /:\d+:\d+\)$/;

function matchesStackPattern(
  value: string | undefined,
  pattern: string
): boolean {
  return value?.toLowerCase().includes(pattern) ?? false;
}

function hasRabbyMobileStackContext(
  serializedStack: string | undefined,
  hint?: SentryEventHint
): boolean {
  return [serializedStack, getHintExceptionStack(hint)].some((stack) =>
    matchesStackPattern(stack, rabbyMobileStackContextPattern)
  );
}

function hasRabbyMobileUserRejectedStack(
  serializedStack: string | undefined,
  hint?: SentryEventHint
): boolean {
  return [serializedStack, getHintExceptionStack(hint)].some((stack) =>
    matchesStackPattern(stack, rabbyMobileUserRejectedStackPattern)
  );
}

function isRabbyChromeContentScriptFrame(stackLine: string): boolean {
  const normalizedLine = stackLine.trim();
  return (
    normalizedLine.startsWith("at ") &&
    normalizedLine.includes(`(${rabbyChromeExtensionContentScriptUrlPrefix}`) &&
    stackFrameLocationSuffixPattern.test(normalizedLine)
  );
}

function isRabbyChromeUserRejectedFrame(stackLine: string): boolean {
  return stackLine
    .trim()
    .startsWith(
      `at ${rabbyChromeUserRejectedStackFunction} (${rabbyChromeExtensionContentScriptUrlPrefix}`
    );
}

function hasExactRabbyChromeUserRejectedStack(
  stack: string | undefined
): stack is string {
  if (!stack) {
    return false;
  }

  const [header, ...frames] = stack.trimEnd().split(/\r?\n/);
  return (
    header === rabbyChromeUserRejectedStackHeader &&
    frames.length > 0 &&
    frames.every(isRabbyChromeContentScriptFrame) &&
    frames.some(isRabbyChromeUserRejectedFrame)
  );
}

function isObservedRabbyRawChunkFrame(
  frame: SentryStackFrame | undefined
): boolean {
  if (
    frame?.in_app !== true ||
    !frame.function ||
    !rabbyRawWrapperFunctions.has(frame.function)
  ) {
    return false;
  }

  const paths = [frame.filename, frame.abs_path].filter(
    (path): path is string => typeof path === "string" && path.length > 0
  );
  return (
    paths.length > 0 &&
    paths.every(
      (path) =>
        path.startsWith(rabbyRawChunkPathPrefix) &&
        path.endsWith(".js")
    )
  );
}

function hasOnlyFramePath(
  frame: SentryStackFrame | undefined,
  expectedPath: string
): boolean {
  if (!frame) {
    return false;
  }

  const paths = getFramePaths(frame);
  return paths.length > 0 && paths.every((path) => path === expectedPath);
}

function isObservedRabbyAndroidRawChunkFrame(
  frame: SentryStackFrame | undefined
): boolean {
  return (
    frame?.function === rabbyAndroidRawWrapperFunction &&
    isObservedRabbyRawChunkFrame(frame)
  );
}

function isObservedRabbyAndroidInjectedFrame(
  frame: SentryStackFrame | undefined,
  expectedFunction: string
): boolean {
  return (
    frame?.in_app === true &&
    frame.function === expectedFunction &&
    hasOnlyFramePath(frame, anonymousFramePath)
  );
}

function hasObservedRabbyAndroidJavaBridgeFrames(
  frames: SentryStackFrame[] | undefined
): boolean {
  if (
    !Array.isArray(frames) ||
    frames.length !== rabbyAndroidInjectedFrameFunctions.length + 1 ||
    !isObservedRabbyAndroidRawChunkFrame(frames[0])
  ) {
    return false;
  }

  return rabbyAndroidInjectedFrameFunctions.every((functionName, index) =>
    isObservedRabbyAndroidInjectedFrame(frames[index + 1], functionName)
  );
}

function isObservedRabbyRainbowKitNativePromiseFrame(
  frame: SentryStackFrame | undefined
): boolean {
  const paths = [frame?.filename, frame?.abs_path].filter(
    (path): path is string => typeof path === "string" && path.length > 0
  );
  return (
    frame?.in_app === true &&
    frame.function === "Promise" &&
    paths.length > 0 &&
    paths.every((path) => path === "[native code]")
  );
}

function hasObservedRabbyRainbowKitRawFrames(
  frames: SentryStackFrame[] | undefined
): boolean {
  // beforeSend receives this exact two-frame shape before Sentry symbolicates it.
  return (
    Array.isArray(frames) &&
    frames.length === 2 &&
    isObservedRabbyRawChunkFrame(frames[0]) &&
    isObservedRabbyRainbowKitNativePromiseFrame(frames[1])
  );
}

function hasSingleFramelessBrowserUnhandledRejection(
  event: SentryClientEvent
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const value = values[0];
  const frames = value?.stacktrace?.frames;
  const hasNoFrames =
    frames === undefined || (Array.isArray(frames) && frames.length === 0);

  return (
    value?.type === "UnhandledRejection" &&
    value.value === objectCapturedPromiseRejectionMessage &&
    hasBrowserUnhandledRejectionMechanism(value) &&
    hasNoFrames
  );
}

function hasExactCodeMessageAndStackShape(
  serialized: Record<string, unknown>
): boolean {
  const keys = Object.keys(serialized);
  return (
    keys.length === 3 &&
    keys.includes("code") &&
    keys.includes("message") &&
    keys.includes("stack")
  );
}

function hasRabbyMobileContext(event: SentryClientEvent): boolean {
  const candidates = [
    getContextString(event, "browser", "name"),
    getRequestHeaderString(event, "user-agent"),
    getRuntimeUserAgentString(),
    getStringValue(event.tags?.["browser"]),
    getStringValue(event.tags?.["browser.name"]),
    getStringValue(event.tags?.["user_agent"]),
    getStringValue(event.tags?.["userAgent"]),
  ];

  return candidates.some(
    (candidate) =>
      typeof candidate === "string" &&
      candidate.toLowerCase().includes(RABBY_MOBILE_USER_AGENT_TOKEN)
  );
}

function hasRabbyMobileAndroidContext(event: SentryClientEvent): boolean {
  const candidates = [
    getRequestHeaderString(event, "user-agent"),
    getRuntimeUserAgentString(),
    getStringValue(event.tags?.["user_agent"]),
    getStringValue(event.tags?.["userAgent"]),
  ];

  return candidates.some(
    (candidate) =>
      typeof candidate === "string" &&
      candidate.toLowerCase().includes(RABBY_MOBILE_ANDROID_USER_AGENT_TOKEN)
  );
}

export function shouldFilterRabbyChromeUserRejectedRequest(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  if (!hasSingleFramelessBrowserUnhandledRejection(event)) {
    return false;
  }

  const serialized = getSerializedObjectRejection(event, hint);
  if (!serialized || !hasExactCodeMessageAndStackShape(serialized)) {
    return false;
  }

  const stack = getStringValue(serialized["stack"]);
  if (
    serialized["code"] !== rabbyChromeUserRejectedCode ||
    serialized["message"] !== rabbyChromeUserRejectedMessage ||
    !hasExactRabbyChromeUserRejectedStack(stack)
  ) {
    return false;
  }

  return !hasAppOwnedStackEvidence(event, stack, hint);
}

export function shouldFilterRabbyMobileUserRejectedRequest(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  if (getEventMessage(event) !== objectCapturedPromiseRejectionMessage) {
    return false;
  }

  const serialized = getSerializedObjectRejection(event, hint);
  if (!serialized) {
    return false;
  }

  const code = getNumericValue(serialized["code"]);
  const message = getStringValue(serialized["message"])?.trim();
  const stack = getStringValue(serialized["stack"]);

  if (
    code !== rabbyMobileUserRejectedCode ||
    message !== rabbyMobileUserRejectedMessage
  ) {
    return false;
  }

  if (!hasRabbyMobileUserRejectedStack(stack, hint)) {
    return false;
  }

  if (
    !hasRabbyMobileContext(event) &&
    !hasRabbyMobileStackContext(stack, hint)
  ) {
    return false;
  }

  return !hasAppOwnedStackEvidence(event, stack, hint);
}

export function shouldFilterRabbyMobileRainbowKitNotFoundError(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const value = event.exception?.values?.[0];
  if (
    value?.type !== "Error" ||
    !hasBrowserUnhandledRejectionMechanism(value)
  ) {
    return false;
  }

  const messageCandidates = [
    value.value,
    event.message,
    getHintExceptionMessage(hint),
  ];
  const hasExactMessage = messageCandidates.some(
    (candidate) =>
      typeof candidate === "string" &&
      candidate.trim() === RABBY_MOBILE_RAINBOWKIT_NOT_FOUND_MESSAGE
  );

  if (!hasExactMessage) {
    return false;
  }

  return hasObservedRabbyRainbowKitRawFrames(value.stacktrace?.frames);
}

export function shouldFilterRabbyMobileAndroidJavaBridgePostMessageError(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const [value] = values;
  if (
    value?.type !== "Error" ||
    value.value !== rabbyAndroidJavaBridgeErrorMessage ||
    value.mechanism?.type !== browserSetTimeoutMechanismType ||
    value.mechanism.handled !== false ||
    !hasRabbyMobileAndroidContext(event) ||
    hasAppOwnedSourceEvidence(event, value, hint)
  ) {
    return false;
  }

  return hasObservedRabbyAndroidJavaBridgeFrames(value.stacktrace?.frames);
}
