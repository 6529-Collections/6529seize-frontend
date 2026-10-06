import { publicEnv } from "@/config/env";
import mixpanel from "mixpanel-browser";
import type { BeforeSendHookPayload } from "mixpanel-browser";
import Cookies from "js-cookie";
import { CONSENT_PERFORMANCE_COOKIE } from "@/constants/constants";
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

let hasInitialized = false;
let identifiedDistinctId: string | null = null;
let isTrackingAllowed = false;
let analyticsGeneration = 0;

export const getAnalyticsGeneration = (): number => analyticsGeneration;
export const isAnalyticsTrackingAllowed = (): boolean => isAnalyticsReady();

const clearPrivateSuperProperties = (
  sdk: Pick<typeof mixpanel, "unregister"> = mixpanel
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
    !isAnalyticsEnvironmentSupported()
  )
    return false;
  try {
    return Cookies.get(CONSENT_PERFORMANCE_COOKIE) === "true";
  } catch {
    return false;
  }
};

const guardBatchDelivery = (): void => {
  // SDK 2.76.0 skips before_send_events for recovered orphaned queue entries.
  // Guard event and identity transports before starting any batch sender.
  type SdkBatcher = {
    sendRequest: (
      payloads: unknown[],
      options: unknown,
      onResponse: (response: unknown) => void
    ) => void;
  };
  const batchSdk = mixpanel as typeof mixpanel & {
    _batch_requests: boolean;
    request_batchers: Partial<
      Record<"events" | "people" | "groups", SdkBatcher>
    >;
  };
  // In 2.76.0 init_batchers runs synchronously before persistence/loaded.
  // Unsupported XHR/storage sets _batch_requests=false and uses the direct hook.
  if (!batchSdk.request_batchers.events && batchSdk._batch_requests === false)
    return;
  for (const kind of ["events", "people", "groups"] as const) {
    const batcher = batchSdk.request_batchers[kind];
    if (!batcher)
      throw new Error(`Mixpanel ${kind} batcher unavailable before startup`);
    const sendRequest = batcher.sendRequest.bind(batcher);
    batcher.sendRequest = (payloads, options, onResponse) => {
      if (!isAnalyticsReady()) {
        onResponse(1); // Drop a withdrawn batch without a network request.
        return;
      }
      const sanitized = payloads.map((payload) =>
        kind === "events"
          ? sanitizeMixpanelEnvelope(payload as BeforeSendHookPayload)
          : sanitizeMixpanelIdentityEnvelope(payload as Record<string, unknown>)
      );
      sendRequest(sanitized, options, onResponse);
    };
  }
};

const guardIdentityDelivery = (payload: Record<string, unknown>) =>
  isAnalyticsReady() ? sanitizeMixpanelIdentityEnvelope(payload) : null;

export const initAnalytics = (): boolean => {
  const token = MIXPANEL_TOKEN;
  if (!isAnalyticsEnvironmentSupported() || !token) {
    return false;
  }
  try {
    if (!isTrackingAllowed) analyticsGeneration += 1;
    isTrackingAllowed = true;
    if (hasInitialized) {
      mixpanel.start_batch_senders();
      return false;
    }
    // Runtime People/groups hooks are supported in 2.76.0 but omitted from its types.
    const hooks = {
      before_send_events: (payload: BeforeSendHookPayload) =>
        isAnalyticsReady() ? sanitizeMixpanelEnvelope(payload) : null,
      before_send_people: guardIdentityDelivery,
      before_send_groups: guardIdentityDelivery,
    };
    mixpanel.init(token, {
      ...MIXPANEL_PRIVACY_CONFIG,
      batch_autostart: false,
      persistence: "localStorage",
      loaded: (sdk) => {
        clearPrivateSuperProperties(sdk);
      },
      hooks,
    });
    clearPrivateSuperProperties();
    guardBatchDelivery();
    hasInitialized = true;
    mixpanel.start_batch_senders();
    return true;
  } catch {
    isTrackingAllowed = false;
    return false;
  }
};

const track = (eventName: string, properties?: AnalyticsProperties): void => {
  if (!isAnalyticsReady()) {
    return;
  }

  try {
    clearPrivateSuperProperties();
    mixpanel.track(eventName, sanitizeProperties(properties));
    // The SDK can repopulate search attribution while building an event.
    clearPrivateSuperProperties();
  } catch {
    // Telemetry must never interrupt a product action.
  }
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
  try {
    clearPrivateSuperProperties();
    if (identifiedDistinctId !== distinctId) {
      mixpanel.identify(distinctId);
      identifiedDistinctId = distinctId;
      analyticsGeneration += 1;
    }
    const sanitizedTraits = sanitizeProperties(traits);
    if (Object.keys(sanitizedTraits).length > 0) {
      mixpanel.people.set(sanitizedTraits);
    }
    clearPrivateSuperProperties();
  } catch {
    // Identity telemetry is also best effort.
  }
};

export const clearIdentity = (): void => {
  analyticsGeneration += 1;
  identifiedDistinctId = null;

  // Logout must clear local identity even while the delivery gate is closed.
  if (!hasInitialized || !isAnalyticsEnvironmentSupported()) {
    return;
  }

  try {
    mixpanel.reset();
  } catch {
    /* Best effort. */
  }
};

export const disableAnalytics = (): void => {
  analyticsGeneration += 1;
  isTrackingAllowed = false;
  identifiedDistinctId = null;

  if (!hasInitialized || !isAnalyticsEnvironmentSupported()) {
    return;
  }

  try {
    // Public SDK method (2.76.0), omitted from its bundled TypeScript interface.
    const batchControl = mixpanel as typeof mixpanel & {
      stop_batch_senders: () => void;
    };
    batchControl.stop_batch_senders();
    mixpanel.reset();
  } catch {
    /* The synchronous send gate is already closed. */
  }
};

export const trackPageView = (
  path: string,
  properties?: AnalyticsProperties
): void => {
  const sanitizedProperties = sanitizeProperties(properties);
  const { path: _ignoredPath, ...pageViewProperties } = sanitizedProperties;

  track(PAGE_VIEW_EVENT_NAME, {
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
