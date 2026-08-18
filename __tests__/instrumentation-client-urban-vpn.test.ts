const mockInit = jest.fn();
const mockReplayIntegration = jest.fn(() => ({ name: "replay" }));
const mockCaptureRouterTransitionStart = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  init: mockInit,
  replayIntegration: mockReplayIntegration,
  captureRouterTransitionStart: mockCaptureRouterTransitionStart,
}));

const urbanVpnEvent = {
  exception: {
    values: [
      {
        type: "TypeError",
        value: "Cannot read properties of undefined (reading 'M_ID')",
        mechanism: {
          type: "auto.browser.global_handlers.onunhandledrejection",
          handled: false,
        },
        stacktrace: {
          frames: [
            {
              filename: "app:///_next/static/chunks/2t0pw9wfgr12w.js",
              abs_path: "app:///_next/static/chunks/2t0pw9wfgr12w.js",
              function: "XMLHttpRequest.r",
              lineno: 7,
              colno: 6173,
              in_app: true,
            },
            {
              filename: "app:///executors/200.js",
              abs_path: "app:///executors/200.js",
              function: "XMLHttpRequest.onreadystatechange",
              lineno: 1,
              colno: 2598,
              in_app: true,
            },
            {
              filename: "app:///executors/200.js",
              abs_path: "app:///executors/200.js",
              function: "Z",
              lineno: 1,
              colno: 761,
              in_app: true,
            },
          ],
        },
      },
    ],
  },
};

function loadBeforeSend(): (event: unknown) => unknown {
  jest.isolateModules(() => {
    require("@/instrumentation-client");
  });
  const config = mockInit.mock.calls[0]?.[0];
  if (typeof config?.beforeSend !== "function") {
    throw new Error("Sentry beforeSend was not configured");
  }
  return config.beforeSend;
}

describe("instrumentation-client Urban VPN filter", () => {
  beforeEach(() => {
    jest.resetModules();
    mockInit.mockReset();
    mockReplayIntegration.mockReset();
    mockReplayIntegration.mockImplementation(() => ({ name: "replay" }));
    mockCaptureRouterTransitionStart.mockReset();
  });

  it("drops the exact raw executor failure before Sentry submits it", () => {
    const beforeSend = loadBeforeSend();

    expect(beforeSend(urbanVpnEvent)).toBeNull();
  });

  it("keeps a nearby application error with an additional source frame", () => {
    const beforeSend = loadBeforeSend();
    const [value] = urbanVpnEvent.exception.values;
    const event = {
      exception: {
        values: [
          {
            ...value,
            stacktrace: {
              frames: [
                ...value.stacktrace.frames,
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./services/api/common-api.ts",
                  function: "executeApiRequest",
                },
              ],
            },
          },
        ],
      },
    };

    expect(beforeSend(event)).not.toBeNull();
  });
});
