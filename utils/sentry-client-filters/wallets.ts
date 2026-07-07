import {
  browserUnhandledRejectionMechanism,
  circularReactMetaElementMessagePatterns,
  coinbaseWalletLinkWebSocketCloseFunction,
  coinbaseWalletLinkWebSocketFile,
  coinbaseWalletLinkWebSocket1006MessagePrefix,
  coinbaseWalletSdkPathTokens,
  injectedProviderProxyStartsWithMessage,
  jsonStringifyFunction,
  metaMaskMobileUpdateUrlFunction,
  nextStaticFramePathToken,
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
  walletWebSocketBreadcrumbAppKitTokens,
  walletWebSocketBreadcrumbConnectorTokens,
} from "./constants";
import type {
  SentryClientEvent,
  SentryEventHint,
  SentryExceptionValue,
  SentryStackFrame,
} from "./types";
import {
  getBreadcrumbMessages,
  getBreadcrumbValues,
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
  isRecord,
  normalizeErrorPrefix,
} from "./value-utils";
import {
  getStackSignatureValues,
  hasAppOwnedNonExtensionSignature,
  hasAppOwnedSourceFrame,
  hasAppOwnedSourceStackValue,
  hasAppOwnedStackPath,
  hasInjectedAppUriFrame,
  hasInjectedWalletCollisionAppUriStackValue,
  hasLikelyAppOwnedFrame,
  hasOnlyAppUriFrames,
  hasOnlyInjectedProviderProxyFrames,
  isInjectedOrThirdPartyWalletExtensionPath,
} from "./app-frame-utils";

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

export function isCoinbaseWalletLinkWebSocket1006Message(
  value: string
): boolean {
  const normalized = normalizeErrorPrefix(value).toLowerCase();
  return (
    normalized === coinbaseWalletLinkWebSocket1006MessagePrefix ||
    normalized.startsWith(`${coinbaseWalletLinkWebSocket1006MessagePrefix}:`)
  );
}

export function isCoinbaseWalletLinkWebSocketPath(
  path: string | undefined
): boolean {
  return (
    typeof path === "string" &&
    path.includes(coinbaseWalletLinkWebSocketFile) &&
    coinbaseWalletSdkPathTokens.some((token) => path.includes(token))
  );
}

function isCoinbaseWalletLinkWebSocketFrame(frame: SentryStackFrame): boolean {
  return [frame.filename, frame.abs_path].some(
    isCoinbaseWalletLinkWebSocketPath
  );
}

export function hasCoinbaseWalletLinkWebSocketFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) && frames.some(isCoinbaseWalletLinkWebSocketFrame)
  );
}

function isCoinbaseWalletLinkWebSocketCloseFrame(
  frame: SentryStackFrame
): boolean {
  return frame.function === coinbaseWalletLinkWebSocketCloseFunction;
}

export function hasCoinbaseWalletLinkWebSocketCloseFunction(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.some(isCoinbaseWalletLinkWebSocketCloseFrame)
  );
}

function isRawNextStaticFrame(frame: SentryStackFrame): boolean {
  return [frame.filename, frame.abs_path].some(
    (path) =>
      typeof path === "string" && path.includes(nextStaticFramePathToken)
  );
}

function hasRawNextStaticInAppFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.some((frame) => frame.in_app === true && isRawNextStaticFrame(frame))
  );
}

function hasAppOwnedWalletLinkWebSocketInAppFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.some(
      (frame) =>
        frame.in_app === true &&
        !isCoinbaseWalletLinkWebSocketFrame(frame) &&
        !isCoinbaseWalletLinkWebSocketCloseFrame(frame) &&
        !isRawNextStaticFrame(frame)
    )
  );
}

function hasCoinbaseWalletLinkWebSocketStack(hint?: SentryEventHint): boolean {
  const stack = getHintExceptionStack(hint);
  return (
    stack.includes(coinbaseWalletLinkWebSocketFile) &&
    coinbaseWalletSdkPathTokens.some((token) => stack.includes(token))
  );
}

export function hasCoinbaseWalletLinkWebSocketCloseStack(
  hint?: SentryEventHint
): boolean {
  return getHintExceptionStack(hint).includes(
    coinbaseWalletLinkWebSocketCloseFunction
  );
}

function hasCoinbaseWalletLinkWebSocketSerializedStack(
  event: SentryClientEvent
): boolean {
  const stack = getSerializedExceptionStack(event);
  return (
    stack.includes(coinbaseWalletLinkWebSocketFile) &&
    coinbaseWalletSdkPathTokens.some((token) => stack.includes(token))
  );
}

