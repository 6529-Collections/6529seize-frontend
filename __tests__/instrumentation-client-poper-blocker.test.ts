const mockInit = jest.fn();
const mockReplayIntegration = jest.fn(() => ({ name: "replay" }));
const mockCaptureRouterTransitionStart = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  init: mockInit,
  replayIntegration: mockReplayIntegration,
  captureRouterTransitionStart: mockCaptureRouterTransitionStart,
}));

describe("instrumentation-client Poper Blocker filter", () => {
  beforeEach(() => {
    jest.resetModules();
    mockInit.mockReset();
    mockReplayIntegration.mockReset();
    mockReplayIntegration.mockImplementation(() => ({ name: "replay" }));
    mockCaptureRouterTransitionStart.mockReset();
  });

  it("drops the anonymous fetch sentinel before Sentry normalizes it", () => {
    jest.isolateModules(() => {
      require("@/instrumentation-client");
    });
    const config = mockInit.mock.calls[0]?.[0];
    expect(typeof config?.beforeSend).toBe("function");

    const event = {
      level: "warning",
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "Network request failed. Please check your connection and try again. (/v2/pingback)",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename:
                    "node_modules/.pnpm/aws-rum-web@1.25.0/node_modules/aws-rum-web/dist/es/dispatch/FetchHttpHandler.js",
                  function: "e.prototype.handle",
                  in_app: false,
                },
                {
                  filename: "app:///injectScriptAdjust.js",
                  abs_path: "app:///injectScriptAdjust.js",
                  function: "?",
                  lineno: 1,
                  colno: 4520,
                  in_app: true,
                },
                {
                  filename: "app:///injectScriptAdjust.js",
                  abs_path: "app:///injectScriptAdjust.js",
                  function: "VihJ",
                  lineno: 1,
                  colno: 3159,
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    };

    expect(config.beforeSend(event)).toBeNull();
  });
});
