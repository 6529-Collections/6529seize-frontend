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

export function tagSecurityProbes(event: any) {
  const url = (event?.request?.url || "").toLowerCase();

  if (PROBE_PATTERNS.some((p) => url.includes(p))) {
    event.level = "info";
    event.tags = {
      ...(event.tags ?? {}),
      security_probe: "true",
      probe_type: "generic-exploit-scan",
    };
  }

  return event;
}
