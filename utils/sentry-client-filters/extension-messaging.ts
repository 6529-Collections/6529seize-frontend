import {
  browserUnhandledRejectionMechanism,
  browserExtensionUrlPrefixes,
  extensionMessagingConnectionFailureMessage,
  extensionMessagingContentScriptPaths,
  injectedScriptBundlePathToken,
  injectedScriptSendMessageError,
  sentryBrowserHelperPathToken,
  sentryBrowserPackagePathTokens,
  webkitExtensionMessagingTabNotFoundMessage,
} from "./constants";
import type {
  SentryClientEvent,
  SentryEventHint,
  SentryStackFrame,
} from "./types";
import { hasAppOwnedSourceEvidence } from "./app-frame-utils";
import {
  getFramePaths,
  getHintExceptionMessage,
  normalizeErrorPrefix,
} from "./value-utils";

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

function isSentryBrowserHelperFrame(frame: SentryStackFrame): boolean {
  const framePaths = getFramePaths(frame);
  return (
    framePaths.length > 0 &&
    framePaths.every(
      (path) =>
        path.includes(sentryBrowserHelperPathToken) &&
        sentryBrowserPackagePathTokens.some((token) => path.includes(token))
    )
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

function hasExtensionMessagingConnectionFailureMessage(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const value = event.exception?.values?.[0];
  const messageCandidates = [
    value?.value,
    event.message,
    getHintExceptionMessage(hint),
  ];

  return messageCandidates.some(
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
  const value = event.exception?.values?.[0];
  if (!hasExtensionMessagingConnectionFailureMessage(event, hint)) {
    return false;
  }

  if (hasAppOwnedSourceEvidence(event, value, hint)) {
    return false;
  }

  return hasOnlyExtensionMessagingFrames(value?.stacktrace?.frames);
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
