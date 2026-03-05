import type { Event, EventHint } from "@sentry/nextjs";

const PROBE_PATTERNS = [
  ".jsp",
  ".php",
  ".asp",
  ".aspx",
  "/exportimport/",
  "/wp-admin",
  "/wp-login",
  "/cgi-bin/",
  "/manager/html",
  "/admin/login.jsp",
];

const probeTags = {
  security_probe: "true",
  probe_type: "generic-exploit-scan",
};

const SERVER_ACTION_NOT_FOUND = "Failed to find Server Action";
const WEBSTREAMS_TRANSFORM_ALGORITHM_ERROR =
  "controller[kState].transformAlgorithm is not a function";
const NEXTJS_RSC_TEXT_PLAIN_INVARIANT = "Expected RSC response, got text/plain";
const MALFORMED_NEXT_ACTION_PATTERNS = [
  "mozilla",
  "webkit",
  "chrome",
  "safari",
  "edge",
  "boundary",
] as const;
const MIN_NEXT_ACTION_LENGTH = 12;

const CONNECTION_ERROR_PATTERNS = ["aborted", "ECONNRESET", "socket hang up"];

const HTTP_SERVER_STACK_PATTERNS = [
  "_http_server",
  "abortIncoming",
  "socketOnClose",
];

function isConnectionError(message: string): boolean {
  const normalized = message.toLowerCase();
  return CONNECTION_ERROR_PATTERNS.some((pattern) =>
    normalized.includes(pattern.toLowerCase())
  );
}

function isFrameWithPaths(
  frame: unknown
): frame is { filename?: string | undefined; abs_path?: string | undefined } {
  return (
    typeof frame === "object" &&
    frame !== null &&
    ("filename" in frame || "abs_path" in frame)
  );
}

function isMonitoringRoute(url: string, stacktrace: unknown[]): boolean {
  if (url.includes("/monitoring")) {
    return true;
  }
  return stacktrace.some((frame) => {
    if (!isFrameWithPaths(frame)) {
      return false;
    }
    return (
      frame.filename?.includes("monitoring") ||
      frame.abs_path?.includes("monitoring")
    );
  });
}

function hasHttpServerStack(stack: string): boolean {
  return HTTP_SERVER_STACK_PATTERNS.some((pattern) => stack.includes(pattern));
}

function checkFirstErrorPath(
  event: Event,
  message: string,
  value: { stacktrace?: { frames?: unknown[] | undefined } | undefined }
): boolean {
  if (!isConnectionError(message)) {
    return false;
  }

  const url = event.request?.url || "";
  const stacktrace = value?.stacktrace?.frames || [];

  return isMonitoringRoute(url, stacktrace);
}

function checkSecondErrorPath(
  event: Event,
  message: string,
  hint?: EventHint
): boolean {
  if (message !== "aborted" || !hint?.originalException) {
    return false;
  }

  if (!(hint.originalException instanceof Error)) {
    return false;
  }

  const stack = hint.originalException.stack || "";
  if (!hasHttpServerStack(stack)) {
    return false;
  }

  const url = event.request?.url || "";
  return url.includes("/monitoring");
}

export function filterTunnelRouteErrors<T extends Event>(
  event: T,
  hint?: EventHint
): T | null {
  const value = event.exception?.values?.[0];
  const message = value?.value || "";
  const errorType = value?.type || "";

  if (typeof message === "string") {
    if (checkFirstErrorPath(event, message, value || {})) {
      return null;
    }
  }

  if (errorType === "Error" && typeof message === "string") {
    if (checkSecondErrorPath(event, message, hint)) {
      return null;
    }
  }

  return event;
}

function isServerActionNotFoundError(event: Event): boolean {
  const value = event.exception?.values?.[0]?.value;
  const message = typeof value === "string" ? value : event.message;
  return (
    typeof message === "string" && message.includes(SERVER_ACTION_NOT_FOUND)
  );
}

function isProbeLikeRequest(
  url: string,
  securityProbeTag: string | undefined
): boolean {
  if (securityProbeTag === "true") {
    return true;
  }

  return (
    PROBE_PATTERNS.some((pattern) => url.includes(pattern)) ||
    url.includes("jquery-file-upload")
  );
}

