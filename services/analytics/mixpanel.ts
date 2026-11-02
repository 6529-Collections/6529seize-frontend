import { publicEnv } from "@/config/env";
import type { BeforeSendHookPayload } from "mixpanel-browser";
import Cookies from "js-cookie";
import { CONSENT_PERFORMANCE_COOKIE } from "@/constants/constants";
import { guardMixpanelBatching, type BatchSdk } from "./mixpanelBatching";
import {
  getLoadedMixpanelSdk,
  loadMixpanelSdk,
  type MixpanelSdk,
} from "./mixpanelSdk";
import {
  MIXPANEL_PRIVATE_PROPERTIES,
  MIXPANEL_PRIVACY_CONFIG,
  sanitizeMixpanelEnvelope,
  sanitizeMixpanelIdentityEnvelope,
} from "./mixpanelPrivacy";

export type AnalyticsProperties = Record<
  string,
  boolean | number | string | null | undefined
>;

export const PAGE_VIEW_EVENT_NAME = "Page Viewed";

export const AUTH_IMPACT_EVENT_NAMES = [
  "Auth Forced Logout",
  "Auth Reauth Prompt Shown",
  "Auth Session Refresh Recovered",
  "Auth Session Refresh Succeeded",
  "Auth Session Upgrade Prompt Shown",
  "Auth Validation Cancelled",
  "Auth Validation Failed While Connected",
] as const;

export type AuthImpactEventName = (typeof AUTH_IMPACT_EVENT_NAMES)[number];

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

// Set by the first successful initialization; every SDK call happens after it.
let mixpanel: MixpanelSdk | undefined;
let hasInitialized = false;
let identifiedDistinctId: string | null = null;
let identityResetPending = false;
let isTrackingAllowed = false;
let analyticsGeneration = 0;
let batchGuard: ReturnType<typeof guardMixpanelBatching> | undefined;
let queueClearState: "ready" | "pending" | "failed" = "ready";
let resumeRequested = false;
let sdkInitRequested = false;
let sdkDownloadPending = false;
const recoveryListeners = new Set<() => void>();

export const subscribeAnalyticsRecovery = (
  listener: () => void
): (() => void) => {
  recoveryListeners.add(listener);
  return () => {
    recoveryListeners.delete(listener);
  };
};

const notifyAnalyticsRecovery = (): void => {
  for (const listener of recoveryListeners) {
    try {
      listener();
    } catch {
      /* Optional telemetry recovery. */
    }
  }
};

const clearAnalyticsQueues = (): void => {
  if (queueClearState === "pending") return;
  queueClearState = "pending";
  if (!batchGuard) {
    queueClearState = "failed";
    return;
  }
  void batchGuard.stopAndClear().then(
    () => {
      queueClearState = "ready";
      if (!resumeRequested) return;
      resumeRequested = false;
      notifyAnalyticsRecovery();
    },
    () => {
      queueClearState = "failed";
    }
  );
};

export const getAnalyticsGeneration = (): number => analyticsGeneration;
export const isAnalyticsTrackingAllowed = (): boolean => isAnalyticsReady();

const clearPrivateSuperProperties = (
  sdk: Pick<MixpanelSdk, "unregister">
): void => {
  // Exported by the pinned SDK; read once rather than rereading storage for every absent key.
  const persistenceSdk = sdk as typeof sdk & {
    persistence: { properties: () => Record<string, unknown> };
  };
  const persisted = persistenceSdk.persistence.properties();
  for (const key of MIXPANEL_PRIVATE_PROPERTIES) {
    if (Object.hasOwn(persisted, key)) sdk.unregister(key);
  }
};

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
  if (
    !hasInitialized ||
    !isTrackingAllowed ||
    identityResetPending ||
    queueClearState !== "ready" ||
    !isAnalyticsEnvironmentSupported()
  )
    return false;
  try {
    return Cookies.get(CONSENT_PERFORMANCE_COOKIE) === "true";
  } catch {
    return false;
  }
};

const guardIdentityDelivery = (payload: Record<string, unknown>) =>
  isAnalyticsReady() ? sanitizeMixpanelIdentityEnvelope(payload) : null;

// Callers reach initAnalytics only once consent allows analytics, so this is
// the first point where the SDK download is permitted. Initialization finishes
// when it arrives unless consent was withdrawn meanwhile; recovery listeners
// then retry the identity and page-view work that found analytics not ready.
// One continuation serves every request made while a download is pending. A
// failed download releases it, so the next request downloads again. An SDK
// that arrives after withdrawal stays loaded and initializes synchronously on
// the next consented initAnalytics call.
const initializeWhenSdkLoads = (): void => {
  sdkInitRequested = true;
  if (sdkDownloadPending) return;
  sdkDownloadPending = true;
  const finish = (sdk: MixpanelSdk | undefined): void => {
    sdkDownloadPending = false;
    if (!sdk || !sdkInitRequested) return;
    sdkInitRequested = false;
    if (initAnalytics()) notifyAnalyticsRecovery();
  };
  void loadMixpanelSdk().then(finish, () => finish(undefined));
};

