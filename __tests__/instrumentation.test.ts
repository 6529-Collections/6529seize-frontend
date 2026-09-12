const mockServerInit = jest.fn();
const mockEdgeInit = jest.fn();
const mockCaptureRequestError = jest.fn();

jest.mock("../sentry.server.config", () => {
  mockServerInit();
  return {};
});
jest.mock("../sentry.edge.config", () => {
  mockEdgeInit();
  return {};
});
jest.mock("@sentry/nextjs", () => ({
  captureRequestError: mockCaptureRequestError,
}));
jest.mock("@/config/env", () => ({
  publicEnv: {
    SENTRY_DSN: "https://synthetic@example.com/1",
    NEXT_RUNTIME: "wrong-build-runtime",
  },
}));

describe("server error instrumentation", () => {
  const originalRuntime = process.env["NEXT_RUNTIME"];
  const originalEnabled = process.env["SENTRY_SERVER_INSTRUMENTATION"];

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env["SENTRY_SERVER_INSTRUMENTATION"];
  });

  afterEach(() => {
    if (originalRuntime === undefined) delete process.env["NEXT_RUNTIME"];
    else process.env["NEXT_RUNTIME"] = originalRuntime;
    if (originalEnabled === undefined)
      delete process.env["SENTRY_SERVER_INSTRUMENTATION"];
    else process.env["SENTRY_SERVER_INSTRUMENTATION"] = originalEnabled;
  });

  it.each(["nodejs", "edge"])(
    "selects %s from the actual Next runtime",
    async (runtime) => {
      process.env["NEXT_RUNTIME"] = runtime;
      const instrumentation = await import("../instrumentation");
      await instrumentation.register();
      expect(mockServerInit).toHaveBeenCalledTimes(
        runtime === "nodejs" ? 1 : 0
      );
      expect(mockEdgeInit).toHaveBeenCalledTimes(runtime === "edge" ? 1 : 0);
    }
  );

  it.each(["true", "false"])(
    "honors the runtime kill switch when set to %s",
    async (enabled) => {
      process.env["NEXT_RUNTIME"] = "nodejs";
      process.env["SENTRY_SERVER_INSTRUMENTATION"] = enabled;
      const instrumentation = await import("../instrumentation");
      await instrumentation.register();
      await instrumentation.onRequestError?.(
        new Error("Synthetic request failure"),
        { path: "/api/example", method: "GET", headers: {} },
        {
          routerKind: "App Router",
          routePath: "/api/example",
          routeType: "route",
        }
      );
      const calls = enabled === "true" ? 1 : 0;
      expect(mockServerInit).toHaveBeenCalledTimes(calls);
      expect(mockCaptureRequestError).toHaveBeenCalledTimes(calls);
    }
  );
});
