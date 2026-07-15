import {
  circularReactMetaElementMessagePatterns,
  injectedProviderProxyStartsWithMessage,
  jsonStringifyFunction,
  metaMaskMobileUpdateUrlFunction,
  objectCapturedPromiseRejectionMessage,
  providerDisconnectedCode,
  providerDisconnectedMessage,
  rabbyMobileStackContextPattern,
  rabbyMobileUserRejectedCode,
  rabbyMobileUserRejectedMessage,
  rabbyMobileUserRejectedStackPattern,
  RABBY_MOBILE_RAINBOWKIT_NOT_FOUND_MESSAGE,
  RABBY_MOBILE_USER_AGENT_TOKEN,
  talismanExtensionOnboardingMessage,
  walletCollisionPatterns,
  walletConnectStaleSessionFunctions,
  walletConnectStaleSessionTopicPrefix,
} from "./constants";
import type {
  SentryClientEvent,
  SentryEventHint,
  SentryStackFrame,
} from "./types";
import {
  getBreadcrumbMessages,
  getContextString,
  getEventMessage,
  getHintExceptionMessage,
  getHintExceptionStack,
  getNumericValue,
  getRequestHeaderString,
  getRuntimeUserAgentString,
  getSerializedExceptionStack,
  getSerializedObjectRejection,
  getStringValue,
  isObjectCapturedPromiseRejectionMessage,
  normalizeErrorPrefix,
} from "./value-utils";
import {
  getStackSignatureValues,
  hasAppOwnedNonExtensionSignature,
  hasAppOwnedSourceEvidence,
  hasAppOwnedSourceFrame,
  hasAppOwnedSourceStackValue,
  hasAppOwnedStackPath,
  hasLikelyAppOwnedFrame,
  hasOnlyInjectedProviderProxyFrames,
  isInjectedOrThirdPartyWalletExtensionPath,
} from "./app-frame-utils";
import {
  hasAppOwnedWalletLinkWebSocket1006Evidence,
  hasBrowserUnhandledRejectionMechanism,
  hasCoinbaseWalletLinkWebSocketFrame,
  hasCoinbaseWalletRequestRelayFrame,
  hasCoinbaseWalletLinkWebSocketSerializedStack,
  hasCoinbaseWalletLinkWebSocketStack,
  hasRawNextStaticInAppFrame,
  hasThirdPartyWalletAppKitBreadcrumbSignature,
  hasThirdPartyWalletLinkWebSocket1006Evidence,
  hasWalletLinkWebSocketUnhandledRejectionSignature,
  isCoinbaseWalletLinkWebSocket1006Message,
} from "./walletlink-websocket";

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

function hasAppOwnedStackEvidence(
  event: SentryClientEvent,
  serializedStack: string | undefined,
  hint?: SentryEventHint
): boolean {
  const frames = event.exception?.values?.[0]?.stacktrace?.frames;
  return (
    hasLikelyAppOwnedFrame(frames) ||
    hasAppOwnedStackPath(serializedStack) ||
    hasAppOwnedStackPath(getHintExceptionStack(hint))
  );
}

function isWalletConnectStaleSessionTopicMessage(value: string): boolean {
  const normalized = normalizeErrorPrefix(value);
  const prefix = walletConnectStaleSessionTopicPrefix.toLowerCase();
  if (!normalized.toLowerCase().startsWith(prefix)) {
    return false;
  }

  const topic = normalized.slice(walletConnectStaleSessionTopicPrefix.length);
  return topic.length > 0 && isHexString(topic);
}

function isHexString(value: string): boolean {
  return Array.from(value).every((character) => {
    const normalizedCodePoint = character.toLowerCase().codePointAt(0);
    return (
      normalizedCodePoint !== undefined &&
      ((normalizedCodePoint >= 48 && normalizedCodePoint <= 57) ||
        (normalizedCodePoint >= 97 && normalizedCodePoint <= 102))
    );
  });
}

function hasWalletConnectStaleSessionFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.some((frame) => {
      const functionName = frame.function?.trim();
      return (
        typeof functionName === "string" &&
        walletConnectStaleSessionFunctions.has(functionName)
      );
    })
  );
}

export function matchesWalletCollisionPattern(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  return walletCollisionPatterns.some((pattern) =>
    normalizedValue.includes(pattern)
  );
}

