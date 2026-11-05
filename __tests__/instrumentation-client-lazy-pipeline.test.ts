const mockInit = jest.fn();
const mockThirdPartyErrorFilterIntegration = jest.fn(() => ({
  name: "third-party-errors-filter",
}));

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  init: mockInit,
  replayIntegration: jest.fn(() => ({ name: "replay" })),
  thirdPartyErrorFilterIntegration: mockThirdPartyErrorFilterIntegration,
  captureRouterTransitionStart: jest.fn(),
}));

const PIPELINE_MODULE = "@/utils/monitoring/sentryClientEventPipeline";

type SentryHooks = {
  beforeSend: (
    event: Record<string, unknown>,
    hint?: Record<string, unknown>
  ) => Promise<Record<string, unknown> | null>;
  beforeSendTransaction: (
    event: Record<string, unknown>
  ) => Promise<Record<string, unknown> | null>;
};

const loadHooks = (): SentryHooks => {
  jest.isolateModules(() => {
    require("@/instrumentation-client");
  });
  const config = mockInit.mock.calls[0]?.[0] as SentryHooks | undefined;
  if (!config) {
    throw new Error("Sentry.init was not called");
  }
  return config;
};

const noisyEvent = () => ({
  exception: {
    values: [{ type: "Error", value: "ResizeObserver loop limit exceeded" }],
  },
});

const appEvent = () => ({
  exception: {
    values: [{ type: "Error", value: "Unexpected render failure" }],
  },
  user: { id: "user-1", email: "someone@example.com" },
});

describe("instrumentation-client lazy event pipeline", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.dontMock(PIPELINE_MODULE);
    mockInit.mockReset();
  });

  afterEach(() => {
    jest.dontMock(PIPELINE_MODULE);
  });

  it("does not load the event pipeline while Sentry starts", () => {
    const loaded: string[] = [];
    jest.doMock(PIPELINE_MODULE, () => {
      loaded.push(PIPELINE_MODULE);
      return jest.requireActual(PIPELINE_MODULE);
    });

    loadHooks();

    expect(loaded).toEqual([]);
  });

  it("resolves beforeSend with the pipeline's filtering and sanitizing", async () => {
    const { beforeSend } = loadHooks();

    await expect(beforeSend(noisyEvent(), {})).resolves.toBeNull();

    const sent = await beforeSend(appEvent(), {});
    expect(sent).not.toBeNull();
    expect(JSON.stringify(sent)).not.toContain("someone@example.com");
  });

  it("resolves beforeSendTransaction through the pipeline", async () => {
    const { beforeSendTransaction } = loadHooks();

    await expect(
      beforeSendTransaction({ type: "transaction", spans: [] })
    ).resolves.toEqual(expect.objectContaining({ type: "transaction" }));
  });

  it("drops events while the pipeline cannot load and retries later", async () => {
    let attempts = 0;
    jest.doMock(PIPELINE_MODULE, () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("Failed to load chunk");
      }
      return jest.requireActual(PIPELINE_MODULE);
    });
    const { beforeSend } = loadHooks();

    await expect(beforeSend(appEvent(), {})).resolves.toBeNull();
    await expect(beforeSend(appEvent(), {})).resolves.not.toBeNull();
    expect(attempts).toBe(2);
  });
});
