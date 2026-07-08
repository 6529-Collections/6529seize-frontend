type ProductImpactTelemetryModule =
  typeof import("@/services/analytics/productImpactTelemetry");

const trackAnalyticsEventMock = jest.fn();

async function loadProductImpactTelemetry(): Promise<{
  readonly telemetry: ProductImpactTelemetryModule;
  readonly sentry: {
    readonly logger: {
      readonly info: jest.Mock;
      readonly warn: jest.Mock;
    };
  };
}> {
  jest.resetModules();
  trackAnalyticsEventMock.mockReset();

  const sentry = {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
    },
  };

  jest.doMock("@sentry/nextjs", () => sentry);
  jest.doMock("@/services/analytics/mixpanel", () => ({
    trackAnalyticsEvent: trackAnalyticsEventMock,
  }));

  const telemetry = await import("@/services/analytics/productImpactTelemetry");
  return { telemetry, sentry };
}

describe("productImpactTelemetry", () => {
  beforeEach(() => {
    globalThis.history.pushState({}, "", "/");
  });

  it("tracks wave feed route families without raw wave or drop ids", async () => {
    const { telemetry } = await loadProductImpactTelemetry();
    globalThis.history.pushState(
      {},
      "",
      "/waves/private-wave-id?drop=private-drop-id"
    );

    telemetry.trackWaveFeedLoadSucceeded({
      dropCount: 3,
      durationMs: 1200,
      hadCachedDrops: false,
      isNative: false,
      loadSource: "initial_visible",
    });

    expect(trackAnalyticsEventMock).toHaveBeenCalledWith(
      "Wave Feed Load Succeeded",
      expect.objectContaining({
        route_family: "/waves/:waveId",
      })
    );
    expect(JSON.stringify(trackAnalyticsEventMock.mock.calls)).not.toContain(
      "private-wave-id"
    );
    expect(JSON.stringify(trackAnalyticsEventMock.mock.calls)).not.toContain(
      "private-drop-id"
    );
  });

  it("tracks auth refresh route families without raw profile handles", async () => {
    const { telemetry } = await loadProductImpactTelemetry();
    globalThis.history.pushState({}, "", "/alice/collected?jwt=secret");

    telemetry.trackAuthSessionRefreshProductImpact({
      clientType: "web",
      hadLocalJwt: true,
      outcome: "reauth_required",
      refreshOutcome: "empty",
      requiresReauth: true,
    });

    expect(trackAnalyticsEventMock).toHaveBeenCalledWith(
      "Auth Session Refresh Product Impact",
      expect.objectContaining({
        route_family: "/:handle/collected",
      })
    );
    expect(JSON.stringify(trackAnalyticsEventMock.mock.calls)).not.toContain(
      "alice"
    );
    expect(JSON.stringify(trackAnalyticsEventMock.mock.calls)).not.toContain(
      "secret"
    );
  });
});
