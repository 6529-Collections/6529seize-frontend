import { hasAppOwnedNonExtensionSignature } from "./app-frame-utils";
import {
  braveWalletPageEvaluationErrorMessages,
  browserGlobalHandlerOnErrorMechanism,
} from "./constants";
import type {
  SentryClientEvent,
  SentryEventHint,
  SentryStackFrame,
} from "./types";
import {
  getRequestHeaderString,
  getRoutePathFromString,
  getRuntimeUserAgentString,
  getSerializedExceptionStack,
  getStringValue,
} from "./value-utils";

const braveWalletPageFramePrefix = "app:///";
const braveBrowserUserAgentPattern = /\bBrave(?:[/\s]|$)/i;

function getBraveWalletPageRouteCandidates(
  event: SentryClientEvent
): string[] {
  return [
    event.transaction,
    getStringValue(event.tags?.["transaction"]),
    getStringValue(event.tags?.["url"]),
    event.request?.url,
  ].flatMap((candidate) => {
    if (typeof candidate !== "string") {
      return [];
    }

    const routePath = getRoutePathFromString(candidate);
    return routePath ? [routePath] : [];
  });
}

function getBraveWalletPageFrameRoutePath(
  frame: SentryStackFrame
): string | null {
  if (
    typeof frame.filename !== "string" ||
    (frame.abs_path !== undefined && frame.filename !== frame.abs_path) ||
    !frame.filename.startsWith(braveWalletPageFramePrefix)
  ) {
    return null;
  }

  return getRoutePathFromString(
    `/${frame.filename.slice(braveWalletPageFramePrefix.length)}`
  );
}

function isDynamicRouteSegment(segment: string): boolean {
  return (
    segment.startsWith(":") ||
    (segment.startsWith("[") && segment.endsWith("]"))
  );
}

function matchesBraveWalletPageRoute(
  routePath: string,
  frameRoutePath: string
): boolean {
  const routeSegments = routePath.split("/").filter(Boolean);
  const frameSegments = frameRoutePath.split("/").filter(Boolean);
  if (routeSegments.length !== frameSegments.length) {
    return false;
  }

  return routeSegments.every(
    (segment, index) =>
      isDynamicRouteSegment(segment) || segment === frameSegments[index]
  );
}

function hasMatchingBraveWalletPageFrameRoute(
  event: SentryClientEvent,
  frame: SentryStackFrame
): boolean {
  const frameRoutePath = getBraveWalletPageFrameRoutePath(frame);
  if (!frameRoutePath) {
    return false;
  }

  const routeCandidates = getBraveWalletPageRouteCandidates(event);
  return (
    routeCandidates.length > 0 &&
    routeCandidates.every((routePath) =>
      matchesBraveWalletPageRoute(routePath, frameRoutePath)
    )
  );
}

function hasExactBraveBrowserUserAgent(event: SentryClientEvent): boolean {
  return [
    getRequestHeaderString(event, "user-agent"),
    getRuntimeUserAgentString(),
  ].some(
    (userAgent) =>
      typeof userAgent === "string" &&
      braveBrowserUserAgentPattern.test(userAgent)
  );
}

export function shouldFilterBraveWalletPageEvaluationError(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const value = values[0];
  if (
    value?.type !== "TypeError" ||
    typeof value.value !== "string" ||
    !braveWalletPageEvaluationErrorMessages.has(value.value) ||
    value.mechanism?.type !== browserGlobalHandlerOnErrorMechanism ||
    value.mechanism.handled !== false ||
    !hasExactBraveBrowserUserAgent(event)
  ) {
    return false;
  }

  const frames = value.stacktrace?.frames;
  if (!Array.isArray(frames) || frames.length !== 1) {
    return false;
  }

  const [frame] = frames;
  if (
    frame?.in_app !== true ||
    frame.function !== "global code" ||
    frame.lineno !== 1 ||
    frame.colno !== 16 ||
    hasAppOwnedNonExtensionSignature(undefined, hint) ||
    getSerializedExceptionStack(event)
  ) {
    return false;
  }

  return hasMatchingBraveWalletPageFrameRoute(event, frame);
}
