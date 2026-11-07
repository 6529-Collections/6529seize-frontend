import { getCookieConsentByName } from "@/components/cookies/CookieConsentContext";
import { CONSENT_PERFORMANCE_COOKIE } from "@/constants/constants";
import Cookies from "js-cookie";

// aws-rum-web's user ID and session cookies. Their names are fixed while
// `cookieAttributes.unique` is left at its default of false.
const AWS_RUM_COOKIE_NAMES = ["cwr_u", "cwr_s"] as const;

/**
 * AWS RUM is a performance cookie: it runs only when the performance consent
 * is accepted. Outside a cookie consent provider it never runs (fail closed).
 * The provider reads its cookie after mounting, so until it reports a choice
 * the stored cookie decides.
 */
export function hasAwsRumPerformanceConsent(
  cookieConsent:
    | { readonly performanceConsent: boolean | undefined }
    | undefined
): boolean {
  if (cookieConsent === undefined) {
    return false;
  }
  return (
    (cookieConsent.performanceConsent ??
      getCookieConsentByName(CONSENT_PERFORMANCE_COOKIE)) === true
  );
}

/**
 * Deletes the AWS RUM cookies. aws-rum-web writes them with
 * `Domain=<hostname>`; an older host-only copy is removed too.
 */
export function clearAwsRumCookies(): void {
  if (typeof window === "undefined") {
    return;
  }
  for (const name of AWS_RUM_COOKIE_NAMES) {
    Cookies.remove(name, { path: "/", domain: window.location.hostname });
    Cookies.remove(name, { path: "/" });
  }
}
