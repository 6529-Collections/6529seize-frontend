import {
  getWaveFeatureDescriptor,
  hasWaveFeatureBeenSeen,
  recordWaveFeatureActivation,
  recordWaveFeatureSeen,
  resetWaveFeatureVisit,
  waveFeatureRouteFamily,
  type WaveFeatureContext,
} from "@/services/analytics/waveFeatureUsage";
import {
  sanitizeMixpanelEnvelope,
  MIXPANEL_PRIVATE_PROPERTIES,
} from "@/services/analytics/mixpanelPrivacy";
const mockTrack = jest.fn();
let mockAllowed = true;
let mockGeneration = 0;
jest.mock("@/services/analytics/mixpanel", () => ({
  getAnalyticsGeneration: () => mockGeneration,
  isAnalyticsTrackingAllowed: () => mockAllowed,
  trackAnalyticsEvent: (...args: unknown[]) => mockTrack(...args),
}));

const context: WaveFeatureContext = {
  key: "internal-route-and-viewer",
  scope: "internal-wave",
  platform: "desktop_web",
  viewer: "guest",
  routeFamily: "/waves/:waveId",
};
const descriptor = {
  feature: "wave_tab",
  value: "chat",
  placement: "wave_tabs",
  selected: true,
} as const;
beforeEach(() => {
  mockGeneration += 1;
  mockAllowed = true;
  mockTrack.mockReset().mockReturnValue(true);
});

it("starts a fresh visit after navigation away and back to the same route", () => {
  recordWaveFeatureSeen(context, descriptor, "foreground_dwell");
  resetWaveFeatureVisit();
  recordWaveFeatureSeen(context, descriptor, "foreground_dwell");
  expect(mockTrack).toHaveBeenCalledTimes(2);
});

it("deduplicates exposures across responsive copies and remounts, without suppressing deliberate actions", () => {
  recordWaveFeatureSeen(context, descriptor, "foreground_dwell");
  recordWaveFeatureSeen({ ...context }, { ...descriptor }, "foreground_dwell");
  recordWaveFeatureActivation(context, descriptor, "choose");
  recordWaveFeatureActivation(context, descriptor, "choose");
  expect(mockTrack.mock.calls.map(([event]) => event)).toEqual([
    "Wave Feature Seen",
    "Wave Feature Activated",
    "Wave Feature Activated",
  ]);
  expect(mockTrack.mock.calls[0]?.[1]).toMatchObject({
    selected: true,
    selection_source: "automatic",
  });
  expect(mockTrack.mock.calls[1]?.[1]).toMatchObject({
    selection_source: "user",
  });
  expect(JSON.stringify(mockTrack.mock.calls)).not.toContain("internal-");
});

it("records a fast action as direct exposure, and resets on navigation, viewer or consent generation changes", () => {
  recordWaveFeatureActivation(context, descriptor, "choose");
  expect(mockTrack.mock.calls[0]?.[1]).toMatchObject({
    exposure_kind: "direct_activation",
    selection_source: "user",
  });
  recordWaveFeatureSeen(
    { ...context, key: "another-visit" },
    descriptor,
    "foreground_dwell"
  );
  mockGeneration += 1;
  recordWaveFeatureSeen(context, descriptor, "foreground_dwell");
  expect(mockTrack).toHaveBeenCalledTimes(4);
});

it("retries Seen after synchronous tracking rejection before a later activation", () => {
  mockTrack.mockReturnValueOnce(false);
  recordWaveFeatureSeen(context, descriptor, "foreground_dwell");
  expect(hasWaveFeatureBeenSeen(context, descriptor)).toBe(false);
  recordWaveFeatureActivation(context, descriptor, "choose");
  expect(mockTrack.mock.calls.map(([event]) => event)).toEqual([
    "Wave Feature Seen",
    "Wave Feature Seen",
    "Wave Feature Activated",
  ]);
  expect(hasWaveFeatureBeenSeen(context, descriptor)).toBe(true);
  recordWaveFeatureSeen(context, descriptor, "foreground_dwell");
  expect(mockTrack).toHaveBeenCalledTimes(3);
});

