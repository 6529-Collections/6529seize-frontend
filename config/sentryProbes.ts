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
