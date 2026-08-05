type MobileLaunchTimingModule =
  typeof import("@/utils/monitoring/mobileLaunchTiming");

type SentryMock = {
  readonly addBreadcrumb: jest.Mock;
  readonly logger: {
    readonly info: jest.Mock;
    readonly warn: jest.Mock;
  };
};

const deviceInfo = {
  platform: "ios",
  operatingSystem: "ios",
  osVersion: "17.0",
  model: "iPhone",
  manufacturer: "Apple",
  isVirtual: false,
  webViewVersion: "1.0",
};

let currentNow = 0;

async function loadMobileLaunchTiming({
  native = true,
  platform = "ios",
}: {
  readonly native?: boolean;
  readonly platform?: string;
} = {}): Promise<{
  readonly timing: MobileLaunchTimingModule;
  readonly sentry: SentryMock;
}> {
  jest.resetModules();

  const sentry: SentryMock = {
    addBreadcrumb: jest.fn(),
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
    },
  };

  jest.doMock("@sentry/nextjs", () => sentry);
  jest.doMock("@capacitor/core", () => ({
    Capacitor: {
      isNativePlatform: jest.fn(() => native),
      getPlatform: jest.fn(() => platform),
    },
  }));
  jest.doMock("@capacitor/device", () => ({
    Device: {
      getInfo: jest.fn().mockResolvedValue(deviceInfo),
    },
  }));

  const timing = await import("@/utils/monitoring/mobileLaunchTiming");
  return { timing, sentry };
}

function flushLaunchTiming(
  timing: MobileLaunchTimingModule,
  reason: Parameters<
    MobileLaunchTimingModule["scheduleMobileLaunchFlush"]
  >[0] = "manual"
): void {
  timing.scheduleMobileLaunchFlush(reason, 0);
  jest.advanceTimersByTime(0);
}

function mockCryptoSample(value: number): void {
  const cryptoSample = Math.floor(value * 0x100000000);
  jest
    .spyOn(globalThis.crypto, "getRandomValues")
    .mockImplementation((array) => {
      if (array instanceof Uint32Array && array.length > 0) {
        array[0] = cryptoSample;
      }
      return array;
    });
}

