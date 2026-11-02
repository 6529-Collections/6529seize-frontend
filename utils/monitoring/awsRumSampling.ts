// aws-rum-web keeps its session, including the sampling decision, in this
// cookie (base64 JSON). Its name is fixed while `cookieAttributes.unique` is
// left at its default of false.
const AWS_RUM_SESSION_COOKIE_NAME = "cwr_s";
const AWS_RUM_SAMPLING_STORAGE_KEY = "6529:aws-rum-session-sampled";

/**
 * Reads the sampling decision of a live aws-rum-web session, so a tab that
 * joins a session another tab started keeps that session's decision.
 * Parsing mirrors the SDK's own cookie reader.
 */
const readAwsRumSessionCookieDecision = (): boolean | undefined => {
  try {
    for (const cookie of document.cookie.split("; ")) {
      const [name, value] = cookie.split("=");
      if (name !== AWS_RUM_SESSION_COOKIE_NAME || !value) {
        continue;
      }
      const session: unknown = JSON.parse(atob(value));
      if (
        typeof session === "object" &&
        session !== null &&
        "record" in session &&
        typeof session.record === "boolean"
      ) {
        return session.record;
      }
      return undefined;
    }
  } catch {
    // An unreadable cookie falls through to this tab's own decision.
  }
  return undefined;
};

const readStoredDecision = (): boolean | undefined => {
  try {
    const stored = globalThis.sessionStorage?.getItem(
      AWS_RUM_SAMPLING_STORAGE_KEY
    );
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
  return undefined;
};

const storeDecision = (sampled: boolean): void => {
  try {
    globalThis.sessionStorage?.setItem(
      AWS_RUM_SAMPLING_STORAGE_KEY,
      sampled ? "1" : "0"
    );
  } catch {
    // Without storage the decision lasts for this page load only.
  }
};

/**
 * Decides whether this browser session is recorded by AWS RUM, before the
 * SDK is downloaded, so unsampled sessions never fetch or start it.
 *
 * An existing RUM session cookie wins, then this tab's stored decision; a
 * new tab draws once against `sampleRate` and keeps the result in
 * sessionStorage, so reloads stay in or out of the sample.
 */
export function isAwsRumSessionSampled(sampleRate: number): boolean {
  const cookieDecision = readAwsRumSessionCookieDecision();
  if (cookieDecision !== undefined) {
    return cookieDecision;
  }
  const storedDecision = readStoredDecision();
  if (storedDecision !== undefined) {
    return storedDecision;
  }
  const sampled = Math.random() < sampleRate;
  storeDecision(sampled);
  return sampled;
}
