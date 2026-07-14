import {
  browserUnhandledRejectionMechanism,
  coinbaseWalletLinkWebSocketCloseFunction,
  coinbaseWalletLinkWebSocketFile,
  coinbaseWalletLinkWebSocket1006MessagePrefix,
  coinbaseWalletRequestRelayCloseFunction,
  coinbaseWalletRequestRelayPath,
  coinbaseWalletSdkPathTokens,
  nextStaticFramePathToken,
  walletWebSocketAppKitBootstrapBreadcrumbTokens,
  walletWebSocketBreadcrumbAppKitTokens,
  walletWebSocketBreadcrumbConnectorTokens,
} from "./constants";
import {
  hasAppOwnedSourceFrame,
  hasAppOwnedSourceStackValue,
} from "./app-frame-utils";
import type {
  SentryClientEvent,
  SentryEventHint,
  SentryExceptionValue,
  SentryStackFrame,
} from "./types";
import {
  getBreadcrumbValues,
  getHintExceptionStack,
  getSerializedExceptionStack,
  isRecord,
  normalizeErrorPrefix,
} from "./value-utils";

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

function isCoinbaseWalletRequestRelayFrame(frame: SentryStackFrame): boolean {
  if (frame.function !== coinbaseWalletRequestRelayCloseFunction) {
    return false;
  }

  const paths = [frame.filename, frame.abs_path].filter(
    (path): path is string => typeof path === "string" && path.length > 0
  );
  return (
    paths.length > 0 &&
    paths.every((path) => path === coinbaseWalletRequestRelayPath)
  );
}

export function hasCoinbaseWalletRequestRelayFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return Array.isArray(frames) && frames.some(isCoinbaseWalletRequestRelayFrame);
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

export function hasRawNextStaticInAppFrame(
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
        !isCoinbaseWalletRequestRelayFrame(frame) &&
        !isCoinbaseWalletLinkWebSocketCloseFrame(frame) &&
        !isRawNextStaticFrame(frame)
    )
  );
}

export function hasCoinbaseWalletLinkWebSocketStack(
  hint?: SentryEventHint
): boolean {
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

export function hasCoinbaseWalletLinkWebSocketSerializedStack(
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

export function hasThirdPartyWalletAppKitBreadcrumbSignature(
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

  const hasObservedAppKitBootstrap =
    walletWebSocketAppKitBootstrapBreadcrumbTokens.every((token) =>
      text.includes(token)
    );

  return (hasAppKitToken && hasConnectorToken) || hasObservedAppKitBootstrap;
}

export function hasWalletLinkWebSocketUnhandledRejectionSignature(
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

export function hasBrowserUnhandledRejectionMechanism(
  value: SentryExceptionValue | undefined
): boolean {
  return (
    value?.mechanism?.type === browserUnhandledRejectionMechanism &&
    value.mechanism.handled === false
  );
}

export function hasAppOwnedWalletLinkWebSocket1006Evidence(
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

export function hasThirdPartyWalletLinkWebSocket1006Evidence(
  event: SentryClientEvent,
  value: SentryExceptionValue | undefined,
  hint?: SentryEventHint
): boolean {
  return (
    hasCoinbaseWalletLinkWebSocketFrame(value?.stacktrace?.frames) ||
    hasCoinbaseWalletRequestRelayFrame(value?.stacktrace?.frames) ||
    hasCoinbaseWalletLinkWebSocketStack(hint) ||
    hasCoinbaseWalletLinkWebSocketSerializedStack(event) ||
    hasThirdPartyWalletAppKitBreadcrumbSignature(event)
  );
}
