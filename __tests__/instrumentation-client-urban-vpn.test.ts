const mockInit = jest.fn();
const mockReplayIntegration = jest.fn(() => ({ name: "replay" }));
const mockCaptureRouterTransitionStart = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  init: mockInit,
  replayIntegration: mockReplayIntegration,
  captureRouterTransitionStart: mockCaptureRouterTransitionStart,
}));

function createRawUrbanVpnEvent({
  executorFunction,
  wrapperPath,
  wrapperColumn = 6173,
  xhrFunction = "XMLHttpRequest.<anonymous>",
}: {
  executorFunction: "F" | "Z";
  wrapperPath: string;
  wrapperColumn?: number | undefined;
  xhrFunction?:
    | "XMLHttpRequest.<anonymous>"
    | "XMLHttpRequest.onreadystatechange"
    | "XMLHttpRequest.send.onreadystatechange"
    | undefined;
}) {
  return {
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
                filename: wrapperPath,
                abs_path: wrapperPath,
                function: "XMLHttpRequest.r",
                lineno: 7,
                colno: wrapperColumn,
                in_app: true,
              },
              {
                filename: "app:///executors/200.js",
                abs_path: "app:///executors/200.js",
                function: xhrFunction,
                lineno: 1,
                colno: 2598,
                in_app: true,
              },
              {
                filename: "app:///executors/200.js",
                abs_path: "app:///executors/200.js",
                function: executorFunction,
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
}

const latestRawUrbanVpnEvent = createRawUrbanVpnEvent({
  executorFunction: "Z",
  wrapperPath: "app:///_next/static/chunks/3m8mn2fucizwd.js",
});
const recommendedRawUrbanVpnEvent = createRawUrbanVpnEvent({
  executorFunction: "F",
  wrapperPath: "app:///_next/static/chunks/0-q88f1i0y3ma.js",
});
const onreadystatechangeRawUrbanVpnEvent = createRawUrbanVpnEvent({
  executorFunction: "Z",
  wrapperPath: "app:///_next/static/chunks/2t0pw9wfgr12w.js",
  xhrFunction: "XMLHttpRequest.onreadystatechange",
});

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

  it.each([
    ["latest", latestRawUrbanVpnEvent],
    ["recommended", recommendedRawUrbanVpnEvent],
    ["onreadystatechange", onreadystatechangeRawUrbanVpnEvent],
  ])("drops the exact %s raw executor failure", (_caseName, event) => {
    expect(loadBeforeSend()(event)).toBeNull();
  });

  it("keeps a nearby raw event with a changed wrapper coordinate", () => {
    const event = createRawUrbanVpnEvent({
      executorFunction: "Z",
      wrapperPath: "app:///_next/static/chunks/3m8mn2fucizwd.js",
      wrapperColumn: 6172,
    });

    expect(loadBeforeSend()(event)).toStrictEqual(event);
  });

  it("keeps the unverified send.onreadystatechange raw variant", () => {
    const event = createRawUrbanVpnEvent({
      executorFunction: "Z",
      wrapperPath: "app:///_next/static/chunks/2t0pw9wfgr12w.js",
      xhrFunction: "XMLHttpRequest.send.onreadystatechange",
    });

    expect(loadBeforeSend()(event)).toStrictEqual(event);
  });

  it("keeps the event when application source evidence is present", () => {
    const event = {
      ...latestRawUrbanVpnEvent,
      extra: {
        __serialized__: {
          stack:
            "Error: Application failure\n    at executeApiRequest (webpack-internal:///(app-pages-browser)/./services/api/common-api.ts:10:2)",
        },
      },
    };

    expect(loadBeforeSend()(event)).toStrictEqual(event);
  });
});
