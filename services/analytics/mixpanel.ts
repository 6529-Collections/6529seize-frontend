import { publicEnv } from "@/config/env";
import mixpanel from "mixpanel-browser";

export type AnalyticsProperties = Record<
  string,
  boolean | number | string | null | undefined
>;

export type AuthImpactEventName =
  | "Auth Forced Logout"
  | "Auth Reauth Prompt Shown"
  | "Auth Session Refresh Recovered"
  | "Auth Session Refresh Succeeded"
  | "Auth Session Upgrade Prompt Shown"
  | "Auth Validation Cancelled"
  | "Auth Validation Failed While Connected";

export type AuthImpactReason =
  | "auth_validation_failed"
  | "session_refresh"
  | "session_upgrade_deadline_expired"
  | "session_upgrade_required"
  | "stored_auth_invalid"
  | "wallet_not_authorized";

export type AuthImpactRefreshOutcome =
  | "cancelled"
  | "empty"
  | "failed"
  | "local_valid_after_failure"
  | "missing_wallet"
  | "not_attempted"
  | "success";

export type AuthImpactAuthState =
  | "authenticated"
  | "auth_validation_failed"
  | "logged_out"
  | "reauth_prompt"
  | "refresh_needed"
  | "session_upgrade_prompt"
  | "session_upgrade_required"
  | "wallet_connected";

type AuthImpactClientType = "desktop" | "native" | "web";

export type AuthImpactProperties = {
  readonly auth_state_after?: AuthImpactAuthState | undefined;
  readonly auth_state_before?: AuthImpactAuthState | undefined;
  readonly client_type?: AuthImpactClientType | undefined;
  readonly endpoint_family?: "auth_session_refresh" | undefined;
  readonly page_group?: string | undefined;
  readonly product_failure?: boolean | undefined;
  readonly reason?: AuthImpactReason | undefined;
  readonly refresh_outcome?: AuthImpactRefreshOutcome | undefined;
  readonly route_pattern?: string | undefined;
  readonly status_bucket?: "2xx" | "aborted" | undefined;
  readonly was_connected_wallet?: boolean | undefined;
};

const MIXPANEL_TOKEN = publicEnv.NEXT_PUBLIC_MIXPANEL_TOKEN;

let hasInitialized = false;
let identifiedDistinctId: string | null = null;
let isTrackingAllowed = false;

const sanitizeProperties = (
  properties: AnalyticsProperties = {}
): Record<string, boolean | number | string | null> => {
  return Object.entries(properties).reduce<
    Record<string, boolean | number | string | null>
  >((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

const isAnalyticsEnvironmentSupported = (): boolean => {
  return (
    Reflect.has(globalThis, "window") &&
    publicEnv.NODE_ENV === "production" &&
    typeof MIXPANEL_TOKEN === "string" &&
    MIXPANEL_TOKEN.length > 0
  );
};

const isAnalyticsReady = (): boolean => {
  return (
    hasInitialized && isTrackingAllowed && isAnalyticsEnvironmentSupported()
  );
};

export const initAnalytics = (): boolean => {
  const token = MIXPANEL_TOKEN;
  if (!isAnalyticsEnvironmentSupported() || !token) {
    return false;
  }
  isTrackingAllowed = true;

  if (hasInitialized) {
    return false;
  }

  mixpanel.init(token, {
    autocapture: false,
    persistence: "localStorage",
    track_pageview: false,
  });
  hasInitialized = true;
  return true;
};

const track = (eventName: string, properties?: AnalyticsProperties): void => {
  if (!isAnalyticsReady()) {
    return;
  }

  mixpanel.track(eventName, sanitizeProperties(properties));
};

export const trackAnalyticsEvent = (
  eventName: string,
  properties?: AnalyticsProperties
): void => {
  track(eventName, properties);
};

export const identify = (
  profileId: number | string,
  traits?: AnalyticsProperties
): void => {
  if (!isAnalyticsReady()) {
    return;
  }

  const distinctId = String(profileId);
  if (identifiedDistinctId !== distinctId) {
    mixpanel.identify(distinctId);
    identifiedDistinctId = distinctId;
  }

  const sanitizedTraits = sanitizeProperties(traits);
  if (Object.keys(sanitizedTraits).length > 0) {
    mixpanel.people.set(sanitizedTraits);
  }
};

export const clearIdentity = (): void => {
  identifiedDistinctId = null;

  if (!isAnalyticsReady()) {
    return;
  }

  mixpanel.reset();
};

export const disableAnalytics = (): void => {
  isTrackingAllowed = false;
  identifiedDistinctId = null;

  if (!hasInitialized || !isAnalyticsEnvironmentSupported()) {
    return;
  }

  mixpanel.reset();
};

export const trackPageView = (
  path: string,
  properties?: AnalyticsProperties
): void => {
  const sanitizedProperties = sanitizeProperties(properties);
  const { path: _ignoredPath, ...pageViewProperties } = sanitizedProperties;

  track("Page Viewed", {
    ...pageViewProperties,
    path,
  });
};

export const trackAuthImpactEvent = (
  eventName: AuthImpactEventName,
  properties?: AuthImpactProperties
): void => {
  track(eventName, properties);
};