it("requires accepted direct Seen before Activated, leaving a rejected attempt retryable", () => {
  mockTrack.mockReturnValueOnce(false);
  recordWaveFeatureActivation(context, descriptor, "choose");
  expect(mockTrack.mock.calls.map(([event]) => event)).toEqual([
    "Wave Feature Seen",
  ]);
  expect(hasWaveFeatureBeenSeen(context, descriptor)).toBe(false);
  recordWaveFeatureActivation(context, descriptor, "choose");
  expect(mockTrack.mock.calls.map(([event]) => event)).toEqual([
    "Wave Feature Seen",
    "Wave Feature Seen",
    "Wave Feature Activated",
  ]);
  expect(hasWaveFeatureBeenSeen(context, descriptor)).toBe(true);
});

it("does not send during withdrawn consent or transmit unbounded feature values", () => {
  mockAllowed = false;
  recordWaveFeatureSeen(context, descriptor, "foreground_dwell");
  recordWaveFeatureActivation(context, descriptor, "choose");
  mockAllowed = true;
  recordWaveFeatureSeen(
    context,
    { ...descriptor, value: "curation:private-name" },
    "foreground_dwell"
  );
  expect(mockTrack).not.toHaveBeenCalled();
});

it("keeps independent control scopes in the same visit without resetting the other surface", () => {
  recordWaveFeatureSeen(context, descriptor, "foreground_dwell");
  recordWaveFeatureSeen(
    { ...context, scope: "sidebar" },
    {
      feature: "sidebar_section",
      value: "active_votes",
      placement: "sidebar",
      selected: false,
    },
    "foreground_dwell"
  );
  recordWaveFeatureSeen(context, descriptor, "foreground_dwell");
  expect(mockTrack).toHaveBeenCalledTimes(2);
});

it("reads only known tab panel keys and normalizes dynamic route families", () => {
  const tab = document.createElement("button");
  tab.setAttribute("aria-controls", "my-stream-wave-tabpanel-my_votes");
  expect(getWaveFeatureDescriptor(tab, "wave_tabs")).toMatchObject({
    value: "my_votes",
  });
  tab.setAttribute(
    "aria-controls",
    "my-stream-wave-tabpanel-curation-private-id"
  );
  expect(getWaveFeatureDescriptor(tab, "wave_tabs")).toBeNull();
  expect(
    waveFeatureRouteFamily("/waves/private-id/competitions/private-competition")
  ).toBe("/waves/:waveId");
  expect(waveFeatureRouteFamily("/waves/create")).toBe("/other");
  expect(waveFeatureRouteFamily("/waves/create/")).toBe("/other");
  expect(waveFeatureRouteFamily("/alice/private")).toBe("/other");
});

it("removes SDK attribution after enrichment while preserving existing product and identity properties", () => {
  const toxic = Object.fromEntries(
    MIXPANEL_PRIVATE_PROPERTIES.map((key) => [key, "private-value"])
  );
  const event = sanitizeMixpanelEnvelope({
    event: "Page Viewed",
    properties: {
      ...toxic,
      path: "/waves/:waveId",
      logical_page: "wave_page",
      distinct_id: "42",
      $device_id: "device",
      token: "synthetic",
    },
  });
  expect(event.properties).toEqual({
    path: "/waves/:waveId",
    logical_page: "wave_page",
    distinct_id: "42",
    $device_id: "device",
    token: "synthetic",
  });
  expect(
    sanitizeMixpanelEnvelope({
      ...event,
      event: "Wave Feature Seen",
      properties: {
        ...event.properties,
        profile_handle: "alice",
        feature: "wave_tab",
        value: "chat",
      },
    }).properties
  ).toEqual({
    distinct_id: "42",
    $device_id: "device",
    token: "synthetic",
    feature: "wave_tab",
    value: "chat",
  });
});

it.each([
  ["/waves/create", "/other"],
  ["/waves/create/", "/other"],
  ["/waves/create/step", "/other"],
  ["/messages/create", "/other"],
  ["/messages/create/", "/other"],
  ["/messages/create/step", "/other"],
  ["/waves/", "/waves"],
  ["/messages/", "/messages"],
  ["/my-stream/", "/my-stream"],
  ["/messages/private-id", "/messages/:waveId"],
  ["/messages/private-id/", "/messages/:waveId"],
  ["/messages/create-private-id", "/messages/:waveId"],
  ["/waves/create-private-id", "/waves/:waveId"],
  ["/", "/other"],
])(
  "classifies %s as %s without mixing creation and detail cohorts",
  (path, family) => {
    expect(waveFeatureRouteFamily(path)).toBe(family);
  }
);
