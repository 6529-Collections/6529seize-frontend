import type { ErrorEvent } from "@sentry/nextjs";
import { installCyclicJsonTimerDiagnostics } from "@/utils/monitoring/cyclicJsonTimerDiagnostics";
import { processSentryClientEvent } from "@/utils/monitoring/sentryClientEventPipeline";

const MESSAGE = "JSON.stringify cannot serialize cyclic structures.";
const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MetaMaskMobile/8.12.0";
const BRIDGE_STACK = [
  `TypeError: ${MESSAGE}`,
  "stringify@[native code]",
  "__mm__updateUrl@user-script:wallet-bridge:260:77",
  "@user-script:wallet-bridge:293:15",
  "diagnosticCallback@https://6529.io/_next/static/chunks/monitoring.js:5:8",
].join("\n");

function createEvent(): ErrorEvent {
  return {
    type: undefined,
    exception: {
      values: [
        {
          type: "TypeError",
          value: MESSAGE,
          mechanism: {
            type: "auto.browser.browserapierrors.setTimeout",
            handled: false,
          },
        },
      ],
    },
  };
}

function createBridgeCallback(error: Error) {
  function __mm__updateUrl() {
    throw error;
  }
  return function () {
    __mm__updateUrl();
  };
}

function captureError(
  options: {
    stack?: string | undefined;
    userAgent?: string;
    sampled?: boolean;
    callback?: (error: Error) => () => void;
  } = {}
) {
  const error = new TypeError(MESSAGE);
  error.stack = options.stack ?? BRIDGE_STACK;
  const callback = (options.callback ?? createBridgeCallback)(error);
  let scheduled = callback;
  const target = {
    navigator: { userAgent: options.userAgent ?? USER_AGENT },
    location: { hostname: "6529.io" },
    setTimeout(handler: unknown) {
      if (typeof handler === "function") scheduled = handler as () => void;
      return 1;
    },
  };
  installCyclicJsonTimerDiagnostics({
    target,
    random: () => (options.sampled === false ? 1 : 0),
    stackFactory: () =>
      [
        "@user-script:wallet-bridge:293:15",
        "analytics@https://analytics.example/js:960:281",
        "replaceState@https://6529.io/_next/static/chunks/app.js:2:12592",
      ].join("\n"),
  });
  target.setTimeout(callback);
  expect(() => scheduled()).toThrow(error);
  return error;
}

describe("confirmed MetaMask bridge filtering", () => {
  it("accepts JavaScriptCore's location-free injected frame only with callback proof", () => {
    const error = captureError({
      stack: "stringify@[native code]\n__mm__updateUrl@\n@",
    });
    expect(
      processSentryClientEvent(createEvent(), { originalException: error })
    ).toBeNull();
  });

  it("filters only the original sampled error and consumes its proof once", () => {
    const error = captureError();
    expect(
      processSentryClientEvent(createEvent(), { originalException: error })
    ).toBeNull();
    expect(
      processSentryClientEvent(createEvent(), { originalException: error })
    ).not.toBeNull();
  });

  it("keeps an identical error object that was not caught in the bridge callback", () => {
    captureError();
    const error = new TypeError(MESSAGE);
    error.stack = BRIDGE_STACK;
    expect(
      processSentryClientEvent(createEvent(), { originalException: error })
    ).not.toBeNull();
  });

  it.each([
    ["a missing stack", ""],
    ["a native-only stack", "stringify@[native code]"],
    [
      "an application serializer",
      "stringify@[native code]\nserialize@https://6529.io/app.js:1:2",
    ],
    [
      "application toJSON inside the bridge",
      "stringify@[native code]\ntoJSON@https://6529.io/app.js:1:2\n__mm__updateUrl@user-script:wallet:260:77",
    ],
    [
      "an application getter inside the bridge",
      "get title@https://6529.io/app.js:1:2\nstringify@[native code]\n__mm__updateUrl@user-script:wallet:260:77",
    ],
    [
      "a first-party bridge lookalike",
      "stringify@[native code]\n__mm__updateUrl@https://6529.io/app.js:1:2",
    ],
    [
      "an unfamiliar injected location",
      "stringify@[native code]\n__mm__updateUrl@blob:https://6529.io/fixture:1:2",
    ],
    [
      "an unfamiliar native frame",
      "JSON.stringify@[native code]\n__mm__updateUrl@user-script:wallet:1:2",
    ],
  ])(
    "keeps %s despite MetaMask and mixed scheduling evidence",
    (_name, stack) => {
      const error = captureError({ stack });
      const result = processSentryClientEvent(createEvent(), {
        originalException: error,
      });
      expect(result).not.toBeNull();
      expect(result?.tags?.["cyclic_json_timer_schedule_origin"]).toBe("mixed");
    }
  );

  it("keeps unsampled callbacks and other wallet WebViews", () => {
    for (const options of [
      { sampled: false },
      { userAgent: USER_AGENT.replace("MetaMaskMobile", "RabbyMobile") },
    ]) {
      const error = captureError(options);
      expect(
        processSentryClientEvent(createEvent(), { originalException: error })
      ).not.toBeNull();
    }
  });

  it("keeps changed callbacks and ignores a spoofed callback.toString", () => {
    const error = captureError({
      callback: (failure) => {
        const callback = () => {
          throw failure;
        };
        callback.toString = () => "function(){__mm__updateUrl();}";
        return callback;
      },
    });
    expect(
      processSentryClientEvent(createEvent(), { originalException: error })
    ).not.toBeNull();
  });

  it("keeps events if callback introspection fails without replacing the throw", () => {
    const spy = jest
      .spyOn(Function.prototype, "toString")
      .mockImplementationOnce(() => {
        throw new Error("unavailable");
      });
    try {
      const error = captureError();
      expect(
        processSentryClientEvent(createEvent(), { originalException: error })
      ).not.toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  it("does not trust tags or syntheticException as bridge proof", () => {
    const error = captureError();
    const event = createEvent();
    event.tags = {
      cyclic_json_timer_diagnostics: "v2",
      cyclic_json_timer_schedule_origin: "mixed",
    };
    event.extra = {
      cyclicJsonTimerDiagnostics: { webViewFamily: "metamask-mobile" },
    };
    expect(
      processSentryClientEvent(event, { syntheticException: error })
    ).not.toBeNull();
    expect(processSentryClientEvent(event)).not.toBeNull();
  });

  it("keeps other mechanisms and multi-exception application events", () => {
    const error = captureError();
    const event = createEvent();
    const value = event.exception!.values![0]!;
    value.mechanism = {
      type: "auto.browser.onunhandledrejection",
      handled: false,
    };
    expect(
      processSentryClientEvent(event, { originalException: error })
    ).not.toBeNull();
    const multiEvent = createEvent();
    multiEvent.exception!.values!.push({
      type: "Error",
      value: "Application failure",
    });
    expect(
      processSentryClientEvent(multiEvent, { originalException: error })
    ).not.toBeNull();
  });
});
