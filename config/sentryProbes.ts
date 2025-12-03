const PROBE_PATTERNS = [
  ".jsp",
  ".php",
  ".asp",
  ".aspx",
  "/exportimport/",
  "/wp-admin",
  "/wp-login",
  "/cgi-bin/",
  "/manager/html", // Tomcat
  "/admin/login.jsp", // common Java probe
];

const probeTags = {
  security_probe: "true",
  probe_type: "generic-exploit-scan",
};

export function filterTunnelRouteErrors(event: any, hint?: any): any | null {
  const value = event.exception?.values?.[0];
  const message = value?.value || "";
  const errorType = value?.type || "";

  if (typeof message === "string") {
    if (
      message.includes("aborted") ||
      message.includes("ECONNRESET") ||
      message.includes("socket hang up")
    ) {
      const url = event.request?.url || "";
      const stacktrace = value?.stacktrace?.frames || [];

      const isMonitoringRoute =
        url.includes("/monitoring") ||
        stacktrace.some(
          (frame: any) =>
            frame?.filename?.includes("monitoring") ||
            frame?.abs_path?.includes("monitoring")
        );

      if (isMonitoringRoute) {
        return null;
      }
    }
  }

  if (errorType === "Error" && typeof message === "string") {
    if (
      message.includes("aborted") &&
      hint?.originalException instanceof Error
    ) {
      const stack = hint.originalException.stack || "";
      if (
        stack.includes("_http_server") ||
        stack.includes("abortIncoming") ||
        stack.includes("socketOnClose")
      ) {
        const url = event.request?.url || "";
        if (url.includes("/monitoring")) {
          return null;
        }
      }
    }
  }

  return event;
}

export function tagSecurityProbes(event: any) {
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
