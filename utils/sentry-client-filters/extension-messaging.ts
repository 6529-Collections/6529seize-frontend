import {
  browserUnhandledRejectionMechanism,
  browserExtensionUrlPrefixes,
  extensionMessagingConnectionFailureMessage,
  extensionMessagingContentScriptPaths,
  injectedScriptBundlePathToken,
  injectedScriptSendMessageError,
  webkitExtensionMessagingTabNotFoundMessage,
} from "./constants";
import type {
  SentryClientEvent,
  SentryEventHint,
  SentryStackFrame,
} from "./types";
import {
  hasAppOwnedSourceEvidence,
  isSentryBrowserHelperFrame,
} from "./app-frame-utils";
import {
  getFramePaths,
  getHintExceptionMessage,
  normalizeErrorPrefix,
} from "./value-utils";

const browserExtensionWalletRejectionMessage = "User rejected the request.";
const browserExtensionWalletBridgePath = "app:///content-scripts/bridge.js";
const browserExtensionSendMessageNextChunkPrefix =
  "app:///_next/static/chunks/";
const browserExtensionSendMessageInjectedPath =
  "app:///injectedScript.bundle.js";
// beforeSend receives Sentry's minified wrapper before server-side source maps
// reveal helpers.ts. Keep each cohort-backed wrapper/injected tuple exact so
// nearby application failures and future bundle drift fail open.
const browserExtensionSendMessageRawFrameSignatures = [
  {
    wrapperFunction: "n",
    wrapperLine: 3,
    wrapperColumn: 4853,
    injectedColumn: 84027,
  },
  {
    wrapperFunction: "n",
    wrapperLine: 7,
    wrapperColumn: 4853,
    injectedColumn: 84027,
  },
  {
    wrapperFunction: "r",
    wrapperLine: 7,
    wrapperColumn: 6173,
    injectedColumn: 84147,
  },
] as const;
// Keep the complete pre-symbolication stack exact so extension bundle drift
// fails open and nearby application failures remain visible.
const browserExtensionWalletBridgeFrameSignatures = [
  { functionName: "o", lineNumber: 12, columnNumber: 50420 },
  { functionName: "Ce.dispose", lineNumber: 1, columnNumber: 30025 },
  { functionName: "Ce._dispose", lineNumber: 1, columnNumber: 28455 },
  {
    functionName: "Object.userRejectedRequest",
    lineNumber: 1,
    columnNumber: 15879,
  },
  { functionName: "a", lineNumber: 1, columnNumber: 16591 },
] as const;

function isExtensionMessagingInjectedPath(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  return (
    normalizedValue.includes(injectedScriptBundlePathToken) ||
    extensionMessagingContentScriptPaths.has(normalizedValue) ||
    browserExtensionUrlPrefixes.some((prefix) =>
      normalizedValue.startsWith(prefix)
    )
  );
}

function isExtensionMessagingFrame(frame: SentryStackFrame): boolean {
  const framePaths = getFramePaths(frame);
  return (
    framePaths.length > 0 && framePaths.every(isExtensionMessagingInjectedPath)
  );
}

function hasOnlyInjectedSendMessageFrames(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.some(isExtensionMessagingFrame) &&
    frames.every(
      (frame) =>
        isExtensionMessagingFrame(frame) || isSentryBrowserHelperFrame(frame)
    )
  );
}

function hasOnlyMatchingFramePaths(
  frame: SentryStackFrame,
  predicate: (path: string) => boolean
): boolean {
  const framePaths = getFramePaths(frame);
  return framePaths.length > 0 && framePaths.every(predicate);
}

function hasExactBrowserExtensionSendMessageRawFrames(
  frames: SentryStackFrame[] | undefined
): boolean {
  if (!Array.isArray(frames) || frames.length !== 2) {
    return false;
  }

  const [wrapperFrame, injectedFrame] = frames;
  if (!wrapperFrame || !injectedFrame) {
    return false;
  }

  const hasExpectedWrapperPath = hasOnlyMatchingFramePaths(
    wrapperFrame,
    (path) =>
      path.startsWith(browserExtensionSendMessageNextChunkPrefix) &&
      path.endsWith(".js")
  );
  const hasExpectedInjectedPath = hasOnlyMatchingFramePaths(
    injectedFrame,
    (path) => path === browserExtensionSendMessageInjectedPath
  );
  if (
    !hasExpectedWrapperPath ||
    !hasExpectedInjectedPath ||
    wrapperFrame.in_app !== true ||
    injectedFrame.function !== "n" ||
    injectedFrame.in_app !== true ||
    injectedFrame.lineno !== 2
  ) {
    return false;
  }

  return browserExtensionSendMessageRawFrameSignatures.some(
    (signature) =>
      wrapperFrame.function === signature.wrapperFunction &&
      wrapperFrame.lineno === signature.wrapperLine &&
      wrapperFrame.colno === signature.wrapperColumn &&
      injectedFrame.colno === signature.injectedColumn
  );
}

