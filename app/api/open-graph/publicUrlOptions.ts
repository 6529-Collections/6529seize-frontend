import type { UrlGuardOptions } from "@/lib/security/urlGuard";

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
};
