import {
  shouldFilterUrbanVpnExecutorMIdError,
  type SentryClientEvent,
  type SentryStackFrame,
} from "@/utils/sentry-client-filters";

const urbanVpnMIdErrorMessage =
  "Cannot read properties of undefined (reading 'M_ID')";
const urbanVpnExecutorPath = "app:///executors/200.js";
const sentryWrapperPath = "app:///_next/static/chunks/2t0pw9wfgr12w.js";

const createUrbanVpnFrames = (
  executorFunction: "F" | "Z" = "Z"
): SentryStackFrame[] => [
  {
    filename: sentryWrapperPath,
    abs_path: sentryWrapperPath,
    function: "XMLHttpRequest.r",
    lineno: 7,
    colno: 6173,
    in_app: true,
  },
  {
    filename: urbanVpnExecutorPath,
    abs_path: urbanVpnExecutorPath,
    function: "XMLHttpRequest.onreadystatechange",
    lineno: 1,
    colno: 2598,
    in_app: true,
  },
  {
    filename: urbanVpnExecutorPath,
    abs_path: urbanVpnExecutorPath,
    function: executorFunction,
    lineno: 1,
    colno: 761,
    in_app: true,
  },
];

const createUrbanVpnEvent = ({
  type = "TypeError",
  value = urbanVpnMIdErrorMessage,
  mechanismType = "auto.browser.global_handlers.onunhandledrejection",
  handled = false,
  includeHandled = true,
  frames = createUrbanVpnFrames(),
  additionalException = false,
  extra,
}: {
  type?: string | undefined;
  value?: string | undefined;
  mechanismType?: string | undefined;
  handled?: boolean | undefined;
  includeHandled?: boolean | undefined;
  frames?: SentryStackFrame[] | undefined;
  additionalException?: boolean | undefined;
  extra?: Record<string, unknown> | undefined;
} = {}): SentryClientEvent => ({
  extra,
  exception: {
    values: [
      {
        type,
        value,
        mechanism: {
          type: mechanismType,
          ...(includeHandled ? { handled } : {}),
        },
        stacktrace: { frames },
      },
      ...(additionalException
        ? [
            {
              type: "Error",
              value: "Application failure",
            },
          ]
        : []),
    ],
  },
});

describe("Urban VPN executor M_ID filter", () => {
  it.each(["F", "Z"] as const)(
    "filters the exact raw executor stack with the %s function variant",
    (executorFunction) => {
      const event = createUrbanVpnEvent({
        frames: createUrbanVpnFrames(executorFunction),
      });

      expect(shouldFilterUrbanVpnExecutorMIdError(event)).toBe(true);
    }
  );

  it.each([
    ["changed message", { value: `${urbanVpnMIdErrorMessage}.` }],
    ["changed type", { type: "Error" }],
    ["changed mechanism", { mechanismType: "generic" }],
    ["handled rejection", { handled: true }],
    ["missing handled state", { includeHandled: false }],
    ["additional exception", { additionalException: true }],
  ])("keeps an event with a %s", (_caseName, overrides) => {
    const event = createUrbanVpnEvent(overrides);

    expect(shouldFilterUrbanVpnExecutorMIdError(event)).toBe(false);
  });

  it.each([
    ["wrapper path", 0, { filename: "app:///_next/static/runtime.js" }],
    ["wrapper function", 0, { function: "XMLHttpRequest.send" }],
    ["wrapper line", 0, { lineno: 8 }],
    ["wrapper column", 0, { colno: 6172 }],
    ["XHR path", 1, { filename: "app:///executors/201.js" }],
    ["XHR function", 1, { function: "XMLHttpRequest.onload" }],
    ["XHR line", 1, { lineno: 2 }],
    ["XHR column", 1, { colno: 2597 }],
    ["executor function", 2, { function: "Y" }],
    ["executor line", 2, { lineno: 2 }],
    ["executor column", 2, { colno: 760 }],
  ] satisfies ReadonlyArray<
    readonly [string, number, Partial<SentryStackFrame>]
  >)("keeps an event with a changed %s", (_caseName, frameIndex, change) => {
    const frames = createUrbanVpnFrames();
    const originalFrame = frames[frameIndex];
    if (!originalFrame) {
      throw new Error("Missing Urban VPN test frame");
    }
    frames[frameIndex] = { ...originalFrame, ...change };
    const event = createUrbanVpnEvent({ frames });

    expect(shouldFilterUrbanVpnExecutorMIdError(event)).toBe(false);
  });

  it.each([
    ["missing executor frame", createUrbanVpnFrames().slice(0, 2)],
    [
      "extra executor frame",
      [
        ...createUrbanVpnFrames(),
        {
          filename: urbanVpnExecutorPath,
          function: "Z",
          lineno: 1,
          colno: 761,
        },
      ],
    ],
    [
      "application source frame",
      [
        ...createUrbanVpnFrames(),
        {
          filename:
            "webpack-internal:///(app-pages-browser)/./services/api/common-api.ts",
          function: "executeApiRequest",
        },
      ],
    ],
  ] satisfies ReadonlyArray<readonly [string, SentryStackFrame[]]>)(
    "keeps an event with a %s",
    (_caseName, frames) => {
      const event = createUrbanVpnEvent({ frames });

      expect(shouldFilterUrbanVpnExecutorMIdError(event)).toBe(false);
    }
  );

  it("keeps an event with serialized application source evidence", () => {
    const event = createUrbanVpnEvent({
      extra: {
        __serialized__: {
          stack:
            "Error: Application failure\n    at executeApiRequest (webpack-internal:///(app-pages-browser)/./services/api/common-api.ts:10:2)",
        },
      },
    });

    expect(shouldFilterUrbanVpnExecutorMIdError(event)).toBe(false);
  });

  it("keeps an event with application source evidence in the hint", () => {
    const event = createUrbanVpnEvent();
    const originalException = new Error("Application failure");
    originalException.stack =
      "Error: Application failure\n    at executeApiRequest (webpack-internal:///(app-pages-browser)/./services/api/common-api.ts:10:2)";

    expect(
      shouldFilterUrbanVpnExecutorMIdError(event, { originalException })
    ).toBe(false);
  });
});
