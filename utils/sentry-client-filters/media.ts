import { browserUnhandledRejectionMechanism } from "./constants";
import type { SentryClientEvent, SentryStackFrame } from "./types";
import { getContextString } from "./value-utils";

const injectedIosAutoplayNotAllowedMessage =
  "The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.";
const injectedIosAutoplayRootDocumentPath = "app:///";
const injectedIosAutoplayWaveDocumentPathPrefix = "app:///waves/";
const sentryUnknownFunction = "?";
const uuidSegmentLengths = [8, 4, 4, 4, 12];
const hexadecimalCharacters = new Set("0123456789abcdef");

function hasExpectedFramePath(
  frame: SentryStackFrame | undefined,
  expectedPath: string
): frame is SentryStackFrame {
  return (
    frame?.filename === expectedPath &&
    (frame.abs_path === undefined || frame.abs_path === expectedPath)
  );
}

function isInjectedIosAutoplayDocumentFrame(
  frame: SentryStackFrame | undefined,
  documentPath: string,
  lineNumber: number,
  columnNumber: number,
  functionName?: string
): boolean {
  if (
    !hasExpectedFramePath(frame, documentPath) ||
    frame.lineno !== lineNumber ||
    frame.colno !== columnNumber
  ) {
    return false;
  }

  if (functionName !== undefined) {
    return frame.function === functionName;
  }

  return (
    frame.function === undefined || frame.function === sentryUnknownFunction
  );
}

function isInjectedIosAutoplayDocumentPath(path: string): boolean {
  if (path === injectedIosAutoplayRootDocumentPath) {
    return true;
  }

  if (!path.startsWith(injectedIosAutoplayWaveDocumentPathPrefix)) {
    return false;
  }

  const uuidSegments = path
    .slice(injectedIosAutoplayWaveDocumentPathPrefix.length)
    .split("-");
  return (
    uuidSegments.length === uuidSegmentLengths.length &&
    uuidSegments.every(
      (segment, index) =>
        segment.length === uuidSegmentLengths[index] &&
        Array.from(segment.toLowerCase()).every((character) =>
          hexadecimalCharacters.has(character)
        )
    )
  );
}

function isInjectedIosAutoplayNativeFrame(
  frame: SentryStackFrame | undefined,
  functionName: string
): boolean {
  return (
    hasExpectedFramePath(frame, "[native code]") &&
    frame.function === functionName &&
    typeof frame.lineno !== "number" &&
    typeof frame.colno !== "number"
  );
}

function hasInjectedIosAutoplayContext(event: SentryClientEvent): boolean {
  return (
    getContextString(event, "browser", "name") === "Mobile Safari" &&
    getContextString(event, "os", "name") === "iOS"
  );
}

export function shouldFilterInjectedIosAutoplayNotAllowedError(
  event: SentryClientEvent
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const [value] = values;
  if (
    value?.type !== "NotAllowedError" ||
    value.value !== injectedIosAutoplayNotAllowedMessage ||
    value.mechanism?.type !== browserUnhandledRejectionMechanism ||
    value.mechanism.handled !== false ||
    !hasInjectedIosAutoplayContext(event)
  ) {
    return false;
  }

  const frames = value.stacktrace?.frames;
  if (!Array.isArray(frames) || frames.length !== 5) {
    return false;
  }

  const documentPath = frames[0]?.filename;
  if (
    typeof documentPath !== "string" ||
    !isInjectedIosAutoplayDocumentPath(documentPath)
  ) {
    return false;
  }

  return (
    isInjectedIosAutoplayDocumentFrame(
      frames[0],
      documentPath,
      27,
      5,
      "global code"
    ) &&
    isInjectedIosAutoplayDocumentFrame(frames[1], documentPath, 4, 32) &&
    isInjectedIosAutoplayNativeFrame(frames[2], "forEach") &&
    isInjectedIosAutoplayDocumentFrame(frames[3], documentPath, 6, 21) &&
    isInjectedIosAutoplayNativeFrame(frames[4], "play")
  );
}
