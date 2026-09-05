import {
  shouldFilterUrbanVpnExecutorMIdError,
  type SentryClientEvent,
  type SentryStackFrame,
} from "@/utils/sentry-client-filters";

const urbanVpnMIdErrorMessage =
  "Cannot read properties of undefined (reading 'M_ID')";
const urbanVpnExecutorPath = "app:///executors/200.js";
const latestRawSentryWrapperPath =
  "app:///_next/static/chunks/3m8mn2fucizwd.js";
const recommendedRawSentryWrapperPath =
  "app:///_next/static/chunks/0-q88f1i0y3ma.js";

function createRawSentryWrapperFrame(
  path = latestRawSentryWrapperPath
): SentryStackFrame {
  return {
    filename: path,
    abs_path: path,
    function: "XMLHttpRequest.r",
    lineno: 7,
    colno: 6173,
    in_app: true,
  };
}

function createUrbanVpnFrames({
  executorFunction = "Z",
  wrapperPath = latestRawSentryWrapperPath,
  xhrFunction = "XMLHttpRequest.<anonymous>",
}: {
  executorFunction?: "F" | "Z" | undefined;
  wrapperPath?: string | undefined;
  xhrFunction?:
    | "XMLHttpRequest.<anonymous>"
    | "XMLHttpRequest.onreadystatechange"
    | undefined;
} = {}): SentryStackFrame[] {
  return [
    createRawSentryWrapperFrame(wrapperPath),
    {
      filename: urbanVpnExecutorPath,
      abs_path: urbanVpnExecutorPath,
      function: xhrFunction,
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
}

function createUrbanVpnEvent({
  additionalException = false,
  frames = createUrbanVpnFrames(),
  handled = false,
  includeHandled = true,
  mechanismType = "auto.browser.global_handlers.onunhandledrejection",
  type = "TypeError",
  value = urbanVpnMIdErrorMessage,
}: {
  additionalException?: boolean | undefined;
  frames?: SentryStackFrame[] | undefined;
  handled?: boolean | undefined;
  includeHandled?: boolean | undefined;
  mechanismType?: string | undefined;
  type?: string | undefined;
  value?: string | undefined;
} = {}): SentryClientEvent {
  return {
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
          ? [{ type: "Error", value: "Application failure" }]
          : []),
      ],
    },
  };
}

describe("Urban VPN executor M_ID filter", () => {
  it.each([
    ["latest raw event", createUrbanVpnFrames()],
    [
      "recommended raw event",
      createUrbanVpnFrames({
        executorFunction: "F",
        wrapperPath: recommendedRawSentryWrapperPath,
      }),
    ],
    [
      "verified onreadystatechange raw event",
      createUrbanVpnFrames({
        wrapperPath: "app:///_next/static/chunks/2t0pw9wfgr12w.js",
        xhrFunction: "XMLHttpRequest.onreadystatechange",
      }),
    ],
  ] satisfies ReadonlyArray<readonly [string, SentryStackFrame[]]>)(
    "filters the %s",
    (_caseName, frames) => {
      expect(
        shouldFilterUrbanVpnExecutorMIdError(createUrbanVpnEvent({ frames }))
      ).toBe(true);
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
    expect(
      shouldFilterUrbanVpnExecutorMIdError(createUrbanVpnEvent(overrides))
    ).toBe(false);
  });

  it.each([
    ["wrapper path", 0, { filename: "app:///_next/static/runtime.js" }],
    ["wrapper function", 0, { function: "XMLHttpRequest.send" }],
    ["wrapper line", 0, { lineno: 8 }],
    ["wrapper column", 0, { colno: 6172 }],
    ["XHR path", 1, { filename: "app:///executors/201.js" }],
    [
      "XHR send.onreadystatechange function",
      1,
      { function: "XMLHttpRequest.send.onreadystatechange" },
    ],
    ["XHR line", 1, { lineno: 2 }],
    ["XHR column", 1, { colno: 2597 }],
    ["executor function", 2, { function: "Y" }],
    ["executor line", 2, { lineno: 2 }],
    ["executor column", 2, { colno: 760 }],
  ] satisfies ReadonlyArray<
    readonly [string, number, Partial<SentryStackFrame>]
  >)("keeps an event with a changed %s", (_caseName, frameIndex, change) => {
    const frames = createUrbanVpnFrames();
    const frame = frames[frameIndex];
    if (!frame) {
      throw new Error("Missing Urban VPN test frame");
    }
    frames[frameIndex] = { ...frame, ...change };

    expect(
      shouldFilterUrbanVpnExecutorMIdError(createUrbanVpnEvent({ frames }))
    ).toBe(false);
  });

  it.each([
    ["missing frame", createUrbanVpnFrames().slice(1)],
    [
      "extra frame",
      [
        ...createUrbanVpnFrames(),
        { filename: urbanVpnExecutorPath, function: "Z" },
      ],
    ],
  ] satisfies ReadonlyArray<readonly [string, SentryStackFrame[]]>)(
    "keeps an event with a %s",
    (_caseName, frames) => {
      expect(
        shouldFilterUrbanVpnExecutorMIdError(createUrbanVpnEvent({ frames }))
      ).toBe(false);
    }
  );

  it("keeps an event with serialized application source evidence", () => {
    const event = createUrbanVpnEvent();
    event.extra = {
      __serialized__: {
        stack:
          "Error: Application failure\n    at executeApiRequest (webpack-internal:///(app-pages-browser)/./services/api/common-api.ts:10:2)",
      },
    };

    expect(shouldFilterUrbanVpnExecutorMIdError(event)).toBe(false);
  });

  it("keeps an event with application source evidence in the hint", () => {
    const originalException = new Error("Application failure");
    originalException.stack =
      "Error: Application failure\n    at executeApiRequest (webpack-internal:///(app-pages-browser)/./services/api/common-api.ts:10:2)";

    expect(
      shouldFilterUrbanVpnExecutorMIdError(createUrbanVpnEvent(), {
        originalException,
      })
    ).toBe(false);
  });
});
