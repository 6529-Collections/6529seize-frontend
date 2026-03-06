import { publicEnv } from "@/config/env";
import mixpanel from "mixpanel-browser";

type AnalyticsProperties = Record<
  string,
  boolean | number | string | null | undefined
>;

const MIXPANEL_TOKEN = publicEnv.NEXT_PUBLIC_MIXPANEL_TOKEN;

let hasInitialized = false;
let identifiedDistinctId: string | null = null;

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

const isAnalyticsEnabled = (): boolean => {
  return (
    typeof window !== "undefined" &&
    publicEnv.NODE_ENV === "production" &&
    typeof MIXPANEL_TOKEN === "string" &&
    MIXPANEL_TOKEN.length > 0
  );
};

const isAnalyticsReady = (): boolean => {
  return hasInitialized && isAnalyticsEnabled();
};

export const initAnalytics = (): boolean => {
  const token = MIXPANEL_TOKEN;
  if (!isAnalyticsEnabled() || hasInitialized || !token) {
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

export const reset = (): void => {
  identifiedDistinctId = null;

  if (!isAnalyticsReady()) {
    return;
  }

  mixpanel.reset();
};

export const trackPageView = (
  path: string,
  properties?: AnalyticsProperties
): void => {
  track("Page Viewed", {
    path,
    ...properties,
  });
};
