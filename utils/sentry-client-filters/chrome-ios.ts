import { browserGlobalHandlerOnErrorMechanism } from "./constants";
import type { SentryClientEvent, SentryStackFrame } from "./types";
import {
  getContextString,
  getFramePaths,
  getRequestHeaderString,
  getStringValue,
} from "./value-utils";

const chromeMobileIosInjectedGaTransaction =
  "/nextgen/collection/:collection/art";
const chromeMobileIosInjectedGaUserAgentPrefix =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871";
const chromeMobileIosInjectedGaUserAgentMobileMarker = " Mobile/";
const chromeMobileIosInjectedGaUserAgentSuffix = " Safari/604.1";
const chromeMobileIosInjectedGaRequestUrls = new Set([
  "https://6529.io/nextgen/collection/pebbles/art",
  "/nextgen/collection/[collection]/art",
]);
const chromeMobileIosInjectedGaDocumentPaths = new Set([
  "https://6529.io/nextgen/collection/pebbles/art",
  "app:///nextgen/collection/pebbles/art",
]);

function hasExactChromeMobileIosInjectedGaRoute(
  event: SentryClientEvent
): boolean {
  const transactionValues = [
    event.transaction,
    getStringValue(event.tags?.["transaction"]),
  ].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );

  return (
    transactionValues.length > 0 &&
    transactionValues.every(
      (value) => value === chromeMobileIosInjectedGaTransaction
    ) &&
    typeof event.request?.url === "string" &&
    chromeMobileIosInjectedGaRequestUrls.has(event.request.url)
  );
}

function isExactChromeMobileIosInjectedGaFrame(
  frame: SentryStackFrame
): boolean {
  const paths = getFramePaths(frame);
  const functionName = frame.function?.trim();

  return (
    paths.length > 0 &&
    paths.every((path) => chromeMobileIosInjectedGaDocumentPaths.has(path)) &&
    (functionName === undefined ||
      functionName === "" ||
      functionName === "?") &&
    frame.lineno === 415 &&
    frame.colno === 45 &&
    frame.in_app === true
  );
}

function hasExactChromeMobileIosInjectedGaPlatform(
  event: SentryClientEvent
): boolean {
  const browserName = getContextString(event, "browser", "name");
  const browserVersion = getContextString(event, "browser", "version");
  const osName = getContextString(event, "os", "name");
  const osVersion = getContextString(event, "os", "version");
  const contextValues = [browserName, browserVersion, osName, osVersion];
  const hasContextValues = contextValues.some((value) => value !== undefined);
  const userAgent = getRequestHeaderString(event, "user-agent");
  const hasUserAgent = userAgent !== undefined;

  if (!hasContextValues && !hasUserAgent) {
    return false;
  }

  const contextsMatch =
    browserName === "Chrome Mobile iOS" &&
    browserVersion === "150.0.7871" &&
    osName === "iOS" &&
    osVersion === "26.5.2";

  return (
    (!hasContextValues || contextsMatch) &&
    (!hasUserAgent || matchesChromeMobileIosInjectedGaUserAgent(userAgent))
  );
}

function isAsciiDigit(value: string): boolean {
  return value >= "0" && value <= "9";
}

function isAsciiAlphaNumeric(value: string): boolean {
  return (
    isAsciiDigit(value) ||
    (value >= "A" && value <= "Z") ||
    (value >= "a" && value <= "z")
  );
}

function matchesChromeMobileIosInjectedGaUserAgent(
  userAgent: string
): boolean {
  if (
    !userAgent.startsWith(chromeMobileIosInjectedGaUserAgentPrefix) ||
    !userAgent.endsWith(chromeMobileIosInjectedGaUserAgentSuffix)
  ) {
    return false;
  }

  const variableStart = chromeMobileIosInjectedGaUserAgentPrefix.length;
  const variableEnd =
    userAgent.length - chromeMobileIosInjectedGaUserAgentSuffix.length;
  const variablePart = userAgent.slice(variableStart, variableEnd);
  const mobileMarkerIndex = variablePart.indexOf(
    chromeMobileIosInjectedGaUserAgentMobileMarker
  );
  if (mobileMarkerIndex === -1) {
    return false;
  }

  const browserBuild = variablePart.slice(0, mobileMarkerIndex);
  const mobileBuild = variablePart.slice(
    mobileMarkerIndex + chromeMobileIosInjectedGaUserAgentMobileMarker.length
  );
  const hasValidBrowserBuild =
    browserBuild === "" ||
    (browserBuild.startsWith(".") &&
      browserBuild.length > 1 &&
      [...browserBuild.slice(1)].every(isAsciiDigit));

  return (
    hasValidBrowserBuild &&
    mobileBuild.length > 0 &&
    [...mobileBuild].every(isAsciiAlphaNumeric)
  );
}

export function shouldFilterChromeMobileIosInjectedGaError(
  event: SentryClientEvent
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const [value] = values;
  if (
    event.level !== "error" ||
    (event.message !== undefined && event.message !== "") ||
    value?.type !== "Error" ||
    value.value !== "ga" ||
    value.mechanism?.type !== browserGlobalHandlerOnErrorMechanism ||
    value.mechanism.handled !== false ||
    !hasExactChromeMobileIosInjectedGaPlatform(event) ||
    !hasExactChromeMobileIosInjectedGaRoute(event)
  ) {
    return false;
  }

  const frames = value.stacktrace?.frames;
  const [frame] = frames ?? [];
  return (
    Array.isArray(frames) &&
    frames.length === 1 &&
    frame !== undefined &&
    isExactChromeMobileIosInjectedGaFrame(frame)
  );
}
