import type { UrlGuardOptions } from "@/lib/security/urlGuard";

/** Ports a preview may fetch from, on the first hop and every redirect. */
export const PREVIEW_ALLOWED_PORTS: readonly number[] = [80, 443];

/** Guard options shared by every link-preview fetch of a user-supplied URL. */
export const PUBLIC_URL_OPTIONS: UrlGuardOptions = {
  policy: {
    blockedHosts: ["localhost", "127.0.0.1", "::1"],
    blockedHostSuffixes: [
      ".local",
      ".internal",
      ".lan",
      ".intra",
      ".corp",
      ".home",
      ".test",
    ],
  },
  allowedPorts: PREVIEW_ALLOWED_PORTS,
};
