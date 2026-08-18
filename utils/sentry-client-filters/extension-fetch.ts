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
  {
    functionName: "window.fetch",
    allowMissingFunction: true,
    lineNumber: 1,
    columnNumber: 4520,
  },
  {
    functionName: "VihJ",
    allowMissingFunction: false,
    lineNumber: 1,
    columnNumber: 3159,
  },
] as const;

const urbanVpnExecutorMIdErrorMessage =
  "Cannot read properties of undefined (reading 'M_ID')";
const urbanVpnExecutorPath = "app:///executors/200.js";
const urbanVpnSentryWrapperPathPattern =
  /^app:\/\/\/_next\/static\/chunks\/[A-Za-z0-9_-]+\.js$/;
const urbanVpnExecutorFunctions = new Set(["F", "Z"]);

function isPoperBlockerInjectedFetchPath(path: string): boolean {
  return path === poperBlockerInjectedFetchPath;
}

function isExactPoperBlockerInjectedFetchFrame(
  frame: SentryStackFrame,
  signature: (typeof poperBlockerInjectedFetchFrameSignatures)[number]
): boolean {
  const framePaths = getFramePaths(frame);
  const functionName: unknown = frame.function;
  const hasExpectedFunctionName =
    functionName === signature.functionName ||
    (signature.allowMissingFunction &&
      (functionName === undefined || functionName === null));

  return (
    hasExpectedFunctionName &&
    frame.lineno === signature.lineNumber &&
    frame.colno === signature.columnNumber &&
    framePaths.length > 0 &&
    framePaths.every(isPoperBlockerInjectedFetchPath)
  );
}

function normalizeSentryUnknownPoperBlockerFunction(
  frame: SentryStackFrame,
  signature: (typeof poperBlockerInjectedFetchFrameSignatures)[number]
): SentryStackFrame {
  if (signature.allowMissingFunction && frame.function === "?") {
    return { ...frame, function: undefined };
  }
  return frame;
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
        isExactPoperBlockerInjectedFetchFrame(
          normalizeSentryUnknownPoperBlockerFunction(frame, signature),
          signature
        )
      )
    )
  );
}

function hasOnlyFramePaths(
  frame: SentryStackFrame,
  predicate: (path: string) => boolean
): boolean {
  const framePaths = getFramePaths(frame);
  return framePaths.length > 0 && framePaths.every(predicate);
}

function isExactUrbanVpnSentryWrapperFrame(frame: SentryStackFrame): boolean {
  return (
    frame.function === "XMLHttpRequest.r" &&
    frame.lineno === 7 &&
    frame.colno === 6173 &&
    hasOnlyFramePaths(frame, (path) =>
      urbanVpnSentryWrapperPathPattern.test(path)
    )
  );
}

function isExactUrbanVpnXhrFrame(frame: SentryStackFrame): boolean {
  return (
    frame.function === "XMLHttpRequest.onreadystatechange" &&
    frame.lineno === 1 &&
    frame.colno === 2598 &&
    hasOnlyFramePaths(frame, (path) => path === urbanVpnExecutorPath)
  );
}

function isExactUrbanVpnExecutorFrame(frame: SentryStackFrame): boolean {
  return (
    typeof frame.function === "string" &&
    urbanVpnExecutorFunctions.has(frame.function) &&
    frame.lineno === 1 &&
    frame.colno === 761 &&
    hasOnlyFramePaths(frame, (path) => path === urbanVpnExecutorPath)
  );
}

function hasExactUrbanVpnExecutorStack(
  frames: SentryStackFrame[] | undefined
): boolean {
  if (!Array.isArray(frames) || frames.length !== 3) {
    return false;
  }

  const [sentryWrapperFrame, xhrFrame, executorFrame] = frames;
  return (
    !!sentryWrapperFrame &&
    !!xhrFrame &&
    !!executorFrame &&
    isExactUrbanVpnSentryWrapperFrame(sentryWrapperFrame) &&
    isExactUrbanVpnXhrFrame(xhrFrame) &&
    isExactUrbanVpnExecutorFrame(executorFrame)
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

export function shouldFilterUrbanVpnExecutorMIdError(
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
    value.value !== urbanVpnExecutorMIdErrorMessage ||
    value.mechanism?.type !== browserUnhandledRejectionMechanism ||
    value.mechanism.handled !== false ||
    hasAppOwnedSourceEvidence(event, value, hint)
  ) {
    return false;
  }

  return hasExactUrbanVpnExecutorStack(value.stacktrace?.frames);
}
