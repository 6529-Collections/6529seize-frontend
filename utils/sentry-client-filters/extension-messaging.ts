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
  const value = event.exception?.values?.[0];
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

  if (
    value.mechanism?.type !== browserUnhandledRejectionMechanism ||
    value.mechanism.handled !== false ||
    hasAppOwnedSourceEvidence(event, value, hint)
  ) {
    return false;
  }

  if (isWebKitExtensionTabNotFoundError) {
    return event.exception?.values?.length === 1;
  }

  return hasOnlyInjectedSendMessageFrames(value.stacktrace?.frames);
}
