const initMock = jest.fn();
const trackMock = jest.fn();
const identifyMock = jest.fn();
const peopleSetMock = jest.fn();
const resetMock = jest.fn();
const unregisterMock = jest.fn();
const startBatchMock = jest.fn();
const stopBatchMock = jest.fn();
const sendBatchMock = jest.fn();

const mixpanelMock = {
  request_batchers: { events: { sendRequest: sendBatchMock } },
  persistence: {
    properties: () => ({ $initial_referrer: "legacy", mp_keyword: "legacy" }),
  },
  identify: identifyMock,
  init: initMock,
  people: {
    set: peopleSetMock,
  },
  reset: resetMock,
  track: trackMock,
  unregister: unregisterMock,
  start_batch_senders: startBatchMock,
  stop_batch_senders: stopBatchMock,
};

const loadModule = async ({
  nodeEnv,
  token,
}: {
  nodeEnv: string;
  token?: string;
}) => {
  jest.resetModules();
  initMock.mockReset();
  trackMock.mockReset();
  identifyMock.mockReset();
  peopleSetMock.mockReset();
  resetMock.mockReset();
  unregisterMock.mockReset();
  startBatchMock.mockReset();
  stopBatchMock.mockReset();
  sendBatchMock.mockReset();
  mixpanelMock.request_batchers.events.sendRequest = sendBatchMock;

  jest.doMock("@/config/env", () => ({
    publicEnv: {
      NEXT_PUBLIC_MIXPANEL_TOKEN: token,
      NODE_ENV: nodeEnv,
    },
  }));
  jest.doMock("mixpanel-browser", () => ({
    __esModule: true,
    default: mixpanelMock,
  }));

  return import("@/services/analytics/mixpanel");
};

