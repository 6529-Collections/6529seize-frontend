import { browserUnhandledRejectionMechanism } from "./constants";
import type {
  SentryClientEvent,
  SentryEventHint,
  SentryStackFrame,
} from "./types";
import { hasAppOwnedSourceEvidence } from "./app-frame-utils";
import { getFramePaths, isNetworkErrorMessage } from "./value-utils";

const poperBlockerInjectedFetchPath = "app:///injectScriptAdjust.js";
const poperBlockerInjectedFetchFrameSignatures = [
  { functionName: "window.fetch", lineNumber: 1, columnNumber: 4520 },
  { functionName: "VihJ", lineNumber: 1, columnNumber: 3159 },
] as const;

function isPoperBlockerInjectedFetchPath(path: string): boolean {
  return path === poperBlockerInjectedFetchPath;
}

function isExactPoperBlockerInjectedFetchFrame(
  frame: SentryStackFrame,
  signature: (typeof poperBlockerInjectedFetchFrameSignatures)[number]
): boolean {
  const framePaths = getFramePaths(frame);
  return (
    frame.function === signature.functionName &&
    frame.lineno === signature.lineNumber &&
    frame.colno === signature.columnNumber &&
    framePaths.length > 0 &&
    framePaths.every(isPoperBlockerInjectedFetchPath)
  );
}

function hasExactPoperBlockerInjectedFetchFramePair(
  frames: SentryStackFrame[] | undefined
): boolean {
  if (!Array.isArray(frames)) {
    return false;
  }

  const injectedFetchFrames = frames.filter((frame) =>
    getFramePaths(frame).some(isPoperBlockerInjectedFetchPath)
  );
  return (
    injectedFetchFrames.length ===
      poperBlockerInjectedFetchFrameSignatures.length &&
    poperBlockerInjectedFetchFrameSignatures.every((signature) =>
      injectedFetchFrames.some((frame) =>
        isExactPoperBlockerInjectedFetchFrame(frame, signature)
      )
    )
  );
}

export function shouldFilterPoperBlockerOrphanFetchRejection(
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
    !isNetworkErrorMessage(value.value ?? "") ||
    value.mechanism?.type !== browserUnhandledRejectionMechanism ||
    value.mechanism.handled !== false ||
    hasAppOwnedSourceEvidence(event, value, hint)
  ) {
    return false;
  }

  return hasExactPoperBlockerInjectedFetchFramePair(value.stacktrace?.frames);
}
