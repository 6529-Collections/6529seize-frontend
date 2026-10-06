const initMock = jest.fn();
const trackMock = jest.fn();
const identifyMock = jest.fn();
const peopleSetMock = jest.fn();
const resetMock = jest.fn();
const unregisterMock = jest.fn();
const startBatchMock = jest.fn();
const stopBatchMock = jest.fn();
const sendBatchMock = jest.fn();
const sendPeopleMock = jest.fn();
const sendGroupsMock = jest.fn();
const createBatcher = (sendRequest: typeof sendBatchMock) => ({
  sendRequest,
  enqueue: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue(true),
  flush: jest.fn<Promise<unknown>, [unknown?]>().mockResolvedValue(undefined),
  clear: jest.fn<Promise<unknown>, []>().mockResolvedValue(undefined),
});
const originalBatchers = {
  events: createBatcher(sendBatchMock),
  people: createBatcher(sendPeopleMock),
  groups: createBatcher(sendGroupsMock),
};
const batcherMethods = new Map(
  Object.values(originalBatchers).map((batcher) => [
    batcher,
    {
      enqueue: batcher.enqueue,
      flush: batcher.flush,
      clear: batcher.clear,
    },
  ])
);

const mixpanelMock = {
  _batch_requests: true,
  request_batchers: originalBatchers,
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
  trackMock.mockReset().mockReturnValue({ event: "accepted", properties: {} });
  identifyMock.mockReset();
  peopleSetMock.mockReset();
  resetMock.mockReset();
  unregisterMock.mockReset();
  startBatchMock.mockReset().mockImplementation(() => {
    mixpanelMock._batch_requests = true;
  });
  stopBatchMock.mockReset().mockImplementation(() => {
    mixpanelMock._batch_requests = false;
    Object.values(mixpanelMock.request_batchers).forEach((batcher) => {
      void batcher.clear();
    });
  });
  sendBatchMock.mockReset();
  sendPeopleMock.mockReset();
  sendGroupsMock.mockReset();
  mixpanelMock._batch_requests = true;
  mixpanelMock.request_batchers.events.sendRequest = sendBatchMock;
  mixpanelMock.request_batchers.people.sendRequest = sendPeopleMock;
  mixpanelMock.request_batchers.groups.sendRequest = sendGroupsMock;
  for (const [batcher, methods] of batcherMethods) {
    batcher.enqueue = methods.enqueue.mockReset().mockResolvedValue(true);
    batcher.flush = methods.flush.mockReset().mockResolvedValue(undefined);
    batcher.clear = methods.clear.mockReset().mockResolvedValue(undefined);
  }

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

const retryAfterClearing = async (
  analytics: Awaited<ReturnType<typeof loadModule>>
) => {
  const recovered = jest.fn();
  const unsubscribe = analytics.subscribeAnalyticsRecovery(recovered);
  analytics.initAnalytics();
  await waitFor(() => expect(recovered).toHaveBeenCalledTimes(1));
  unsubscribe();
  analytics.initAnalytics();
};

describe("mixpanel analytics wrapper", () => {
  beforeEach(() => {
    document.cookie = "performance-cookies-consent=true; path=/";
  });
  afterEach(() => {
    document.cookie = "performance-cookies-consent=; Max-Age=0; path=/";
  });

  it.each(["people", "groups"] as const)(
    "guards direct, pending and recovered %s updates while preserving explicit traits",
    async (kind) => {
      const analytics = await loadModule({
        nodeEnv: "production",
        token: "public-token",
      });
      analytics.initAnalytics();
      const config = initMock.mock.calls[0]?.[1];
      const hook = config.hooks[`before_send_${kind}`];
      const payload = {
        $token: "public-token",
        $distinct_id: "42",
        $set: { handle: "alice", $current_url: "private-url" },
        $set_once: {
          plan: "legacy",
          initial_plan: "explicit-trait",
          $initial_referrer: "private-referrer",
          initial_utm_source: "private-source",
          initial_utm_campaign: "private-campaign",
        },
      };
      const expected = {
        $token: "public-token",
        $distinct_id: "42",
        $set: { handle: "alice" },
        $set_once: { plan: "legacy", initial_plan: "explicit-trait" },
      };
      expect(hook(payload)).toEqual(expected);
      const send = kind === "people" ? sendPeopleMock : sendGroupsMock;
      mixpanelMock.request_batchers[kind].sendRequest([payload], {}, jest.fn());
      expect(send).toHaveBeenCalledWith([expected], {}, expect.any(Function));
      send.mockClear();
      document.cookie = "performance-cookies-consent=; Max-Age=0; path=/";
      expect(hook(payload)).toBeNull();
      const dropped = jest.fn();
      mixpanelMock.request_batchers[kind].sendRequest([payload], {}, dropped);
      expect(send).not.toHaveBeenCalled();
      expect(dropped).toHaveBeenCalledWith(1);
    }
  );

  it.each([true, false])(
    "only allows a missing event batcher when SDK batching is disabled (%s)",
    async (batching) => {
      const analytics = await loadModule({
        nodeEnv: "production",
        token: "public-token",
      });
      const batchers = { ...mixpanelMock.request_batchers };
      mixpanelMock._batch_requests = batching;
      if (batching)
        Reflect.deleteProperty(mixpanelMock.request_batchers, "events");
      else
        for (const kind of ["events", "people", "groups"] as const)
          Reflect.deleteProperty(mixpanelMock.request_batchers, kind);
      try {
        expect(analytics.initAnalytics()).toBe(!batching);
        analytics.trackAnalyticsEvent("Product Event");
        expect(startBatchMock).toHaveBeenCalledTimes(batching ? 0 : 1);
        expect(trackMock).toHaveBeenCalledTimes(batching ? 0 : 1);
      } finally {
        Object.assign(mixpanelMock.request_batchers, batchers);
      }
    }
  );

  it("keeps delivery closed if persisted private properties cannot be scrubbed", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });
    const persistence = jest
      .spyOn(mixpanelMock.persistence, "properties")
      .mockImplementation(() => {
        throw new Error("Persistence unavailable");
      });
    try {
      expect(analytics.initAnalytics()).toBe(false);
      expect(analytics.isAnalyticsTrackingAllowed()).toBe(false);
      expect(startBatchMock).not.toHaveBeenCalled();
      expect(() =>
        analytics.trackAnalyticsEvent("Product Event")
      ).not.toThrow();
      expect(trackMock).not.toHaveBeenCalled();
    } finally {
      persistence.mockRestore();
    }
  });

  it("fails closed without interrupting controls when cookie access throws", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });
    analytics.initAnalytics();
    const cookie = jest
      .spyOn(document, "cookie", "get")
      .mockImplementation(() => {
        throw new Error("Cookie access unavailable");
      });
    try {
      expect(analytics.isAnalyticsTrackingAllowed()).toBe(false);
      expect(() =>
        analytics.trackAnalyticsEvent("Product Event")
      ).not.toThrow();
      expect(() => analytics.identify("42")).not.toThrow();
      expect(() => analytics.clearIdentity()).not.toThrow();
      expect(resetMock).toHaveBeenCalledTimes(1);
      expect(trackMock).not.toHaveBeenCalled();
    } finally {
      cookie.mockRestore();
    }
  });

  it.each([undefined, "invalid", "false"])(
    "clears local logout identity while delivery consent is unavailable (%s)",
    async (consent) => {
      const analytics = await loadModule({
        nodeEnv: "production",
        token: "public-token",
      });
      analytics.initAnalytics();
      analytics.identify("42");
      document.cookie =
        consent === undefined
          ? "performance-cookies-consent=; Max-Age=0; path=/"
          : `performance-cookies-consent=${consent}; path=/`;
      analytics.clearIdentity();
      expect(resetMock).toHaveBeenCalledTimes(1);
      analytics.trackAnalyticsEvent("Product Event");
      expect(trackMock).not.toHaveBeenCalled();
      document.cookie = "performance-cookies-consent=true; path=/";
      analytics.identify("42");
      expect(identifyMock).toHaveBeenCalledTimes(2);
    }
  );

  it.each([undefined, "invalid", "false"])(
    "blocks delivery when consent is missing or malformed (%s)",
    async (consent) => {
      const analytics = await loadModule({
        nodeEnv: "production",
        token: "public-token",
      });
      analytics.initAnalytics();
      document.cookie =
        consent === undefined
          ? "performance-cookies-consent=; Max-Age=0; path=/"
          : `performance-cookies-consent=${consent}; path=/`;
      analytics.trackAnalyticsEvent("Product Event");
      expect(trackMock).not.toHaveBeenCalled();
      const payload = { event: "Product Event", properties: {} };
      expect(
        initMock.mock.calls[0]?.[1].hooks.before_send_events(payload)
      ).toBeNull();
      mixpanelMock.request_batchers.events.sendRequest(
        [payload],
        {},
        jest.fn()
      );
      expect(sendBatchMock).not.toHaveBeenCalled();
    }
  );

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
    await retryAfterClearing(analytics);
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

  it.each(["logout", "disable"] as const)(
    "keeps delivery closed after %s reset fails until reset recovery succeeds",
    async (operation) => {
      const analytics = await loadModule({
        nodeEnv: "production",
        token: "public-token",
      });
      analytics.initAnalytics();
      analytics.identify("42");
      resetMock.mockImplementation(() => {
        throw new Error("Synthetic persistence failure");
      });

      if (operation === "logout") analytics.clearIdentity();
      else analytics.disableAnalytics();
      expect(analytics.isAnalyticsTrackingAllowed()).toBe(false);
      expect(analytics.initAnalytics()).toBe(false);
      if (operation === "disable") await retryAfterClearing(analytics);
      expect(analytics.isAnalyticsTrackingAllowed()).toBe(false);
      expect(analytics.trackAnalyticsEvent("Guest Event")).toBe(false);
      expect(analytics.identify("43")).toBe(false);
      expect(trackMock).not.toHaveBeenCalled();
      expect(startBatchMock).toHaveBeenCalledTimes(1);
      const config = initMock.mock.calls[0]?.[1];
      expect(
        config.hooks.before_send_events({
          event: "Guest Event",
          properties: {},
        })
      ).toBeNull();
      expect(
        config.hooks.before_send_people({ $distinct_id: "42" })
      ).toBeNull();
      expect(config.hooks.before_send_groups({ $group_id: "42" })).toBeNull();
      for (const kind of ["events", "people", "groups"] as const) {
        mixpanelMock.request_batchers[kind].sendRequest([], {}, jest.fn());
      }
      expect(sendBatchMock).not.toHaveBeenCalled();
      expect(sendPeopleMock).not.toHaveBeenCalled();
      expect(sendGroupsMock).not.toHaveBeenCalled();

      resetMock.mockImplementation(() => undefined);
      analytics.initAnalytics();
      expect(resetMock).toHaveBeenCalledTimes(3);
      expect(analytics.isAnalyticsTrackingAllowed()).toBe(true);
      expect(startBatchMock).toHaveBeenCalledTimes(2);
      expect(analytics.trackAnalyticsEvent("Guest Event")).toBe(true);
      expect(identifyMock).toHaveBeenCalledTimes(1);
    }
  );

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
    await retryAfterClearing(analytics);
    expect(startBatchMock).toHaveBeenCalledTimes(2);
    expect(config.hooks.before_send_events(payload)).not.toBeNull();
  });

  it("blocks rapid regrant until every queue has cleared and coalesces repeated withdrawal", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });
    const releases: Array<() => void> = [];
    for (const methods of batcherMethods.values()) {
      methods.clear.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            releases.push(resolve);
          })
      );
    }
    analytics.initAnalytics();
    analytics.disableAnalytics();
    analytics.disableAnalytics();
    const recovered = jest.fn();
    const unsubscribe = analytics.subscribeAnalyticsRecovery(recovered);
    analytics.initAnalytics();
    await waitFor(() => expect(releases).toHaveLength(3));
    expect(stopBatchMock).toHaveBeenCalledTimes(1);
    expect(analytics.isAnalyticsTrackingAllowed()).toBe(false);
    expect(analytics.trackAnalyticsEvent("Withdrawn Event")).toBe(false);
    expect(analytics.identify("43", { plan: "explicit" })).toBe(false);
    const config = initMock.mock.calls[0]?.[1];
    for (const kind of ["events", "people", "groups"] as const) {
      expect(config.hooks[`before_send_${kind}`]({})).toBeNull();
      mixpanelMock.request_batchers[kind].sendRequest([], {}, jest.fn());
    }
    expect(sendBatchMock).not.toHaveBeenCalled();
    expect(sendPeopleMock).not.toHaveBeenCalled();
    expect(sendGroupsMock).not.toHaveBeenCalled();
    releases[0]?.();
    releases[1]?.();
    analytics.initAnalytics();
    expect(startBatchMock).toHaveBeenCalledTimes(1);
    expect(recovered).not.toHaveBeenCalled();
    releases[2]?.();
    await waitFor(() => expect(recovered).toHaveBeenCalledTimes(1));
    unsubscribe();
    expect(analytics.isAnalyticsTrackingAllowed()).toBe(false);
    analytics.initAnalytics();
    expect(analytics.identify("43")).toBe(true);
    expect(analytics.trackAnalyticsEvent("New Event")).toBe(true);
    expect(startBatchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps a rejected deletion closed and retries clearing before reinitializing", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });
    const events = batcherMethods.get(originalBatchers.events);
    if (!events) throw new Error("Missing event batcher mock");
    events.clear.mockRejectedValueOnce(new Error("Storage deletion failed"));
    analytics.initAnalytics();
    analytics.disableAnalytics();
    const recovered = jest.fn();
    const unsubscribe = analytics.subscribeAnalyticsRecovery(recovered);
    analytics.initAnalytics();
    await waitFor(() => expect(events.clear).toHaveBeenCalledTimes(1));
    expect(recovered).not.toHaveBeenCalled();
    expect(analytics.isAnalyticsTrackingAllowed()).toBe(false);
    expect(analytics.trackAnalyticsEvent("Withdrawn Event")).toBe(false);
    analytics.initAnalytics();
    expect(analytics.isAnalyticsTrackingAllowed()).toBe(false);
    await waitFor(() => expect(recovered).toHaveBeenCalledTimes(1));
    expect(events.clear).toHaveBeenCalledTimes(2);
    expect(startBatchMock).toHaveBeenCalledTimes(1);
    unsubscribe();
    analytics.initAnalytics();
    expect(analytics.trackAnalyticsEvent("New Event")).toBe(true);
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

  it.each(["scrub", "identify", "traits"] as const)(
    "closes delivery after profile switching fails during %s and retries after reinitialization",
    async (failure) => {
      const analytics = await loadModule({
        nodeEnv: "production",
        token: "public-token",
      });
      analytics.initAnalytics();
      expect(analytics.identify("42")).toBe(true);
      const generation = analytics.getAnalyticsGeneration();
      const operations = {
        scrub: unregisterMock,
        identify: identifyMock,
        traits: peopleSetMock,
      };
      operations[failure].mockImplementationOnce(() => {
        throw new Error("Synthetic profile transition failure");
      });

      expect(analytics.identify("43", { plan: "explicit" })).toBe(false);
      expect(analytics.isAnalyticsTrackingAllowed()).toBe(false);
      expect(analytics.getAnalyticsGeneration()).toBeGreaterThan(generation);
      expect(stopBatchMock).toHaveBeenCalledTimes(1);
      expect(resetMock).toHaveBeenCalledTimes(1);
      expect(analytics.identify("43")).toBe(false);
      analytics.trackAnalyticsEvent("Product Event");
      expect(trackMock).not.toHaveBeenCalled();
      const config = initMock.mock.calls[0]?.[1];
      expect(
        config.hooks.before_send_events({
          event: "Product Event",
          properties: {},
        })
      ).toBeNull();
      expect(
        config.hooks.before_send_people({ $distinct_id: "42" })
      ).toBeNull();
      for (const kind of ["events", "people", "groups"] as const) {
        mixpanelMock.request_batchers[kind].sendRequest([], {}, jest.fn());
      }
      expect(sendBatchMock).not.toHaveBeenCalled();
      expect(sendPeopleMock).not.toHaveBeenCalled();
      expect(sendGroupsMock).not.toHaveBeenCalled();

      await retryAfterClearing(analytics);
      expect(analytics.identify("43")).toBe(true);
      expect(identifyMock).toHaveBeenLastCalledWith("43");
      analytics.trackAnalyticsEvent("Product Event");
      expect(trackMock).toHaveBeenCalledTimes(1);
    }
  );

  it.each([false, null, undefined])(
    "reports a rejected SDK tracking attempt (%s) without interrupting controls",
    async (result) => {
      const analytics = await loadModule({
        nodeEnv: "production",
        token: "public-token",
      });
      analytics.initAnalytics();
      trackMock.mockReturnValueOnce(result);
      expect(analytics.trackAnalyticsEvent("Product Event")).toBe(false);
      expect(analytics.trackAnalyticsEvent("Product Event")).toBe(true);
    }
  );

  it("reports synchronous tracking failure and accepts a later retry", async () => {
    const analytics = await loadModule({
      nodeEnv: "production",
      token: "public-token",
    });
    analytics.initAnalytics();
    trackMock.mockImplementationOnce(() => {
      throw new Error("Synthetic tracking failure");
    });
    expect(analytics.trackPageView("/waves")).toBe(false);
    expect(analytics.trackPageView("/waves")).toBe(true);
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
import { waitFor } from "@testing-library/react";
