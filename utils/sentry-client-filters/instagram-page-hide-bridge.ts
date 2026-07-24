import { browserGlobalHandlerOnErrorMechanism } from "./constants";
import { hasAppOwnedSourceEvidence } from "./app-frame-utils";
import type {
  SentryClientEvent,
  SentryEventHint,
  SentryStackFrame,
} from "./types";
import {
  getContextString,
  getFramePaths,
  getRequestHeaderString,
  getRuntimeUserAgentString,
  getStringValue,
} from "./value-utils";

const instagramBrowserPattern = /(?:^|[\s;(])instagram(?:[ /]|$)/i;
const iosUserAgentPattern = /\b(?:iphone|ipad|ipod)\b/i;
const instagramPageHideBridgeErrorMessage =
  "undefined is not an object (evaluating 'window.webkit.messageHandlers')";
const instagramPageHideBridgeFrameColumnSignatures = new Set([
  "5517:3808:1208",
  "6257:4139:1325",
]);

function isInstagramIosBrowser(event: SentryClientEvent): boolean {
  const requestUserAgent = getRequestHeaderString(event, "user-agent");
  const runtimeUserAgent = getRuntimeUserAgentString();
  const browserValues = [
    getContextString(event, "browser", "name"),
    getStringValue(event.tags?.["browser.name"]),
    getStringValue(event.tags?.["browser"]),
    requestUserAgent,
    runtimeUserAgent,
  ];
  if (
    !browserValues.some(
      (value) =>
        typeof value === "string" && instagramBrowserPattern.test(value)
    )
  ) {
    return false;
  }

  const osValues = [
    getContextString(event, "os", "name"),
    getStringValue(event.tags?.["os.name"]),
    getStringValue(event.tags?.["os"]),
  ];
  if (
    osValues.some(
      (value) =>
        typeof value === "string" &&
        (value === "iOS" || value.startsWith("iOS "))
    )
  ) {
    return true;
  }

  return [requestUserAgent, runtimeUserAgent].some(
    (value) =>
      typeof value === "string" && iosUserAgentPattern.test(value)
  );
}

function getSameDocumentFramePath(
  frame: SentryStackFrame | undefined
): string | null {
  if (!frame) {
    return null;
  }

  const paths = getFramePaths(frame);
  const [documentPath] = paths;
  if (!documentPath || !paths.every((path) => path === documentPath)) {
    return null;
  }

  return documentPath;
}

function hasInstagramPageHideBridgeFrameSignature(
  frames: SentryStackFrame[] | undefined
): boolean {
  if (!Array.isArray(frames) || frames.length !== 3) {
    return false;
  }

  const documentPath = getSameDocumentFramePath(frames[0]);
  if (
    !documentPath ||
    frames.some((frame) => getSameDocumentFramePath(frame) !== documentPath) ||
    frames.some((frame) => frame.lineno !== 1)
  ) {
    return false;
  }

  const functionNames = frames.map((frame) => {
    const functionName = frame.function?.trim();
    return functionName === "" ? undefined : functionName;
  });
  const firstFrameFunction = functionNames[0];
  if (
    (firstFrameFunction !== undefined && firstFrameFunction !== "?") ||
    functionNames[1] !== "sendPageHideMessage" ||
    functionNames[2] !== "sendDataToNative"
  ) {
    return false;
  }

  return instagramPageHideBridgeFrameColumnSignatures.has(
    frames.map((frame) => frame.colno).join(":")
  );
}

export function shouldFilterInstagramPageHideBridgeError(
  event: SentryClientEvent,
  hint?: SentryEventHint
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const [value] = values;
  if (
    value?.type !== "TypeError" ||
    value.value !== instagramPageHideBridgeErrorMessage ||
    value.mechanism?.type !== browserGlobalHandlerOnErrorMechanism ||
    value.mechanism.handled !== false ||
    !isInstagramIosBrowser(event)
  ) {
    return false;
  }

  if (hasAppOwnedSourceEvidence(event, value, hint)) {
    return false;
  }

  return hasInstagramPageHideBridgeFrameSignature(value.stacktrace?.frames);
}
