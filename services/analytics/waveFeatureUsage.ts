import {
  getAnalyticsGeneration,
  isAnalyticsTrackingAllowed,
  trackAnalyticsEvent,
} from "./mixpanel";

export const WAVE_FEATURE_EVENT_NAMES = [
  "Wave Feature Seen",
  "Wave Feature Activated",
] as const;

const WAVE_FEATURE_VALUES = {
  sidebar_section: ["recommendations", "active_votes"],
  sidebar_entry: [
    "recommendations_all",
    "recommendations_wave",
    "active_votes_all",
    "active_votes_wave",
    "profile_feed",
    "search",
  ],
  sidebar_collection: ["all", "pinned", "joined"],
  wave_tab: [
    "chat",
    "competitions",
    "leaderboard",
    "submissions",
    "sales",
    "winners",
    "outcome",
    "my_votes",
    "polls",
    "faq",
    "configuration",
    "about",
    "voters",
  ],
  leaderboard_sort: [
    "rank",
    "rating_prediction",
    "realtime_vote",
    "trend",
    "created_at",
    "price",
    "menu",
  ],
} as const;

export type WaveFeature = keyof typeof WAVE_FEATURE_VALUES;
export type WaveFeaturePlacement =
  | "sidebar"
  | "wave_tabs"
  | "leaderboard_tabs"
  | "leaderboard_dropdown";
type WaveFeatureAction = "choose" | "open" | "expand" | "collapse";
export interface WaveFeatureDescriptor {
  readonly feature: WaveFeature;
  readonly value: string;
  readonly placement: WaveFeaturePlacement;
  readonly selected: boolean;
}
export interface WaveFeatureContext {
  // Internal only. Never included in an event or persisted by this module.
  readonly key: string;
  readonly scope: string;
  readonly platform: "desktop_web" | "mobile_web" | "native" | "desktop_app";
  readonly viewer: "guest" | "profile" | "proxy";
  readonly routeFamily:
    | "/waves"
    | "/waves/:waveId"
    | "/my-stream"
    | "/messages"
    | "/messages/:waveId"
    | "/other";
}

let currentVisit: {
  key: string;
  seen: Set<string>;
  chosen: Set<string>;
} | null = null;
let visitEpoch = 0;
const visitResetListeners = new Set<() => void>();

export const getWaveFeatureVisitEpoch = (): number => visitEpoch;

export function subscribeWaveFeatureVisitReset(
  listener: () => void
): () => void {
  visitResetListeners.add(listener);
  return () => {
    visitResetListeners.delete(listener);
  };
}

export function resetWaveFeatureVisit(): void {
  visitEpoch += 1;
  currentVisit = null;
  for (const listener of visitResetListeners) {
    try {
      listener();
    } catch {
      /* Telemetry cannot interrupt navigation. */
    }
  }
}

function getVisit(context: WaveFeatureContext) {
  const key = `${getAnalyticsGeneration()}:${visitEpoch}:${context.key}`;
  if (currentVisit?.key !== key) {
    currentVisit = { key, seen: new Set(), chosen: new Set() };
  }
  return currentVisit;
}

function isDescriptorValid(descriptor: WaveFeatureDescriptor): boolean {
  return (
    WAVE_FEATURE_VALUES[descriptor.feature] as readonly string[]
  ).includes(descriptor.value);
}

function descriptorKey(
  context: WaveFeatureContext,
  descriptor: WaveFeatureDescriptor
): string {
  return `${context.scope}:${descriptor.feature}:${descriptor.placement}:${descriptor.value}`;
}

function properties(
  context: WaveFeatureContext,
  descriptor: WaveFeatureDescriptor
) {
  return {
    schema_version: 1,
    feature: descriptor.feature,
    value: descriptor.value,
    placement: descriptor.placement,
    platform: context.platform,
    viewer: context.viewer,
    eligibility: "available",
    route_family: context.routeFamily,
    selected: descriptor.selected,
    selection_source: getVisit(context).chosen.has(
      descriptorKey(context, descriptor)
    )
      ? "user"
      : "automatic",
  };
}

export function recordWaveFeatureSeen(
  context: WaveFeatureContext,
  descriptor: WaveFeatureDescriptor,
  exposureKind: "foreground_dwell" | "direct_activation"
): boolean {
  if (!isAnalyticsTrackingAllowed() || !isDescriptorValid(descriptor))
    return false;
  const visit = getVisit(context);
  const key = descriptorKey(context, descriptor);
  if (visit.seen.has(key)) return true;
  const accepted = trackAnalyticsEvent("Wave Feature Seen", {
    ...properties(context, descriptor),
    exposure_kind: exposureKind,
  });
  if (accepted) visit.seen.add(key);
  return accepted;
}

export function hasWaveFeatureBeenSeen(
  context: WaveFeatureContext,
  descriptor: WaveFeatureDescriptor
): boolean {
  return getVisit(context).seen.has(descriptorKey(context, descriptor));
}

export function recordWaveFeatureActivation(
  context: WaveFeatureContext,
  descriptor: WaveFeatureDescriptor,
  action: WaveFeatureAction
): void {
  if (!isAnalyticsTrackingAllowed() || !isDescriptorValid(descriptor)) return;
  getVisit(context).chosen.add(descriptorKey(context, descriptor));
  if (!recordWaveFeatureSeen(context, descriptor, "direct_activation")) return;
  trackAnalyticsEvent("Wave Feature Activated", {
    ...properties(context, descriptor),
    selection_source: "user",
    action,
  });
}

export function waveFeatureAttributes(feature: WaveFeature, value: string) {
  return { "data-wave-feature": feature, "data-wave-feature-value": value };
}

export function getWaveFeatureDescriptor(
  element: HTMLElement,
  placement: WaveFeaturePlacement
): WaveFeatureDescriptor | null {
  let feature = element.dataset["waveFeature"];
  let value = element.dataset["waveFeatureValue"];
  if (element.matches('[data-wave-feature-list="active-votes"] a')) {
    feature = "sidebar_entry";
    value = "active_votes_wave";
  }
  if (placement === "wave_tabs") {
    feature = "wave_tab";
    value =
      element.dataset["waveTabValue"] ??
      element
        .getAttribute("aria-controls")
        ?.replace("my-stream-wave-tabpanel-", "");
  }
  if (!feature || !Object.hasOwn(WAVE_FEATURE_VALUES, feature) || !value)
    return null;
  const descriptor = {
    feature: feature as WaveFeature,
    value,
    placement,
    selected:
      element.getAttribute("aria-selected") === "true" ||
      element.getAttribute("aria-pressed") === "true" ||
      element.getAttribute("aria-current") === "page",
  };
  return isDescriptorValid(descriptor) ? descriptor : null;
}

export function waveFeatureRouteFamily(
  pathname: string
): WaveFeatureContext["routeFamily"] {
  const routePath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (
    routePath === "/waves/create" ||
    routePath.startsWith("/waves/create/") ||
    routePath === "/messages/create" ||
    routePath.startsWith("/messages/create/")
  )
    return "/other";
  if (routePath === "/waves") return "/waves";
  if (routePath.startsWith("/waves/")) return "/waves/:waveId";
  if (routePath === "/my-stream") return "/my-stream";
  if (routePath === "/messages") return "/messages";
  if (routePath.startsWith("/messages/")) return "/messages/:waveId";
  return "/other";
}