function hasCoinbaseWalletLinkWebSocketSerializedCloseStack(
  event: SentryClientEvent
): boolean {
  return getSerializedExceptionStack(event).includes(
    coinbaseWalletLinkWebSocketCloseFunction
  );
}

function addBreadcrumbSignatureValues(
  value: unknown,
  values: string[],
  depth: number
): void {
  if (depth > 4) {
    return;
  }

  if (typeof value === "string") {
    values.push(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) =>
      addBreadcrumbSignatureValues(item, values, depth + 1)
    );
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  Object.entries(value).forEach(([key, item]) => {
    if (item === true) {
      values.push(key);
    }
    addBreadcrumbSignatureValues(item, values, depth + 1);
  });
}

function getBreadcrumbSignatureText(event: SentryClientEvent): string {
  const values: string[] = [];
  getBreadcrumbValues(event).forEach((breadcrumb) => {
    addBreadcrumbSignatureValues(
      [breadcrumb.category, breadcrumb.message, breadcrumb.data],
      values,
      0
    );
  });

  return values.join("\n").toLowerCase();
}

function hasThirdPartyWalletAppKitBreadcrumbSignature(
  event: SentryClientEvent
): boolean {
  const text = getBreadcrumbSignatureText(event);
  if (!text) {
    return false;
  }

  const hasAppKitToken = walletWebSocketBreadcrumbAppKitTokens.some((token) =>
    text.includes(token)
  );
  const hasConnectorToken = walletWebSocketBreadcrumbConnectorTokens.some(
    (token) => text.includes(token)
  );

  return hasAppKitToken && hasConnectorToken;
}

function hasWalletLinkWebSocketUnhandledRejectionSignature(
  value: SentryExceptionValue | undefined,
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  return (
    value?.mechanism?.type === browserUnhandledRejectionMechanism &&
    value.mechanism.handled === false &&
    (hasCoinbaseWalletLinkWebSocketCloseFunction(value.stacktrace?.frames) ||
      hasCoinbaseWalletLinkWebSocketCloseStack(hint) ||
      hasCoinbaseWalletLinkWebSocketSerializedCloseStack(event))
  );
}

function hasBrowserUnhandledRejectionMechanism(
  value: SentryExceptionValue | undefined
): boolean {
  return (
    value?.mechanism?.type === browserUnhandledRejectionMechanism &&
    value.mechanism.handled === false
  );
}

function hasAppOwnedWalletLinkWebSocket1006Evidence(
  event: SentryClientEvent,
  value: SentryExceptionValue | undefined,
  hint?: SentryEventHint
): boolean {
  const frames = value?.stacktrace?.frames;
  return (
    hasAppOwnedSourceFrame(frames) ||
    hasAppOwnedWalletLinkWebSocketInAppFrame(frames) ||
    hasAppOwnedSourceStackValue(getHintExceptionStack(hint)) ||
    hasAppOwnedSourceStackValue(getSerializedExceptionStack(event))
  );
}

function hasThirdPartyWalletLinkWebSocket1006Evidence(
  event: SentryClientEvent,
  value: SentryExceptionValue | undefined,
  hint?: SentryEventHint
): boolean {
  return (
    hasCoinbaseWalletLinkWebSocketFrame(value?.stacktrace?.frames) ||
    hasCoinbaseWalletLinkWebSocketStack(hint) ||
    hasCoinbaseWalletLinkWebSocketSerializedStack(event) ||
    hasThirdPartyWalletAppKitBreadcrumbSignature(event)
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

function hasAppOwnedWalletConnectStaleSessionEvidence(
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

export function matchesWalletCollisionPattern(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  return walletCollisionPatterns.some((pattern) =>
    normalizedValue.includes(pattern)
  );
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
  if (!hasInjectedWalletCollisionAppUriStackValue(stack)) {
    return false;
  }

  if (!Array.isArray(frames) || frames.length === 0) {
    return true;
  }

  return hasOnlyAppUriFrames(frames);
}

function hasAppOwnedInjectedWalletCollisionEvidence(
  event: SentryClientEvent,
  frames: SentryStackFrame[] | undefined,
  hint?: SentryEventHint
): boolean {
  return (
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

  return !hasAppOwnedWalletConnectStaleSessionEvidence(event, value, hint);
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
  if (hasAppOwnedInjectedWalletCollisionEvidence(event, frames, hint)) {
    return false;
  }

  if (!hasInjectedAppUriSignature(frames, hint)) {
    return false;
  }

  return hasWalletCollisionSignature(event, hint);
}
