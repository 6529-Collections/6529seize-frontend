import {
  sentryRouteParameterizationMechanismType,
  sentryRouteParameterizationMessage,
} from "./constants";
import type { SentryClientEvent, SentryStackFrame } from "./types";
import { getBreadcrumbValues, getFramePaths, isRecord } from "./value-utils";

const diagnosticsTag = "cyclic_json_timer_diagnostics";
const scheduleOriginTag = "cyclic_json_timer_schedule_origin";
const diagnosticsExtraKey = "cyclicJsonTimerDiagnostics";
const diagnosticsVersion = "v2";
const diagnosticSampleRate = 1 / 16;
const minimumNavigationDelaySeconds = 0.075;
const maximumNavigationDelaySeconds = 0.35;
const rawNextChunkPathPattern =
  /^app:\/\/\/_next\/static\/chunks\/[a-z0-9._~-]+\.js$/i;
const sentryRawTimerWrapperLine = 7;
const sentryRawTimerWrapperColumn = 4858;
const maximumSchedulingFrames = 8;

function isFiniteTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNativeStringifyFrame(frame: SentryStackFrame | undefined): boolean {
  return (
    frame?.filename === "[native code]" &&
    (frame.abs_path === undefined || frame.abs_path === "[native code]") &&
    frame.function === "stringify"
  );
}

function isRawSentryTimerWrapperFrame(
  frame: SentryStackFrame | undefined
): boolean {
  if (
    frame?.function !== "n" ||
    frame.lineno !== sentryRawTimerWrapperLine ||
    frame.colno !== sentryRawTimerWrapperColumn
  ) {
    return false;
  }

  const paths = getFramePaths(frame);
  return (
    paths.length > 0 &&
    paths.every((path) => rawNextChunkPathPattern.test(path))
  );
}

function isRawDiagnosticWrapperFrame(
  frame: SentryStackFrame | undefined,
  sentryWrapper: SentryStackFrame | undefined
): boolean {
  if (
    !frame ||
    !sentryWrapper ||
    (typeof frame.function === "string" && frame.function.length > 0) ||
    !isValidFrameCoordinate(frame.lineno) ||
    !isValidFrameCoordinate(frame.colno)
  ) {
    return false;
  }

  const wrapperPaths = getFramePaths(sentryWrapper);
  const diagnosticPaths = getFramePaths(frame);
  return (
    diagnosticPaths.length > 0 &&
    diagnosticPaths.length === wrapperPaths.length &&
    diagnosticPaths.every((path) => wrapperPaths.includes(path))
  );
}

function hasRawWrapperOnlyExecutionStack(
  frames: SentryStackFrame[] | undefined
): boolean {
  if (!Array.isArray(frames) || frames.length !== 3) {
    return false;
  }

  const [sentryWrapper, diagnosticWrapper, nativeStringify] = frames;
  return (
    isRawSentryTimerWrapperFrame(sentryWrapper) &&
    isRawDiagnosticWrapperFrame(diagnosticWrapper, sentryWrapper) &&
    isNativeStringifyFrame(nativeStringify)
  );
}

function isValidFrameCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

function isInitialInjectedSchedulingFrame(value: unknown): boolean {
  return (
    isRecord(value) &&
    value["file"] === "non-http-script" &&
    value["function"] === "anonymous" &&
    value["origin"] === "unknown" &&
    isValidFrameCoordinate(value["line"]) &&
    isValidFrameCoordinate(value["column"])
  );
}

function isFirstPartyNavigationSchedulingFrame(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value["file"] === "string" &&
    value["file"].startsWith("/_next/static/chunks/") &&
    typeof value["function"] === "string" &&
    value["function"].length > 0 &&
    value["origin"] === "first_party" &&
    isValidFrameCoordinate(value["line"]) &&
    isValidFrameCoordinate(value["column"])
  );
}

function hasExactV2MetaMaskDiagnostics(event: SentryClientEvent): boolean {
  if (
    event.tags?.[diagnosticsTag] !== diagnosticsVersion ||
    event.tags[scheduleOriginTag] !== "first_party"
  ) {
    return false;
  }

  const diagnostics = event.extra?.[diagnosticsExtraKey];
  if (
    !isRecord(diagnostics) ||
    diagnostics["schemaVersion"] !== diagnosticsVersion ||
    diagnostics["timerSampleRate"] !== diagnosticSampleRate ||
    diagnostics["callbackName"] !== "anonymous" ||
    diagnostics["webViewFamily"] !== "metamask-mobile" ||
    diagnostics["scheduleOrigin"] !== "first_party"
  ) {
    return false;
  }

  const schedulingFrames = diagnostics["schedulingFrames"];
  return (
    Array.isArray(schedulingFrames) &&
    schedulingFrames.length >= 2 &&
    schedulingFrames.length <= maximumSchedulingFrames &&
    isInitialInjectedSchedulingFrame(schedulingFrames[0]) &&
    schedulingFrames.slice(1).every(isFirstPartyNavigationSchedulingFrame)
  );
}

function hasRecentSpaNavigation(event: SentryClientEvent): boolean {
  const eventTimestamp = event.timestamp;
  if (!isFiniteTimestamp(eventTimestamp)) {
    return false;
  }

  return getBreadcrumbValues(event).some((breadcrumb) => {
    const data = breadcrumb.data;
    if (
      breadcrumb.category !== "navigation" ||
      !isFiniteTimestamp(breadcrumb.timestamp) ||
      !data ||
      typeof data["from"] !== "string" ||
      typeof data["to"] !== "string"
    ) {
      return false;
    }

    const delaySeconds = eventTimestamp - breadcrumb.timestamp;
    return (
      delaySeconds >= minimumNavigationDelaySeconds &&
      delaySeconds <= maximumNavigationDelaySeconds
    );
  });
}

export function shouldFilterMetaMaskMobileSpaNavigationCyclicJsonError(
  event: SentryClientEvent
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const [value] = values;
  if (
    value?.type !== "TypeError" ||
    value.value !== sentryRouteParameterizationMessage ||
    value.mechanism?.type !== sentryRouteParameterizationMechanismType ||
    value.mechanism.handled !== false
  ) {
    return false;
  }

  return (
    hasRawWrapperOnlyExecutionStack(value.stacktrace?.frames) &&
    hasExactV2MetaMaskDiagnostics(event) &&
    hasRecentSpaNavigation(event)
  );
}
