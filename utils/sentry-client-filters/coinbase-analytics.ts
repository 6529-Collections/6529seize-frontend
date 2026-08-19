import { isSentryBrowserHelperFrame } from "./app-frame-utils";
import type { SentryClientEvent, SentryStackFrame } from "./types";
import { getContextString, getFramePaths } from "./value-utils";

const coinbaseAnalyticsIndexedDbMessage =
  "undefined is not an object (evaluating 'e.createObjectStore')";
const browserApiAddEventListenerMechanism =
  "auto.browser.browserapierrors.addEventListener";
const coinbaseAnalyticsBrowserNames = new Set(["Mobile Safari", "Twitter"]);
const rootDocumentPath = "app:///";
const wavesDocumentPathPattern =
  /^app:\/\/\/waves\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rawSentryWrapperPathPattern =
  /^app:\/\/\/_next\/static\/chunks\/[A-Za-z0-9_-]+\.js$/;

function hasStableRawSentryWrapperPath(frame: SentryStackFrame): boolean {
  const paths = getFramePaths(frame);
  return (
    paths.length > 0 &&
    new Set(paths).size === 1 &&
    paths.every((path) => rawSentryWrapperPathPattern.test(path))
  );
}

function isProcessedSentryWrapperFrame(frame: SentryStackFrame): boolean {
  const hasObservedCoordinates =
    (frame.function === "n" && frame.lineno === 111 && frame.colno === 58) ||
    (frame.function === "r" && frame.lineno === 117 && frame.colno === 14);
  return (
    frame.in_app === false &&
    isSentryBrowserHelperFrame(frame) &&
    hasObservedCoordinates
  );
}

function isRawSentryWrapperFrame(frame: SentryStackFrame): boolean {
  // beforeSend sees this minified wrapper before source-map processing. The
  // chunk name changed across the two affected releases, while this exact
  // wrapper function and coordinate remained stable.
  return (
    frame.function === "r" &&
    frame.lineno === 7 &&
    frame.colno === 6178 &&
    frame.in_app === true &&
    hasStableRawSentryWrapperPath(frame)
  );
}

function isExpectedSentryWrapperFrame(
  frame: SentryStackFrame | undefined
): boolean {
  return (
    frame !== undefined &&
    (isProcessedSentryWrapperFrame(frame) || isRawSentryWrapperFrame(frame))
  );
}

function isCoinbaseAnalyticsDocumentPath(path: string): boolean {
  return path === rootDocumentPath || wavesDocumentPathPattern.test(path);
}

function hasExactDocumentPath(
  frame: SentryStackFrame | undefined,
  documentPath: string
): frame is SentryStackFrame {
  // Raw client events may omit abs_path, so require it to agree when present.
  return (
    frame?.filename === documentPath &&
    (frame.abs_path === undefined || frame.abs_path === documentPath)
  );
}

function isExactCoinbaseAnalyticsDocumentFrame(
  frame: SentryStackFrame | undefined,
  documentPath: string,
  columnNumber: number,
  functionName?: string
): boolean {
  if (
    !hasExactDocumentPath(frame, documentPath) ||
    frame.lineno !== 1 ||
    frame.colno !== columnNumber ||
    frame.in_app !== true
  ) {
    return false;
  }

  if (functionName !== undefined) {
    return frame.function === functionName;
  }

  return frame.function === undefined || frame.function === "?";
}

function hasObservedIosBrowserContext(event: SentryClientEvent): boolean {
  const browserName = getContextString(event, "browser", "name");
  return (
    browserName !== undefined &&
    coinbaseAnalyticsBrowserNames.has(browserName) &&
    getContextString(event, "os", "name") === "iOS"
  );
}

function hasExactCoinbaseAnalyticsFrames(
  frames: SentryStackFrame[] | undefined
): boolean {
  if (!Array.isArray(frames) || frames.length !== 3) {
    return false;
  }

  const documentPath = frames[1]?.filename;
  if (
    typeof documentPath !== "string" ||
    !isCoinbaseAnalyticsDocumentPath(documentPath)
  ) {
    return false;
  }

  return (
    isExpectedSentryWrapperFrame(frames[0]) &&
    // Coinbase Wallet SDK 4.3.6 injects this one-line analytics payload into
    // the document; these columns map to its IDB result and upgrade callback.
    isExactCoinbaseAnalyticsDocumentFrame(frames[1], documentPath, 71560) &&
    isExactCoinbaseAnalyticsDocumentFrame(
      frames[2],
      documentPath,
      71873,
      "upgrade"
    )
  );
}

export function shouldFilterCoinbaseAnalyticsIndexedDbUpgradeError(
  event: SentryClientEvent
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const [value] = values;
  if (
    (event.message !== undefined && event.message !== "") ||
    value?.type !== "TypeError" ||
    value.value !== coinbaseAnalyticsIndexedDbMessage ||
    value.mechanism?.type !== browserApiAddEventListenerMechanism ||
    value.mechanism.handled !== false ||
    !hasObservedIosBrowserContext(event)
  ) {
    return false;
  }

  return hasExactCoinbaseAnalyticsFrames(value.stacktrace?.frames);
}