function hasInjectedOrThirdPartyWalletCollisionFrame(
  frame: SentryStackFrame
): boolean {
  if (hasAppOwnedSourceFrame([frame])) {
    return false;
  }

  return [frame.filename, frame.abs_path].some(
    (value) =>
      typeof value === "string" &&
      isInjectedOrThirdPartyWalletExtensionPath(value)
  );
}

function hasInjectedOrThirdPartyWalletCollisionStack(
  frames: SentryStackFrame[] | undefined,
  hint?: SentryEventHint
): boolean {
  if (!hasInjectedOrThirdPartyWalletExtensionSignature(frames, hint)) {
    return false;
  }

  if (!Array.isArray(frames) || frames.length === 0) {
    return true;
  }

  return frames.every(hasInjectedOrThirdPartyWalletCollisionFrame);
}

function hasAppOwnedInjectedWalletCollisionEvidence(
  event: SentryClientEvent,
  frames: SentryStackFrame[] | undefined,
  hint?: SentryEventHint
): boolean {
  return (
    hasAppOwnedNonExtensionSignature(frames, hint) ||
    hasAppOwnedSourceFrame(frames) ||
    hasAppOwnedSourceStackValue(getHintExceptionStack(hint)) ||
    hasAppOwnedSourceStackValue(getSerializedExceptionStack(event))
  );
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

function hasTalismanExtensionOnboardingMessage(
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
      normalizeErrorPrefix(candidate) === talismanExtensionOnboardingMessage
  );
}

function hasInjectedOrThirdPartyWalletExtensionSignature(
  frames: SentryStackFrame[] | undefined,
  hint?: SentryEventHint
): boolean {
  return getStackSignatureValues(frames, hint).some(
    isInjectedOrThirdPartyWalletExtensionPath
  );
}

function hasOnlyThirdPartyWalletExtensionFrames(
  frames: SentryStackFrame[] | undefined
): boolean {
  if (!Array.isArray(frames) || frames.length === 0) {
    return true;
  }

  return frames.every((frame) =>
    isThirdPartyWalletExtensionStack(
      [frame.filename, frame.abs_path].filter(Boolean).join("\n")
    )
  );
}

function isThirdPartyWalletExtensionStack(value: string | undefined): boolean {
  const stack = value?.toLowerCase();
  if (!stack) {
    return false;
  }

  if (!stack.includes("chrome-extension://")) {
    return false;
  }

  if (!stack.includes("/background.js")) {
    return false;
  }

  return !(
    stack.includes("app:///") ||
    stack.includes("http://") ||
    stack.includes("https://") ||
    stack.includes("/_next/static/")
  );
}

function hasCircularReactMetaElementMessage(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const value = event.exception?.values?.[0];
  const candidates = [
    value?.value,
    getHintExceptionMessage(hint),
    ...getBreadcrumbMessages(event),
  ];

  return candidates.some(
    (candidate) =>
      typeof candidate === "string" &&
      circularReactMetaElementMessagePatterns.every((pattern) =>
        candidate.includes(pattern)
      )
  );
}

function hasMetaMaskUpdateUrlJsonStringifySignature(
  frames: SentryStackFrame[] | undefined,
  hint?: SentryEventHint
): boolean {
  const stackSignatureValues = getStackSignatureValues(frames, hint);
  return (
    stackSignatureValues.some((value) =>
      value.includes(metaMaskMobileUpdateUrlFunction)
    ) &&
    stackSignatureValues.some((value) => value.includes(jsonStringifyFunction))
  );
}

