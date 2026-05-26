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

describe("mobileLaunchTiming", () => {
  beforeEach(() => {
    currentNow = 0;
    jest.useFakeTimers();
    jest.spyOn(globalThis.performance, "now").mockImplementation(() => {
      return currentNow;
    });
    jest.spyOn(Math, "random").mockReturnValue(0.99);
    globalThis.history.pushState({}, "", "/waves/123?wallet=secret");
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("does not start outside Capacitor", async () => {
    const { timing, sentry } = await loadMobileLaunchTiming({ native: false });

    timing.startMobileLaunchTiming();
    currentNow = 4000;
    timing.flushMobileLaunchTiming("manual");

    expect(sentry.addBreadcrumb).not.toHaveBeenCalled();
    expect(sentry.logger.warn).not.toHaveBeenCalled();
    expect(sentry.logger.info).not.toHaveBeenCalled();
  });

  it("flushes once", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.01);
    const { timing, sentry } = await loadMobileLaunchTiming();

    timing.startMobileLaunchTiming();
    currentNow = 100;
    timing.flushMobileLaunchTiming("manual");
    timing.flushMobileLaunchTiming("manual");

    expect(sentry.logger.info).toHaveBeenCalledTimes(1);
    expect(sentry.logger.warn).not.toHaveBeenCalled();
  });

  it("logs slow launches as warnings without sampling", async () => {
    const { timing, sentry } = await loadMobileLaunchTiming();

    timing.startMobileLaunchTiming();
    currentNow = 3000;
    timing.markMobileLaunchStep("first_useful_app_shell");
    timing.flushMobileLaunchTiming("shell_paint");

    expect(sentry.logger.warn).toHaveBeenCalledTimes(1);
    expect(sentry.logger.warn).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        total_ms: 3000,
        route_family: "/waves/:id",
        slow: true,
        flush_reason: "shell_paint",
      })
    );
    expect(sentry.logger.info).not.toHaveBeenCalled();
  });

  it("samples normal launches at five percent", async () => {
    const first = await loadMobileLaunchTiming();

    first.timing.startMobileLaunchTiming();
    currentNow = 100;
    first.timing.flushMobileLaunchTiming("shell_paint");

    expect(first.sentry.logger.info).not.toHaveBeenCalled();
    expect(first.sentry.logger.warn).not.toHaveBeenCalled();

    jest.spyOn(Math, "random").mockReturnValue(0.01);
    const second = await loadMobileLaunchTiming();

    second.timing.startMobileLaunchTiming();
    currentNow = 100;
    second.timing.flushMobileLaunchTiming("shell_paint");

    expect(second.sentry.logger.info).toHaveBeenCalledTimes(1);
    expect(second.sentry.logger.warn).not.toHaveBeenCalled();
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

    currentNow = 3500;
    timing.flushMobileLaunchTiming("shell_paint");

    expect(sentry.logger.warn).toHaveBeenCalledWith(
      "mobile_launch_timing",
      expect.objectContaining({
        api: expect.objectContaining({
          total_count: 12,
          captured_count: 10,
          dropped_count: 2,
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

  it("sanitizes endpoints and route families", async () => {
    const { timing } = await loadMobileLaunchTiming({ native: false });

    expect(
      timing.sanitizeEndpointGroup(
        "https://api.test.6529.io/api/profiles/private-handle/proxies/?wallet=0x123"
      )
    ).toBe("/api/profiles/:id/proxies");
    expect(
      timing.sanitizeEndpointGroup(
        "/api/waves/0x1234567890123456789012345678901234567890/drops/123?handle=secret"
      )
    ).toBe("/api/waves/:wallet/drops/:id");
    expect(
      timing.sanitizeRouteFamily("/tools/app-wallets/123?jwt=secret")
    ).toBe("/tools/app-wallets/:id");
  });
});
