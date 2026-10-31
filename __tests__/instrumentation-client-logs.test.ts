import type { Log } from "@sentry/nextjs";

const mockInit = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  init: mockInit,
  replayIntegration: jest.fn(() => ({ name: "replay" })),
  thirdPartyErrorFilterIntegration: jest.fn(() => ({
    name: "third-party-errors-filter",
  })),
  captureRouterTransitionStart: jest.fn(),
}));

type SentryInitConfig = {
  enableLogs?: boolean;
  sendDefaultPii: boolean;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  beforeSendLog?: (log: Log) => Log | null;
};

describe("instrumentation-client structured logs", () => {
  const loadConfig = (): SentryInitConfig => {
    jest.isolateModules(() => {
      jest.doMock("@/config/env", () => ({
        publicEnv: {
          SENTRY_DSN: "https://synthetic@example.com/1",
          NODE_ENV: "production",
          SENTRY_REPLAY_ENABLED: "false",
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
  });

  it("keeps logs enabled with PII and Replay off, and sanitizes them before send", () => {
    const config = loadConfig();

    expect(config.enableLogs).toBe(true);
    expect(config.sendDefaultPii).toBe(false);
    expect(config.replaysSessionSampleRate).toBe(0);
    expect(config.replaysOnErrorSampleRate).toBe(0);
    expect(typeof config.beforeSendLog).toBe("function");

    const sanitized = config.beforeSendLog?.({
      level: "info",
      message: "auth_session_refresh",
      attributes: {
        auth_refresh_outcome: "success",
        access_token: "synthetic-secret",
        "user.email": "synthetic.person@example.com",
        url: "https://6529.io/api/example?token=synthetic-query",
      },
    });

    expect(sanitized).toEqual({
      level: "info",
      message: "auth_session_refresh",
      attributes: {
        auth_refresh_outcome: "success",
        access_token: "[Filtered]",
        url: "/api/example",
      },
    });
  });
});