export const initAnalytics = (): boolean => {
  const token = MIXPANEL_TOKEN;
  if (!isAnalyticsEnvironmentSupported() || !token) {
    return false;
  }
  const sdk = mixpanel ?? getLoadedMixpanelSdk();
  if (!sdk) {
    initializeWhenSdkLoads();
    return false;
  }
  mixpanel = sdk;
  if (queueClearState !== "ready") {
    resumeRequested = true;
    if (queueClearState === "failed") clearAnalyticsQueues();
    return false;
  }
  try {
    if (identityResetPending) {
      sdk.reset();
      identityResetPending = false;
    }
    if (!isTrackingAllowed) analyticsGeneration += 1;
    isTrackingAllowed = true;
    if (hasInitialized) {
      sdk.start_batch_senders();
      return false;
    }
    // Runtime People/groups hooks are supported in 2.76.0 but omitted from its types.
    const hooks = {
      before_send_events: (payload: BeforeSendHookPayload) =>
        isAnalyticsReady() ? sanitizeMixpanelEnvelope(payload) : null,
      before_send_people: guardIdentityDelivery,
      before_send_groups: guardIdentityDelivery,
    };
    sdk.init(token, {
      ...MIXPANEL_PRIVACY_CONFIG,
      batch_autostart: false,
      persistence: "localStorage",
      loaded: (loadedSdk) => {
        clearPrivateSuperProperties(loadedSdk);
      },
      hooks,
    });
    clearPrivateSuperProperties(sdk);
    batchGuard = guardMixpanelBatching(
      sdk as MixpanelSdk & BatchSdk,
      isAnalyticsReady
    );
    hasInitialized = true;
    sdk.start_batch_senders();
    return true;
  } catch {
    isTrackingAllowed = false;
    return false;
  }
};

const track = (
  eventName: string,
  properties?: AnalyticsProperties
): boolean => {
  const sdk = mixpanel;
  if (!sdk || !isAnalyticsReady()) {
    return false;
  }

  try {
    clearPrivateSuperProperties(sdk);
    // 2.76.0 documents an acceptance result, omitted from its bundled types.
    const sdkTrack = sdk.track.bind(sdk) as (
      name: string,
      properties: ReturnType<typeof sanitizeProperties>
    ) => unknown;
    const accepted = sdkTrack(eventName, sanitizeProperties(properties));
    // The SDK can repopulate search attribution while building an event.
    clearPrivateSuperProperties(sdk);
    return Boolean(accepted);
  } catch {
    // Telemetry must never interrupt a product action.
    return false;
  }
};

export const trackAnalyticsEvent = (
  eventName: string,
  properties?: AnalyticsProperties
): boolean => {
  return track(eventName, properties);
};

export const identify = (
  profileId: number | string,
  traits?: AnalyticsProperties
): boolean => {
  const sdk = mixpanel;
  if (!sdk || !isAnalyticsReady()) {
    return false;
  }

  const distinctId = String(profileId);
  try {
    clearPrivateSuperProperties(sdk);
    if (identifiedDistinctId !== distinctId) {
      sdk.identify(distinctId);
      identifiedDistinctId = distinctId;
      analyticsGeneration += 1;
    }
    const sanitizedTraits = sanitizeProperties(traits);
    if (Object.keys(sanitizedTraits).length > 0) {
      sdk.people.set(sanitizedTraits);
    }
    clearPrivateSuperProperties(sdk);
    return true;
  } catch {
    // A failed profile transition must never deliver under the previous identity.
    disableAnalytics();
    return false;
  }
};

export const clearIdentity = (): void => {
  analyticsGeneration += 1;
  identifiedDistinctId = null;

  // Logout must clear local identity even while the delivery gate is closed.
  const sdk = mixpanel;
  if (!sdk || !hasInitialized || !isAnalyticsEnvironmentSupported()) {
    return;
  }

  identityResetPending = true;
  try {
    sdk.reset();
    identityResetPending = false;
  } catch {
    isTrackingAllowed = false;
  }
};

export const disableAnalytics = (): void => {
  analyticsGeneration += 1;
  isTrackingAllowed = false;
  identifiedDistinctId = null;
  resumeRequested = false;
  // Withdrawal during the SDK download keeps it from initializing on arrival.
  sdkInitRequested = false;

  const sdk = mixpanel;
  if (!sdk || !hasInitialized || !isAnalyticsEnvironmentSupported()) {
    return;
  }

  identityResetPending = true;
  clearAnalyticsQueues();
  try {
    sdk.reset();
    identityResetPending = false;
  } catch {
    /* Delivery stays closed until queues clear and initialization resets identity. */
  }
};

export const trackPageView = (
  path: string,
  properties?: AnalyticsProperties
): boolean => {
  const sanitizedProperties = sanitizeProperties(properties);
  const { path: _ignoredPath, ...pageViewProperties } = sanitizedProperties;

  return track(PAGE_VIEW_EVENT_NAME, {
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