function getStringTagValue(event: Event, key: string): string | undefined {
  const value = event.tags?.[key];
  return typeof value === "string" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getHeaderValue(
  headers: unknown,
  headerName: string
): string | undefined {
  const normalizedTarget = headerName.toLowerCase();

  if (Array.isArray(headers)) {
    for (const entry of headers) {
      if (!Array.isArray(entry) || entry.length < 2) {
        continue;
      }
      const key = entry[0];
      const value = entry[1];
      if (
        typeof key === "string" &&
        key.toLowerCase() === normalizedTarget &&
        typeof value === "string"
      ) {
        return value;
      }
    }
    return undefined;
  }

  if (!isRecord(headers)) {
    return undefined;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== normalizedTarget) {
      continue;
    }
    return typeof value === "string" ? value : undefined;
  }

  return undefined;
}

function getRequestContentType(event: Event): string {
  const headers = (event.request as { headers?: unknown } | undefined)?.headers;
  const fromHeader = getHeaderValue(headers, "content-type");
  if (typeof fromHeader === "string") {
    return fromHeader.toLowerCase();
  }

  const req = event.request as
    | ({ inferred_content_type?: unknown } & Record<string, unknown>)
    | undefined;
  const inferred = req?.["inferred_content_type"];
  return typeof inferred === "string" ? inferred.toLowerCase() : "";
}

function getNextActionHeader(event: Event): string | undefined {
  const headers = (event.request as { headers?: unknown } | undefined)?.headers;
  const value = getHeaderValue(headers, "next-action");
  return typeof value === "string" ? value.trim() : undefined;
}

function isMalformedNextActionId(nextAction: string): boolean {
  const normalized = nextAction.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (normalized.length < MIN_NEXT_ACTION_LENGTH) {
    return true;
  }

  if (normalized.includes(" ") || normalized.includes("----")) {
    return true;
  }

  return MALFORMED_NEXT_ACTION_PATTERNS.some((pattern) =>
    normalized.includes(pattern)
  );
}

function isMalformedNextActionProbe(event: Event): boolean {
  const nextAction = getNextActionHeader(event);
  if (!nextAction || !isMalformedNextActionId(nextAction)) {
    return false;
  }

  const method = (event.request?.method || "").toUpperCase();
  const contentType = getRequestContentType(event);

  return method === "POST" && contentType.includes("text/plain");
}

function hasServerActionProbeSignature(event: Event): boolean {
  const value = event.exception?.values?.[0];
  const message =
    (typeof value?.value === "string" && value.value) ||
    (typeof event.message === "string" ? event.message : "");

  if (!message) {
    return false;
  }

  return (
    message.includes(SERVER_ACTION_NOT_FOUND) ||
    message.includes(NEXTJS_RSC_TEXT_PLAIN_INVARIANT)
  );
}

function isProbeLikeServerActionRequest(event: Event): boolean {
  const url = (event.request?.url || "").toLowerCase();
  if (isMalformedNextActionProbe(event)) {
    return true;
  }
  return isProbeLikeRequest(url, getStringTagValue(event, "security_probe"));
}

function isWebStreamsTransformAlgorithmError(event: Event): boolean {
  const value = event.exception?.values?.[0];
  const message =
    typeof value?.value === "string" ? value.value : event.message || "";

  if (value?.type && value.type !== "TypeError") {
    return false;
  }

  return (
    typeof message === "string" &&
    message.includes(WEBSTREAMS_TRANSFORM_ALGORITHM_ERROR)
  );
}

function isProbeLikeWebStreamsRequest(event: Event): boolean {
  const url = (event.request?.url || "").toLowerCase();
  return isProbeLikeRequest(url, getStringTagValue(event, "security_probe"));
}

export function filterServerActionProbeErrors<T extends Event>(
  event: T
): T | null {
  if (!isServerActionNotFoundError(event)) {
    return event;
  }

  if (isProbeLikeServerActionRequest(event)) {
    return null;
  }

  return event;
}

export function filterMalformedNextActionProbeErrors<T extends Event>(
  event: T
): T | null {
  if (!hasServerActionProbeSignature(event)) {
    return event;
  }

  if (isMalformedNextActionProbe(event)) {
    return null;
  }

  return event;
}

export function filterWebStreamsProbeErrors<T extends Event>(
  event: T
): T | null {
  if (!isWebStreamsTransformAlgorithmError(event)) {
    return event;
  }

  if (isProbeLikeWebStreamsRequest(event)) {
    return null;
  }

  return event;
}

export function tagSecurityProbes<T extends Event>(event: T): T {
  try {
    const url = (event?.request?.url || "").toLowerCase();

    if (
      PROBE_PATTERNS.some((p) => url.includes(p)) ||
      isMalformedNextActionProbe(event)
    ) {
      event.level = "info";
      event.tags = event.tags
        ? { ...event.tags, ...probeTags }
        : { ...probeTags };
    }

    return event;
  } catch (error) {
    console.error("Error in tagSecurityProbes:", error);
    return event;
  }
}
