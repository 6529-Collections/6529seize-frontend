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

export function tagSecurityProbes<T extends Event>(event: T): T {
  try {
    const url = (event?.request?.url || "").toLowerCase();

    if (PROBE_PATTERNS.some((p) => url.includes(p))) {
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