describe("mobileLaunchTiming", () => {
  beforeEach(() => {
    currentNow = 0;
    jest.useFakeTimers();
    jest.spyOn(globalThis.performance, "now").mockImplementation(() => {
      return currentNow;
    });
    mockCryptoSample(0.99);
    globalThis.history.pushState({}, "", "/waves/123?wallet=secret");
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("starts web launches outside Capacitor", async () => {
    mockCryptoSample(0.01);
    const { timing, sentry } = await loadMobileLaunchTiming({ native: false });

    timing.startMobileLaunchTiming();
    currentNow = 100;
    flushLaunchTiming(timing, "manual");

    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "mobile_launch",
        message: "start",
      })
    );
    expect(sentry.logger.warn).not.toHaveBeenCalled();
    expect(sentry.logger.info).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        platform: "web_desktop",
        route_family: "/waves/[wave]",
        sample_rate: 0.05,
      })
    );
  });

  it("flushes once", async () => {
    mockCryptoSample(0.01);
    const { timing, sentry } = await loadMobileLaunchTiming();

    timing.startMobileLaunchTiming();
    currentNow = 100;
    flushLaunchTiming(timing, "manual");
    flushLaunchTiming(timing, "manual");

    expect(sentry.logger.info).toHaveBeenCalledTimes(1);
    expect(sentry.logger.warn).not.toHaveBeenCalled();
  });

  it("adds safe launch context and flat milestone attributes", async () => {
    const { timing, sentry } = await loadMobileLaunchTiming();

    timing.startMobileLaunchTiming();
    currentNow = 120;
    timing.markMobileLaunchStep("wagmi_children_unblocked");
    currentNow = 180;
    timing.markMobileLaunchStep("wave_metadata_loaded");
    currentNow = 200;
    timing.markMobileLaunchStep("first_useful_app_shell");
    currentNow = 240;
    timing.markMobileLaunchStep("wave_messages_loaded");
    currentNow = 300;
    timing.markMobileLaunchStep("wagmi_ready");
    currentNow = 340;
    timing.markMobileLaunchStep("first_drop_rendered");
    currentNow = 360;
    timing.markMobileLaunchStep("waves_first_content_visible");
    timing.markMobileLaunchStep("route_first_useful_content");
    timing.setMobileLaunchContext({
      app_wallet_count_bucket: "2_5",
      app_wallets_state: "supported_with_wallets",
      auth_state: "authenticated_profile",
      wallet_connection_state: "connected",
    });
    currentNow = 400;
    flushLaunchTiming(timing, "manual");

    expect(sentry.logger.info).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        context: {
          app_wallet_count_bucket: "2_5",
          app_wallets_state: "supported_with_wallets",
          auth_state: "authenticated_profile",
          wallet_connection_state: "connected",
        },
        appkit_ready_after_unblock_ms: 180,
        appkit_ready_after_unblock_bucket: "0_500",
        first_drop_rendered_ms: 340,
        first_drop_rendered_bucket: "0_500",
        first_useful_content_ms: 360,
        first_useful_content_bucket: "0_500",
        layout_measure_complete_ms: 200,
        layout_measure_complete_bucket: "0_500",
        provider_gate_ms: 120,
        provider_gate_bucket: "0_500",
        shell_after_wagmi_ms: 80,
        shell_after_wagmi_bucket: "0_500",
        step_first_drop_rendered_ms: 340,
        step_route_first_useful_content_ms: 360,
        step_first_useful_app_shell_ms: 200,
        step_wagmi_children_unblocked_ms: 120,
        step_wave_messages_loaded_ms: 240,
        step_wave_metadata_loaded_ms: 180,
        total_launch_bucket: "0_500",
        wave_messages_loaded_ms: 240,
        wave_messages_loaded_bucket: "0_500",
        wave_metadata_loaded_ms: 180,
        wave_metadata_loaded_bucket: "0_500",
        waves_after_wagmi_ms: 240,
        waves_after_wagmi_bucket: "0_500",
      })
    );
  });

  it("adds bucket attributes for measured launch step durations", async () => {
    const { timing, sentry } = await loadMobileLaunchTiming();

    timing.startMobileLaunchTiming();
    currentNow = 100;
    const result = await timing.measureMobileLaunchAsync(
      "wagmi_appkit_init",
      () => {
        currentNow = 1700;
        return "ready";
      }
    );
    currentNow = 3500;
    flushLaunchTiming(timing, "manual");

    expect(result).toBe("ready");
    expect(sentry.logger.warn).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        duration_wagmi_appkit_init_ms: 1600,
        duration_wagmi_appkit_init_bucket: "1500_3000",
        total_ms: 3500,
        total_launch_bucket: "3000_5000",
      })
    );
  });

  it("measures elapsed time from the launch timing start baseline", async () => {
    const { timing, sentry } = await loadMobileLaunchTiming();

    currentNow = 500;
    timing.startMobileLaunchTiming();
    currentNow = 650;
    timing.markMobileLaunchStep("first_useful_app_shell");
    currentNow = 900;
    flushLaunchTiming(timing, "manual");

    expect(sentry.logger.info).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        step_first_useful_app_shell_ms: 150,
        total_ms: 400,
      })
    );
  });

  it("lets a waves content flush replace a scheduled shell flush", async () => {
    const { timing, sentry } = await loadMobileLaunchTiming();

    timing.startMobileLaunchTiming();
    currentNow = 50;
    timing.scheduleMobileLaunchFlush("shell_paint", 5000);
    currentNow = 100;
    timing.markMobileLaunchStep("waves_first_content_visible");
    timing.scheduleMobileLaunchFlush("waves_content_visible", 250);
    currentNow = 350;
    jest.advanceTimersByTime(250);

    expect(sentry.logger.info).toHaveBeenCalledTimes(1);
    expect(sentry.logger.info).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        flush_reason: "waves_content_visible",
        step_waves_first_content_visible_ms: 100,
        total_ms: 100,
        total_launch_bucket: "0_500",
      })
    );

    jest.advanceTimersByTime(5000);

    expect(sentry.logger.info).toHaveBeenCalledTimes(1);
  });

  it("uses the scheduled milestone time for delayed shell flushes", async () => {
    const { timing, sentry } = await loadMobileLaunchTiming();

    timing.startMobileLaunchTiming();
    currentNow = 120;
    timing.markMobileLaunchStep("first_useful_app_shell");
    timing.scheduleMobileLaunchFlush("shell_paint", 5000);
    currentNow = 5120;
    jest.advanceTimersByTime(5000);

    expect(sentry.logger.info).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        flush_reason: "shell_paint",
        slow: false,
        step_first_useful_app_shell_ms: 120,
        total_ms: 120,
        total_launch_bucket: "0_500",
      })
    );
    expect(sentry.logger.warn).not.toHaveBeenCalled();
  });

  it("logs slow launches as warnings without sampling", async () => {
    const { timing, sentry } = await loadMobileLaunchTiming();

    timing.startMobileLaunchTiming();
    currentNow = 3000;
    timing.markMobileLaunchStep("first_useful_app_shell");
    flushLaunchTiming(timing, "shell_paint");

    expect(sentry.logger.warn).toHaveBeenCalledTimes(1);
    expect(sentry.logger.warn).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        total_ms: 3000,
        route_family: "/waves/[wave]",
        slow: true,
        flush_reason: "shell_paint",
      })
    );
    expect(sentry.logger.info).not.toHaveBeenCalled();
  });

  it("logs user pages with bracket route templates", async () => {
    const { timing, sentry } = await loadMobileLaunchTiming();

    globalThis.history.pushState({}, "", "/alice?jwt=secret");
    timing.startMobileLaunchTiming();
    currentNow = 3000;
    flushLaunchTiming(timing, "shell_paint");

    expect(sentry.logger.warn).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        route_family: "/[user]",
      })
    );
  });

  it("samples normal launches at five percent", async () => {
    globalThis.history.pushState({}, "", "/about");
    const first = await loadMobileLaunchTiming();

    first.timing.startMobileLaunchTiming();
    currentNow = 100;
    flushLaunchTiming(first.timing, "shell_paint");

    expect(first.sentry.logger.info).not.toHaveBeenCalled();
    expect(first.sentry.logger.warn).not.toHaveBeenCalled();

    mockCryptoSample(0.01);
    globalThis.history.pushState({}, "", "/about");
    const second = await loadMobileLaunchTiming();

    second.timing.startMobileLaunchTiming();
    currentNow = 100;
    flushLaunchTiming(second.timing, "shell_paint");

    expect(second.sentry.logger.info).toHaveBeenCalledTimes(1);
    expect(second.sentry.logger.warn).not.toHaveBeenCalled();
  });

  it("captures focused non-desktop Notifications launches at 100 percent", async () => {
    globalThis.history.pushState({}, "", "/notifications");
    const { timing, sentry } = await loadMobileLaunchTiming();

    timing.startMobileLaunchTiming();
    currentNow = 200;
    timing.markMobileLaunchStep("route_first_useful_content");
    flushLaunchTiming(timing, "notifications_content_visible");

    expect(sentry.logger.info).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        route_family: "/notifications",
        sample_rate: 1,
        first_useful_content_ms: 200,
        flush_reason: "notifications_content_visible",
      })
    );
  });

  it("flushes timeout and pagehide launches", async () => {
    const timeoutRun = await loadMobileLaunchTiming();

    timeoutRun.timing.startMobileLaunchTiming();
    currentNow = 200;
    jest.advanceTimersByTime(15000);

    expect(timeoutRun.sentry.logger.warn).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        total_ms: 200,
        slow: false,
        flush_reason: "timeout",
      })
    );

    jest.spyOn(Math, "random").mockReturnValue(0.01);
    const pagehideRun = await loadMobileLaunchTiming();

    currentNow = 0;
    pagehideRun.timing.startMobileLaunchTiming();
    currentNow = 250;
    globalThis.dispatchEvent(new Event("pagehide"));

    expect(pagehideRun.sentry.logger.info).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        total_ms: 250,
        flush_reason: "pagehide",
      })
    );

    const errorRun = await loadMobileLaunchTiming();

    currentNow = 0;
    errorRun.timing.startMobileLaunchTiming();
    currentNow = 125;
    globalThis.dispatchEvent(new Event("error"));

    expect(errorRun.sentry.logger.warn).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        total_ms: 125,
        flush_reason: "error",
      })
    );
  });

  it("summarizes and sanitizes launch API timings", async () => {
    const { timing, sentry } = await loadMobileLaunchTiming();

    timing.startMobileLaunchTiming();
    for (let index = 0; index < 12; index++) {
      timing.recordMobileLaunchApiRequest({
        endpoint: `https://api.test.6529.io/api/profiles/private-handle/waves/${index}?jwt=secret`,
        method: "GET",
        status: 200,
        startedAtMs: index * 10,
        durationMs: index * 100,
      });
    }
    timing.recordMobileLaunchApiRequest({
      endpoint:
        "https://api.test.6529.io/api/v2/drops/0x1234567890123456789012345678901234567890/metadata?jwt=secret",
      method: "GET",
      status: 200,
      startedAtMs: 2000,
      durationMs: 4500,
    });

    currentNow = 3500;
    flushLaunchTiming(timing, "shell_paint");

    expect(sentry.logger.warn).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        api_captured_count: 10,
        api_dropped_count: 3,
        api_slowest_bucket: "3000_5000",
        api_slowest_endpoint: "/api/v2/drops/:wallet/metadata",
        api_slowest_method: "GET",
        api_slowest_ms: 4500,
        api_slowest_start_offset_ms: 2000,
        api_slowest_status: "200",
        api_total_count: 13,
        api: expect.objectContaining({
          total_count: 13,
          captured_count: 10,
          dropped_count: 3,
          first_calls: expect.arrayContaining([
            expect.objectContaining({
              endpoint_group: "/api/profiles/:id/waves/:id",
            }),
          ]),
          slowest_calls: expect.arrayContaining([
            expect.objectContaining({
              duration_ms: 900,
              endpoint_group: "/api/profiles/:id/waves/:id",
            }),
          ]),
        }),
      })
    );
  });

  it("keeps the earliest-started API calls when capped", async () => {
    const { timing, sentry } = await loadMobileLaunchTiming();

    timing.startMobileLaunchTiming();
    for (let index = 0; index < 10; index++) {
      timing.recordMobileLaunchApiRequest({
        endpoint: `/api/profiles/later-${index}/waves/${index}`,
        method: "GET",
        status: 200,
        startedAtMs: 100 + index * 10,
        durationMs: 10,
      });
    }

    timing.recordMobileLaunchApiRequest({
      endpoint: "/api/profiles/early-slow/waves/slow?jwt=secret",
      method: "GET",
      status: 200,
      startedAtMs: 50,
      durationMs: 1000,
    });

    currentNow = 3500;
    flushLaunchTiming(timing, "shell_paint");

    expect(sentry.logger.warn).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        api: expect.objectContaining({
          total_count: 11,
          captured_count: 10,
          dropped_count: 1,
          first_calls: expect.arrayContaining([
            expect.objectContaining({
              duration_ms: 1000,
              start_offset_ms: 50,
              endpoint_group: "/api/profiles/:id/waves/:id",
            }),
          ]),
          slowest_calls: expect.arrayContaining([
            expect.objectContaining({
              duration_ms: 1000,
              start_offset_ms: 50,
              endpoint_group: "/api/profiles/:id/waves/:id",
            }),
          ]),
        }),
      })
    );
  });

  it("sanitizes endpoints and route families", async () => {
    const sanitizers =
      await import("@/utils/monitoring/mobileLaunchTimingSanitizers");

    expect(
      sanitizers.sanitizeEndpointGroup(
        "https://api.test.6529.io/api/profiles/private-handle/proxies/?wallet=0x123"
      )
    ).toBe("/api/profiles/:id/proxies");
    expect(
      sanitizers.sanitizeEndpointGroup(
        "https://api.test.6529.io/api/%70rofiles/private-handle/proxies"
      )
    ).toBe("/api/profiles/:id/proxies");
    expect(
      sanitizers.sanitizeEndpointGroup(
        "/api/waves/0x1234567890123456789012345678901234567890/drops/123?handle=secret"
      )
    ).toBe("/api/waves/:wallet/drops/:id");
    expect(sanitizers.sanitizeRouteFamily("/alice?jwt=secret")).toBe("/[user]");
    expect(sanitizers.sanitizeRouteFamily("/alice/rep?jwt=secret")).toBe(
      "/[user]/[...cmsPath]"
    );
    expect(sanitizers.sanitizeRouteFamily("/messages/wave-123")).toBe(
      "/messages/[wave]"
    );
    expect(sanitizers.sanitizeRouteFamily("/waves/wave-123")).toBe(
      "/waves/[wave]"
    );
    expect(sanitizers.sanitizeRouteFamily("/messages/create")).toBe(
      "/messages/create"
    );
    expect(sanitizers.sanitizeRouteFamily("/waves/create")).toBe(
      "/waves/create"
    );
    expect(
      sanitizers.sanitizeRouteFamily("/tools/app-wallets/123?jwt=secret")
    ).toBe("/tools/app-wallets/[app-wallet-address]");
    expect(sanitizers.sanitizeRouteFamily("/nextgen")).toBe(
      "/nextgen/[[...view]]"
    );
    expect(sanitizers.sanitizeRouteFamily("/nextgen/explore")).toBe(
      "/nextgen/[[...view]]"
    );
    expect(sanitizers.sanitizeRouteFamily("/nextgen/manager")).toBe(
      "/nextgen/manager"
    );
    expect(sanitizers.sanitizeRouteFamily("/network/nerd")).toBe(
      "/network/nerd/[[...focus]]"
    );
    expect(sanitizers.sanitizeRouteFamily("/network/nerd/focus")).toBe(
      "/network/nerd/[[...focus]]"
    );
  });
});
