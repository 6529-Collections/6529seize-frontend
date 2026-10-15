const mockInit = jest.fn();
const mockReplayIntegration = jest.fn(() => ({ name: "replay" }));

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  init: mockInit,
  replayIntegration: mockReplayIntegration,
  thirdPartyErrorFilterIntegration: jest.fn(() => ({
    name: "third-party-errors-filter",
  })),
  captureRouterTransitionStart: jest.fn(),
}));

type SentryInitConfig = {
  integrations: (integrations: unknown[]) => Array<{ name: string }>;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  sendDefaultPii: boolean;
};

describe("instrumentation-client Session Replay opt-in", () => {
  const originalBuildFlag = process.env["SENTRY_REPLAY_ENABLED"];

  // `buildFlag` stands for the value next.config.ts inlines at build time;
  // `runtimeFlag` is the value baked into publicEnv (PUBLIC_RUNTIME).
  const loadConfig = ({
    buildFlag,
    runtimeFlag,
    nodeEnv = "production",
    dsn = "https://synthetic@example.com/1",
  }: {
    buildFlag: "true" | "false";
    runtimeFlag: "true" | "false" | undefined;
    nodeEnv?: string;
    dsn?: string | null;
  }): SentryInitConfig => {
    process.env["SENTRY_REPLAY_ENABLED"] = buildFlag;
    jest.isolateModules(() => {
      jest.doMock("@/config/env", () => ({
        publicEnv: {
          SENTRY_DSN: dsn ?? undefined,
          NODE_ENV: nodeEnv,
          SENTRY_REPLAY_ENABLED: runtimeFlag,
        },
      }));
      require("@/instrumentation-client");
    });
    const config = mockInit.mock.calls[0]?.[0] as SentryInitConfig | undefined;
    expect(config).toBeDefined();
    return config as SentryInitConfig;
  };

  beforeEach(() => {
    jest.resetModules();
    mockInit.mockReset();
    mockReplayIntegration.mockClear();
  });

  afterAll(() => {
    if (originalBuildFlag === undefined) {
      delete process.env["SENTRY_REPLAY_ENABLED"];
    } else {
      process.env["SENTRY_REPLAY_ENABLED"] = originalBuildFlag;
    }
  });

  it("excludes Replay when the flag is off", () => {
    const config = loadConfig({ buildFlag: "false", runtimeFlag: "false" });

    const integrations = config.integrations([{ name: "default" }]);

    expect(integrations.map(({ name }) => name)).toEqual([
      "default",
      "third-party-errors-filter",
    ]);
    expect(mockReplayIntegration).not.toHaveBeenCalled();
    expect(config.replaysSessionSampleRate).toBe(0);
    expect(config.replaysOnErrorSampleRate).toBe(0);
    expect(config.sendDefaultPii).toBe(false);
  });

  it("excludes Replay when the flag is unset", () => {
    const config = loadConfig({ buildFlag: "false", runtimeFlag: undefined });

    config.integrations([]);

    expect(mockReplayIntegration).not.toHaveBeenCalled();
    expect(config.replaysSessionSampleRate).toBe(0);
    expect(config.replaysOnErrorSampleRate).toBe(0);
  });

  it("includes Replay and its sample rates when the flag is on", () => {
    const config = loadConfig({ buildFlag: "true", runtimeFlag: "true" });

    const integrations = config.integrations([{ name: "default" }]);

    expect(integrations.map(({ name }) => name)).toEqual([
      "default",
      "third-party-errors-filter",
      "replay",
    ]);
    expect(mockReplayIntegration).toHaveBeenCalledTimes(1);
    expect(config.replaysSessionSampleRate).toBe(0.1);
    expect(config.replaysOnErrorSampleRate).toBe(1);
    expect(config.sendDefaultPii).toBe(false);
  });

  it("keeps Replay off outside production or without a DSN", () => {
    const development = loadConfig({
      buildFlag: "true",
      runtimeFlag: "true",
      nodeEnv: "development",
    });
    development.integrations([]);
    expect(development.replaysSessionSampleRate).toBe(0);

    mockInit.mockReset();
    const withoutDsn = loadConfig({
      buildFlag: "true",
      runtimeFlag: "true",
      dsn: null,
    });
    withoutDsn.integrations([]);
    expect(withoutDsn.replaysOnErrorSampleRate).toBe(0);
    expect(mockReplayIntegration).not.toHaveBeenCalled();
  });

  it("never adds Replay when the build excluded it", () => {
    // Defensive: a stale runtime value cannot resurrect a compiled-out SDK.
    const config = loadConfig({ buildFlag: "false", runtimeFlag: "true" });

    config.integrations([]);

    expect(mockReplayIntegration).not.toHaveBeenCalled();
  });
});
