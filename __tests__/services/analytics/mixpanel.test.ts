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
    analytics.track("Button Clicked", { button_name: "create_wave" });
    analytics.identify("42");
    analytics.reset();

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
    analytics.track("Button Clicked", { button_name: "create_wave" });

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
    analytics.reset();

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
  });
});
