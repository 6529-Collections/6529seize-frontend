const initMock = jest.fn();
const trackMock = jest.fn();
const identifyMock = jest.fn();
const peopleSetMock = jest.fn();
const resetMock = jest.fn();

const mixpanelMock = {
  identify: identifyMock,
  init: initMock,
  people: {
    set: peopleSetMock,
  },
  reset: resetMock,
  track: trackMock,
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
    expect(initMock).toHaveBeenCalledWith("public-token", {
      autocapture: false,
      persistence: "localStorage",
      track_pageview: false,
    });
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

  it("tracks auth impact events with sanitized low-cardinality properties", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });

    analytics.initAnalytics();
    analytics.trackAuthImpactEvent("Auth Reauth Prompt Shown", {
      auth_state_after: "reauth_prompt",
      auth_state_before: "authenticated",
      client_type: "web",
      page_group: "waves",
      reason: "auth_validation_failed",
      route_pattern: "/waves/:waveId",
      was_connected_wallet: true,
    });

    expect(trackMock).toHaveBeenCalledWith("Auth Reauth Prompt Shown", {
      auth_state_after: "reauth_prompt",
      auth_state_before: "authenticated",
      client_type: "web",
      page_group: "waves",
      reason: "auth_validation_failed",
      route_pattern: "/waves/:waveId",
      was_connected_wallet: true,
    });
  });
});