describe("mixpanel analytics wrapper", () => {
  afterEach(() => {
    document.cookie = "performance-cookies-consent=; Max-Age=0; path=/";
  });

  it("blocks sends immediately when the consent cookie changes before the effect runs", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });
    analytics.initAnalytics();
    const config = initMock.mock.calls[0]?.[1];
    document.cookie = "performance-cookies-consent=false; path=/";
    expect(analytics.isAnalyticsTrackingAllowed()).toBe(false);
    analytics.trackAnalyticsEvent("Product Event");
    analytics.identify("42");
    expect(
      config.hooks.before_send_events({
        event: "Product Event",
        properties: {},
      })
    ).toBeNull();
    expect(trackMock).not.toHaveBeenCalled();
    expect(identifyMock).not.toHaveBeenCalled();
  });

  it("is a no-op outside production", async () => {
    const analytics = await loadModule({
      nodeEnv: "development",
      token: "public-token",
    });

    analytics.initAnalytics();
    analytics.trackPageView("/waves");
    analytics.identify("42");
    analytics.disableAnalytics();

    expect(initMock).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();
    expect(identifyMock).not.toHaveBeenCalled();
    expect(resetMock).not.toHaveBeenCalled();
  });

  it("is a no-op when the token is missing", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
    });

    analytics.initAnalytics();
    analytics.trackPageView("/waves");

    expect(initMock).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("initializes once and tracks production events", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });

    analytics.initAnalytics();
    analytics.initAnalytics();
    analytics.trackPageView("/waves", {
      has_connected_profile: true,
    });
    analytics.identify("42");
    analytics.identify("42");
    analytics.identify("42", { handle: "alice" });
    analytics.clearIdentity();
    analytics.trackPageView("/after-logout");

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(initMock).toHaveBeenCalledWith(
      "public-token",
      expect.objectContaining({
        autocapture: false,
        persistence: "localStorage",
        track_pageview: false,
        save_referrer: false,
        track_marketing: false,
        skip_first_touch_marketing: true,
        record_sessions_percent: 0,
      })
    );
    expect(trackMock).toHaveBeenCalledWith("Page Viewed", {
      has_connected_profile: true,
      path: "/waves",
    });
    expect(identifyMock).toHaveBeenCalledTimes(1);
    expect(identifyMock).toHaveBeenCalledWith("42");
    expect(peopleSetMock).toHaveBeenCalledWith({ handle: "alice" });
    expect(resetMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenLastCalledWith("Page Viewed", {
      path: "/after-logout",
    });
  });

  it("disables tracking until analytics is re-enabled", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });

    analytics.initAnalytics();
    analytics.disableAnalytics();
    analytics.trackPageView("/blocked");
    analytics.initAnalytics();
    analytics.trackAnalyticsEvent("Product Event", {
      product_failure: false,
    });
    analytics.trackPageView("/allowed");

    expect(trackMock).toHaveBeenCalledTimes(2);
    expect(trackMock).toHaveBeenCalledWith("Product Event", {
      product_failure: false,
    });
    expect(trackMock).toHaveBeenCalledWith("Page Viewed", {
      path: "/allowed",
    });
    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the page view path authoritative", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });

    analytics.initAnalytics();
    analytics.trackPageView("/waves", {
      has_connected_profile: true,
      path: "/poisoned",
    });

    expect(trackMock).toHaveBeenCalledWith("Page Viewed", {
      has_connected_profile: true,
      path: "/waves",
    });
  });

  it("tracks auth refresh impact events with sanitized low-cardinality properties", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });

    analytics.initAnalytics();
    analytics.trackAuthImpactEvent("Auth Session Refresh Recovered", {
      auth_state_after: "authenticated",
      auth_state_before: "refresh_needed",
      client_type: "web",
      endpoint_family: "auth_session_refresh",
      product_failure: false,
      reason: "session_refresh",
      refresh_outcome: "success",
      status_bucket: "2xx",
    });

    expect(trackMock).toHaveBeenCalledWith("Auth Session Refresh Recovered", {
      auth_state_after: "authenticated",
      auth_state_before: "refresh_needed",
      client_type: "web",
      endpoint_family: "auth_session_refresh",
      product_failure: false,
      reason: "session_refresh",
      refresh_outcome: "success",
      status_bucket: "2xx",
    });
  });

  it("closes the send-time gate and clears batching on withdrawal", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });
    analytics.initAnalytics();
    const config = initMock.mock.calls[0]?.[1];
    const payload = {
      event: "Wave Feature Seen",
      properties: {
        feature: "wave_tab",
        value: "chat",
        $current_url: "https://example.test/private?wallet=secret",
        $initial_referrer: "https://example.test/alice",
        profile_handle: "alice",
        distinct_id: "42",
      },
    };
    expect(config.hooks.before_send_events(payload).properties).toEqual({
      feature: "wave_tab",
      value: "chat",
      distinct_id: "42",
    });
    analytics.disableAnalytics();
    expect(config.hooks.before_send_events(payload)).toBeNull();
    expect(stopBatchMock).toHaveBeenCalledTimes(1);
    analytics.initAnalytics();
    expect(startBatchMock).toHaveBeenCalledTimes(2);
    expect(config.hooks.before_send_events(payload)).not.toBeNull();
  });

  it("fails open when SDK initialization, tracking or identity fails", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });
    initMock.mockImplementationOnce(() => {
      throw new Error("SDK unavailable");
    });
    expect(analytics.initAnalytics()).toBe(false);
    expect(analytics.isAnalyticsTrackingAllowed()).toBe(false);
    expect(analytics.initAnalytics()).toBe(true);
    trackMock.mockImplementation(() => {
      throw new Error("send failed");
    });
    identifyMock.mockImplementation(() => {
      throw new Error("identity failed");
    });
    expect(() => analytics.trackAnalyticsEvent("Product Event")).not.toThrow();
    expect(() => analytics.identify("42")).not.toThrow();
    expect(unregisterMock).toHaveBeenCalledWith("$initial_referrer");
    expect(unregisterMock).toHaveBeenCalledWith("mp_keyword");
  });

  it("guards orphaned batches at the final transport and drops them after consent withdrawal", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });
    analytics.initAnalytics();
    const onResponse = jest.fn();
    const payload = [
      {
        event: "Product Event",
        properties: { path: "/waves/:waveId", $current_url: "private" },
      },
    ];
    mixpanelMock.request_batchers.events.sendRequest(payload, {}, onResponse);
    expect(sendBatchMock).toHaveBeenCalledWith(
      [{ event: "Product Event", properties: { path: "/waves/:waveId" } }],
      {},
      onResponse
    );
    sendBatchMock.mockClear();
    document.cookie = "performance-cookies-consent=false; path=/";
    mixpanelMock.request_batchers.events.sendRequest(payload, {}, onResponse);
    expect(sendBatchMock).not.toHaveBeenCalled();
    expect(onResponse).toHaveBeenCalledWith(1);
  });
});