function hasMetaMaskMobileUpdateUrlCircularJsonSignature(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const value = event.exception?.values?.[0];
  if (value?.type !== "TypeError") {
    return false;
  }

  if (!hasCircularReactMetaElementMessage(event, hint)) {
    return false;
  }

  return hasMetaMaskUpdateUrlJsonStringifySignature(
    value.stacktrace?.frames,
    hint
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

export function shouldFilterDisconnectedWalletProviderRejection(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  if (!isObjectCapturedPromiseRejectionMessage(getEventMessage(event))) {
    return false;
  }

  const frames = event.exception?.values?.[0]?.stacktrace?.frames;
  if (!hasOnlyThirdPartyWalletExtensionFrames(frames)) {
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
    code !== providerDisconnectedCode ||
    message !== providerDisconnectedMessage
  ) {
    return false;
  }

  if (!stack) {
    return !hasAppOwnedStackEvidence(event, stack, hint);
  }

  return isThirdPartyWalletExtensionStack(stack);
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
  const messageCandidates = [
    value?.value,
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

  if (!hasRabbyMobileContext(event)) {
    return false;
  }

  return !hasLikelyAppOwnedFrame(value?.stacktrace?.frames);
}

export function shouldFilterCoinbaseWalletLinkWebSocket1006(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const value = event.exception?.values?.[0];
  const messageCandidates = [
    value?.value,
    event.message,
    getHintExceptionMessage(hint),
  ];
  const hasTargetMessage = messageCandidates.some(
    (candidate) =>
      typeof candidate === "string" &&
      isCoinbaseWalletLinkWebSocket1006Message(candidate)
  );

  if (!hasTargetMessage) {
    return false;
  }

  const hasAppOwnedEvidence = hasAppOwnedWalletLinkWebSocket1006Evidence(
    event,
    value,
    hint
  );
  const hasAmbiguousRawInAppFrame = hasRawNextStaticInAppFrame(
    value?.stacktrace?.frames
  );
  if (hasAppOwnedEvidence) {
    return false;
  }

  const hasExplicitCoinbaseWalletLinkStack =
    hasCoinbaseWalletLinkWebSocketFrame(value?.stacktrace?.frames) ||
    (hasBrowserUnhandledRejectionMechanism(value) &&
      hasCoinbaseWalletRequestRelayFrame(value?.stacktrace?.frames)) ||
    hasCoinbaseWalletLinkWebSocketStack(hint) ||
    hasCoinbaseWalletLinkWebSocketSerializedStack(event);

  if (hasExplicitCoinbaseWalletLinkStack) {
    return true;
  }

  if (hasWalletLinkWebSocketUnhandledRejectionSignature(value, event, hint)) {
    return (
      !hasAmbiguousRawInAppFrame ||
      hasThirdPartyWalletAppKitBreadcrumbSignature(event)
    );
  }

  return (
    hasBrowserUnhandledRejectionMechanism(value) &&
    hasThirdPartyWalletLinkWebSocket1006Evidence(event, value, hint)
  );
}

export function shouldFilterTalismanExtensionOnboardingError(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  if (!hasTalismanExtensionOnboardingMessage(event, hint)) {
    return false;
  }

  const frames = event.exception?.values?.[0]?.stacktrace?.frames;
  if (hasAppOwnedNonExtensionSignature(frames, hint)) {
    return false;
  }

  return hasInjectedOrThirdPartyWalletExtensionSignature(frames, hint);
}

export function shouldFilterWalletConnectStaleSessionTopic(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const value = event.exception?.values?.[0];
  const messageCandidates = [
    value?.value,
    event.message,
    getHintExceptionMessage(hint),
  ];
  const hasTargetMessage = messageCandidates.some(
    (candidate) =>
      typeof candidate === "string" &&
      isWalletConnectStaleSessionTopicMessage(candidate)
  );

  if (!hasTargetMessage) {
    return false;
  }

  if (!hasBrowserUnhandledRejectionMechanism(value)) {
    return false;
  }

  if (!hasWalletConnectStaleSessionFrame(value?.stacktrace?.frames)) {
    return false;
  }

  return !hasAppOwnedSourceEvidence(event, value, hint);
}

export function shouldFilterInjectedProviderProxyStartsWithError(
  event: SentryClientEvent
): boolean {
  const value = event.exception?.values?.[0];
  if (
    value?.type !== "TypeError" ||
    value.value !== injectedProviderProxyStartsWithMessage
  ) {
    return false;
  }

  if (!hasBrowserUnhandledRejectionMechanism(value)) {
    return false;
  }

  return hasOnlyInjectedProviderProxyFrames(value.stacktrace?.frames);
}

export function shouldFilterInjectedWalletCollision(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  if (hasMetaMaskMobileUpdateUrlCircularJsonSignature(event, hint)) {
    return true;
  }

  const frames = event.exception?.values?.[0]?.stacktrace?.frames;
  if (!hasWalletCollisionSignature(event, hint)) {
    return false;
  }

  if (hasAppOwnedInjectedWalletCollisionEvidence(event, frames, hint)) {
    return false;
  }

  return hasInjectedOrThirdPartyWalletCollisionStack(frames, hint);
}
