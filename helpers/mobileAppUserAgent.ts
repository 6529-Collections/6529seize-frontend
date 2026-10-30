/**
 * 6529 Mobile appends `6529Mobile/<version>` to its web view's user agent
 * (Capacitor `appendUserAgent`), after a space. The token contains "Mobile",
 * so browser and device detection must run on the user agent without it:
 * otherwise an Android tablet inside the app matches phone patterns such as
 * `Android.*Mobile`. Parsers such as Next's `userAgent()` need the same.
 *
 * The token is a hint, not proof: user agents are client-supplied, and app
 * versions released before the token do not send it.
 */
const MOBILE_APP_USER_AGENT_TOKEN = /(?:^|\s)6529Mobile\/(\S*)/i;
const MOBILE_APP_USER_AGENT_TOKENS = /(?:^|\s)6529Mobile\/\S*/gi;
const MOBILE_APP_VERSION_PART = /^\d{1,4}$/;

/** Up to four dot-separated numbers, such as `1.3`. */
const isMobileAppVersion = (version: string): boolean => {
  const parts = version.split(".");
  return (
    parts.length <= 4 &&
    parts.every((part) => MOBILE_APP_VERSION_PART.test(part))
  );
};

interface MobileAppUserAgent {
  /** `<version>` of a well-formed `6529Mobile/<version>` token, else null. */
  readonly appVersion: string | null;
  /** The user agent without the app token, for browser and device detection. */
  readonly browserUserAgent: string;
}

/** Accepts a missing user agent, e.g. `headers.get("user-agent")`. */
export function parseMobileAppUserAgent(
  userAgent: string | null | undefined
): MobileAppUserAgent {
  const value = userAgent ?? "";
  const version = MOBILE_APP_USER_AGENT_TOKEN.exec(value)?.[1];
  return {
    appVersion:
      version !== undefined && isMobileAppVersion(version) ? version : null,
    browserUserAgent: value.replaceAll(MOBILE_APP_USER_AGENT_TOKENS, ""),
  };
}
