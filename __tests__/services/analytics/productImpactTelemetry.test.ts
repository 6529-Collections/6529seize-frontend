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
    const { telemetry, sentry } = await loadProductImpactTelemetry();
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
    expect(sentry.logger.info).toHaveBeenCalledWith(
      "wave_feed_load_succeeded",
      expect.objectContaining({
        duration_ms: 1200,
        route_family: "/waves/:waveId",
      })
    );
    expect(trackAnalyticsEventMock).toHaveBeenCalledWith(
      "Wave Feed Load Succeeded",
      expect.not.objectContaining({ duration_ms: expect.any(Number) })
    );
  });

  it("keeps technical timing in Sentry while preserving Mixpanel compatibility", async () => {
    const { telemetry, sentry } = await loadProductImpactTelemetry();

    telemetry.trackWaveFeedLoadSucceeded({
      dropCount: 1,
      durationMs: 1234.6,
      hadCachedDrops: false,
      isNative: false,
      loadSource: "initial_visible",
    });

    expect(trackAnalyticsEventMock).toHaveBeenCalledWith(
      "Wave Feed Load Succeeded",
      expect.objectContaining({ duration_bucket: "1s_3s" })
    );
    expect(trackAnalyticsEventMock).toHaveBeenCalledWith(
      "Wave Feed Load Succeeded",
      expect.not.objectContaining({ duration_ms: expect.any(Number) })
    );
    expect(sentry.logger.info).toHaveBeenCalledWith(
      "wave_feed_load_succeeded",
      expect.objectContaining({ duration_ms: 1235 })
    );
  });

  it("keeps destinations isolated when one provider throws", async () => {
    const { telemetry, sentry } = await loadProductImpactTelemetry();
    trackAnalyticsEventMock.mockImplementationOnce(() => {
      throw new Error("Mixpanel unavailable");
    });

    expect(() =>
      telemetry.trackWaveFeedLoadStarted({
        hadCachedDrops: false,
        isNative: false,
        loadSource: "initial_visible",
      })
    ).not.toThrow();
    expect(sentry.logger.info).toHaveBeenCalledWith(
      "wave_feed_load_started",
      expect.any(Object)
    );

    sentry.logger.info.mockImplementationOnce(() => {
      throw new Error("Sentry unavailable");
    });
    expect(() =>
      telemetry.trackWaveFeedLoadStarted({
        hadCachedDrops: true,
        isNative: false,
        loadSource: "cache",
      })
    ).not.toThrow();
    expect(trackAnalyticsEventMock).toHaveBeenCalledTimes(2);
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

  it("deduplicates one auth impact condition until that session recovers", async () => {
    const { telemetry, sentry } = await loadProductImpactTelemetry();
    const impact = {
      clientType: "web" as const,
      dedupeScope: "session-a",
      hadLocalJwt: true,
      outcome: "session_upgrade_required" as const,
      refreshOutcome: "empty" as const,
      requiresReauth: true,
    };

    telemetry.trackAuthSessionRefreshProductImpact(impact);
    telemetry.trackAuthSessionRefreshProductImpact(impact);

    expect(trackAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(sentry.logger.warn).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(trackAnalyticsEventMock.mock.calls)).not.toContain(
      "session-a"
    );

    telemetry.trackAuthSessionRefreshProductImpact({
      ...impact,
      dedupeScope: "session-b",
    });
    expect(trackAnalyticsEventMock).toHaveBeenCalledTimes(2);

    telemetry.resetAuthSessionRefreshProductImpactDedupe("session-a");
    telemetry.trackAuthSessionRefreshProductImpact(impact);
    expect(trackAnalyticsEventMock).toHaveBeenCalledTimes(3);
    expect(sentry.logger.warn).toHaveBeenCalledTimes(3);
  });

  it("classifies wave feed HTTP failures into status and error buckets", async () => {
    const { telemetry } = await loadProductImpactTelemetry();
    const serviceError = Object.assign(new Error("Service unavailable"), {
      status: 503,
    });

    telemetry.trackWaveFeedLoadFailed({
      durationMs: 900,
      error: serviceError,
      hadCachedDrops: false,
      isNative: false,
      loadSource: "initial_visible",
      remainedUnavailable: true,
    });

    expect(trackAnalyticsEventMock).toHaveBeenCalledWith(
      "Wave Feed Load Failed",
      expect.objectContaining({
        error_kind: "server",
        product_failure: true,
        status_bucket: "5xx",
      })
    );
  });

  it("classifies non-HTTP wave feed failures as unknown", async () => {
    const { telemetry } = await loadProductImpactTelemetry();

    telemetry.trackWaveFeedLoadFailed({
      durationMs: 900,
      error: new Error("Unexpected parser failure"),
      hadCachedDrops: false,
      isNative: false,
      loadSource: "initial_visible",
      remainedUnavailable: true,
    });

    expect(trackAnalyticsEventMock).toHaveBeenCalledWith(
      "Wave Feed Load Failed",
      expect.objectContaining({
        error_kind: "unknown",
        status_bucket: "unknown",
      })
    );
  });

  it("tracks wave feed cancellations as expected aborts", async () => {
    const { telemetry } = await loadProductImpactTelemetry();
    const abortError = new DOMException(
      "The operation was aborted",
      "AbortError"
    );

    telemetry.trackWaveFeedLoadCancelled({
      durationMs: 150,
      error: abortError,
      hadCachedDrops: true,
      isNative: true,
      loadSource: "background_sync",
      remainedUnavailable: false,
    });

    expect(trackAnalyticsEventMock).toHaveBeenCalledWith(
      "Wave Feed Load Cancelled",
      expect.objectContaining({
        endpoint_family: "wave_drops_feed",
        error_kind: "abort",
        load_source: "background_sync",
        product_failure: false,
        status_bucket: "aborted",
      })
    );
  });

  it("tracks auth refresh success and cancellation as reportable outcomes", async () => {
    const { telemetry } = await loadProductImpactTelemetry();

    telemetry.trackAuthSessionRefreshSucceeded({
      clientType: "native",
      hadLocalJwt: true,
      refreshOutcome: "success",
    });
    telemetry.trackAuthValidationCancelled({
      clientType: "native",
      hadLocalJwt: true,
      refreshOutcome: "cancelled",
    });

    expect(trackAnalyticsEventMock).toHaveBeenCalledWith(
      "Auth Session Refresh Succeeded",
      expect.objectContaining({
        client_type: "native",
        endpoint_family: "auth_session_refresh",
        product_failure: false,
        refresh_outcome: "success",
        status_bucket: "2xx",
      })
    );
    expect(trackAnalyticsEventMock).toHaveBeenCalledWith(
      "Auth Validation Cancelled",
      expect.objectContaining({
        client_type: "native",
        endpoint_family: "auth_session_refresh",
        product_failure: false,
        refresh_outcome: "cancelled",
        status_bucket: "aborted",
      })
    );
  });
});
