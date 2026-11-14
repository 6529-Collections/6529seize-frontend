import { getE2eeDeviceLabel } from "@/components/e2ee/e2eeDeviceLabel";

/**
 * A short, non-identifying label such as "Brave on Windows" for a signed-posts
 * grant. It comes from the same brands-aware labeler as encrypted DMs, so one
 * browser has one name for both permissions (Brave and other Chromium brands
 * send a plain Chrome user agent). A user agent string is used alone, as on
 * browsers without client hints.
 */
export function getDeviceLabel(userAgent?: string): string {
  return getE2eeDeviceLabel(
    "web",
    userAgent === undefined ? undefined : { userAgent }
  );
}