function hasOnlyExtensionMessagingFrames(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.length > 0 &&
    frames.every(isExtensionMessagingFrame)
  );
}

function hasExactBrowserExtensionWalletBridgeFrames(
  frames: SentryStackFrame[] | undefined
): boolean {
  if (
    !Array.isArray(frames) ||
    frames.length !== browserExtensionWalletBridgeFrameSignatures.length
  ) {
    return false;
  }

  return frames.every((frame, index) => {
    const signature = browserExtensionWalletBridgeFrameSignatures[index];
    if (!signature) {
      return false;
    }

    const framePaths = getFramePaths(frame);
    return (
      frame.function === signature.functionName &&
      frame.lineno === signature.lineNumber &&
      frame.colno === signature.columnNumber &&
      framePaths.length > 0 &&
      framePaths.every((path) => path === browserExtensionWalletBridgePath)
    );
  });
}

function hasExtensionMessagingConnectionFailureMessage(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const exceptionMessage = event.exception?.values?.[0]?.value;
  if (
    typeof exceptionMessage === "string" &&
    exceptionMessage.trim().length > 0
  ) {
    return (
      normalizeErrorPrefix(exceptionMessage) ===
      extensionMessagingConnectionFailureMessage
    );
  }

  return [event.message, getHintExceptionMessage(hint)].some(
    (candidate) =>
      typeof candidate === "string" &&
      normalizeErrorPrefix(candidate) ===
        extensionMessagingConnectionFailureMessage
  );
}

export function shouldFilterBrowserExtensionMessagingConnectionError(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const [value] = values;
  if (!hasExtensionMessagingConnectionFailureMessage(event, hint)) {
    return false;
  }

  if (hasAppOwnedSourceEvidence(event, value, hint)) {
    return false;
  }

  return hasOnlyExtensionMessagingFrames(value?.stacktrace?.frames);
}

export function shouldFilterBrowserExtensionWalletRejection(
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
    value.value !== browserExtensionWalletRejectionMessage ||
    value.mechanism?.type !== browserUnhandledRejectionMechanism ||
    value.mechanism.handled !== false ||
    hasAppOwnedSourceEvidence(event, value, hint)
  ) {
    return false;
  }

  return hasExactBrowserExtensionWalletBridgeFrames(value.stacktrace?.frames);
}

export function shouldFilterBrowserExtensionSendMessageError(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const [value] = values;
  const normalizedMessage = normalizeErrorPrefix(value?.value ?? "");
  const isWebKitExtensionTabNotFoundError =
    normalizedMessage === webkitExtensionMessagingTabNotFoundMessage;
  if (
    value?.type !== "Error" ||
    (normalizedMessage !== injectedScriptSendMessageError &&
      !isWebKitExtensionTabNotFoundError)
  ) {
    return false;
  }

  const frames = value.stacktrace?.frames;
  const hasVerifiedRawFrames =
    normalizedMessage === injectedScriptSendMessageError &&
    hasExactBrowserExtensionSendMessageRawFrames(frames);
  const ownershipValue = hasVerifiedRawFrames
    ? {
        ...value,
        stacktrace: {
          frames: frames?.slice(1),
        },
      }
    : value;
  if (
    value.mechanism?.type !== browserUnhandledRejectionMechanism ||
    value.mechanism.handled !== false ||
    hasAppOwnedSourceEvidence(event, ownershipValue, hint)
  ) {
    return false;
  }

  if (isWebKitExtensionTabNotFoundError) {
    return true;
  }

  return hasVerifiedRawFrames || hasOnlyInjectedSendMessageFrames(frames);
}
