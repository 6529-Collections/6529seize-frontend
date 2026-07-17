import {
  CYCLIC_JSON_TIMER_DIAGNOSTICS_TAG,
  enrichCyclicJsonTimerEvent,
  installCyclicJsonTimerDiagnostics,
  isIosWkWebViewUserAgent,
} from "@/utils/monitoring/cyclicJsonTimerDiagnostics";
import type { Event } from "@sentry/nextjs";

const CYCLIC_JSON_MESSAGE =
  "JSON.stringify cannot serialize cyclic structures.";
const WKWEBVIEW_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const MOBILE_SAFARI_USER_AGENT = `${WKWEBVIEW_USER_AGENT} Version/18.7 Safari/604.1`;
const PRODUCTION_ASSET_HOSTNAME = "dnclu2fna0b2b.cloudfront.net";
const PRODUCTION_ASSET_PREFIX =
  `https://${PRODUCTION_ASSET_HOSTNAME}/web_build/test-release`;

type ScheduledTimer = {
  handler: ((...args: unknown[]) => unknown) | string;
  timeout?: number | undefined;
  args: unknown[];
};

function createCyclicJsonEvent(): Event {
  return {
    extra: {
      arguments: [{ walletAddress: "0xprivate" }],
      retainedSafeField: "safe",
    },
    exception: {
      values: [
        {
          type: "TypeError",
          value: CYCLIC_JSON_MESSAGE,
          mechanism: {
            type: "auto.browser.browserapierrors.setTimeout",
            handled: false,
          },
        },
      ],
    },
  };
}

function createTimerHarness(options?: {
  random?: () => number;
  stackFactory?: () => string | undefined;
  userAgent?: string;
}) {
  let scheduled: ScheduledTimer | undefined;
  let originalReceiver: unknown;
  const originalSetTimeout = jest.fn(function (
    this: unknown,
    handler: ScheduledTimer["handler"],
    timeout?: number,
    ...args: unknown[]
  ) {
    originalReceiver = this;
    scheduled = { handler, timeout, args };
    return 73;
  });
  const target = {
    setTimeout: originalSetTimeout,
    navigator: {
      userAgent: options?.userAgent ?? WKWEBVIEW_USER_AGENT,
    },
    location: {
      hostname: "6529.io",
    },
  };

  const installed = installCyclicJsonTimerDiagnostics({
    target,
    sampleRate: 1 / 16,
    random: options?.random ?? (() => 0),
    stackFactory:
      options?.stackFactory ??
      (() =>
        [
          "Error: cyclic-json-timer-schedule",
          "    at cyclicJsonTimerDiagnosticSetTimeout (https://6529.io/_next/static/chunks/diagnostics.js:2:2)",
          "    at scheduleMessageRefresh (https://6529.io/_next/static/chunks/app/messages/page.js?token=private:123:45)",
          "walletCallback@chrome-extension://secret-extension-id/inpage.js?address=0xsecret:67:89",
        ].join("\n")),
  });

  return {
    installed,
    originalSetTimeout,
    target,
    getScheduled: () => scheduled,
    getOriginalReceiver: () => originalReceiver,
  };
}

function captureDiagnostics(stackLines: string[]) {
  const { target, getScheduled } = createTimerHarness({
    stackFactory: () => stackLines.join("\n"),
  });
  const expectedError = new TypeError(CYCLIC_JSON_MESSAGE);
  target.setTimeout(() => {
    throw expectedError;
  }, 0);

  const scheduled = getScheduled();
  try {
    (scheduled?.handler as (...args: unknown[]) => unknown)();
  } catch (error) {
    expect(error).toBe(expectedError);
  }

  const event = createCyclicJsonEvent();
  enrichCyclicJsonTimerEvent(event, { originalException: expectedError });
  return event.extra?.["cyclicJsonTimerDiagnostics"] as {
    schemaVersion: string;
    scheduleOrigin: string;
    schedulingFrames: Array<{
      file: string;
      function: string;
      line: number;
      column: number;
      origin: string;
    }>;
  };
}

describe("cyclic JSON timer diagnostics", () => {
  it("limits installation to iOS WKWebViews and known wallet WebViews", () => {
    expect(isIosWkWebViewUserAgent(WKWEBVIEW_USER_AGENT)).toBe(true);
    expect(
      isIosWkWebViewUserAgent(`${MOBILE_SAFARI_USER_AGENT} MetaMaskMobile/1.0`)
    ).toBe(true);
    expect(isIosWkWebViewUserAgent(MOBILE_SAFARI_USER_AGENT)).toBe(false);
    expect(
      isIosWkWebViewUserAgent(`${WKWEBVIEW_USER_AGENT} CriOS/126.0.6478.153`)
    ).toBe(false);
  });

  it("keeps unsampled timers on the original callback path", () => {
    const stackFactory = jest.fn(() => "should not be captured");
    const { target, getScheduled } = createTimerHarness({
      random: () => 1,
      stackFactory,
    });
    const callback = jest.fn();

    const timerId = target.setTimeout(callback, 25, "unchanged");

    expect(timerId).toBe(73);
    expect(getScheduled()).toEqual({
      handler: callback,
      timeout: 25,
      args: ["unchanged"],
    });
    expect(stackFactory).not.toHaveBeenCalled();
  });

  it("passes string timers through without sampling or wrapping", () => {
    const random = jest.fn(() => 0);
    const stackFactory = jest.fn(() => "should not be captured");
    const { target, getScheduled } = createTimerHarness({
      random,
      stackFactory,
    });

    target.setTimeout("globalThis.refreshMessages()", 25);

    expect(getScheduled()).toEqual({
      handler: "globalThis.refreshMessages()",
      timeout: 25,
      args: [],
    });
    expect(random).not.toHaveBeenCalled();
    expect(stackFactory).not.toHaveBeenCalled();
  });

  it("preserves sampled timer arguments, callback context, return, and throw", () => {
    const { target, getScheduled } = createTimerHarness();
    const callbackContext = { source: "native-timer" };
    const privateTimerArgument = { walletAddress: "0xprivate" };
    const expectedError = new TypeError(CYCLIC_JSON_MESSAGE);
    let callbackCalls = 0;
    let receivedContext: unknown;
    let receivedArgument: unknown;
    function successfulTimerCallback(this: unknown, argument: unknown) {
      receivedContext = this;
      receivedArgument = argument;
      return 41;
    }
    function failingTimerCallback(this: unknown, argument: unknown) {
      callbackCalls += 1;
      receivedContext = this;
      receivedArgument = argument;
      throw expectedError;
    }

    target.setTimeout(successfulTimerCallback, 10, privateTimerArgument);
    const successfulTimer = getScheduled();
    expect(
      (successfulTimer?.handler as (...args: unknown[]) => unknown).apply(
        callbackContext,
        successfulTimer?.args ?? []
      )
    ).toBe(41);
    expect(receivedContext).toBe(callbackContext);
    expect(receivedArgument).toBe(privateTimerArgument);

    const timerId = target.setTimeout(
      failingTimerCallback,
      10,
      privateTimerArgument
    );
    const scheduled = getScheduled();

    expect(timerId).toBe(73);
    expect(scheduled?.timeout).toBe(10);
    expect(scheduled?.args).toEqual([privateTimerArgument]);
    expect(typeof scheduled?.handler).toBe("function");
    let thrownError: unknown;
    try {
      (scheduled?.handler as (...args: unknown[]) => unknown).apply(
        callbackContext,
        scheduled?.args ?? []
      );
    } catch (error) {
      thrownError = error;
    }
    expect(thrownError).toBe(expectedError);
    expect(callbackCalls).toBe(1);
    expect(receivedContext).toBe(callbackContext);
    expect(receivedArgument).toBe(privateTimerArgument);
  });

  it("keeps detached setTimeout calls on the window receiver", () => {
    const { target, getOriginalReceiver } = createTimerHarness();
    const detachedSetTimeout = target.setTimeout;

    expect(detachedSetTimeout.name).toBe(
      "cyclicJsonTimerDiagnosticSetTimeout"
    );
    detachedSetTimeout(jest.fn(), 5);

    expect(getOriginalReceiver()).toBe(target);
  });

  it("adds bounded machine-readable provenance without timer arguments or URL data", () => {
    const { target, getScheduled } = createTimerHarness();
    const privateTimerArgument = { walletAddress: "0xprivate" };
    const expectedError = new TypeError(CYCLIC_JSON_MESSAGE);
    function failingTimerCallback() {
      throw expectedError;
    }

    target.setTimeout(failingTimerCallback, 10, privateTimerArgument);
    const scheduled = getScheduled();
    try {
      (scheduled?.handler as (...args: unknown[]) => unknown)(
        ...((scheduled?.args as unknown[]) ?? [])
      );
    } catch (error) {
      expect(error).toBe(expectedError);
    }

    const event = createCyclicJsonEvent();
    enrichCyclicJsonTimerEvent(event, { originalException: expectedError });
    enrichCyclicJsonTimerEvent(event, { originalException: expectedError });

    expect(event.tags).toMatchObject({
      [CYCLIC_JSON_TIMER_DIAGNOSTICS_TAG]: "v2",
      cyclic_json_timer_schedule_origin: "mixed",
    });
    expect(event.extra?.["cyclicJsonTimerDiagnostics"]).toEqual({
      schemaVersion: "v2",
      timerSampleRate: 1 / 16,
      callbackName: "failingTimerCallback",
      webViewFamily: "ios-wkwebview",
      scheduleOrigin: "mixed",
      schedulingFrames: [
        {
          file: "/_next/static/chunks/app/messages/page.js",
          function: "scheduleMessageRefresh",
          line: 123,
          column: 45,
          origin: "first_party",
        },
        {
          file: "external/inpage.js",
          function: "walletCallback",
          line: 67,
          column: 89,
          origin: "third_party",
        },
      ],
    });

    const serializedDiagnostics = JSON.stringify(event.extra);
    expect(event.extra?.["arguments"]).toBeUndefined();
    expect(event.extra?.["retainedSafeField"]).toBe("safe");
    expect(serializedDiagnostics).not.toContain("0xprivate");
    expect(serializedDiagnostics).not.toContain("private");
    expect(serializedDiagnostics).not.toContain("secret-extension-id");
  });

  it("recognizes production CDN chunks and removes a minified capture-site frame", () => {
    const diagnostics = captureDiagnostics([
      "Error: cyclic-json-timer-schedule",
      `u@${PRODUCTION_ASSET_PREFIX}/_next/static/chunks/diagnostics.js:21:99680`,
      "injectedCallback@https://wallet.example/inpage.js:790:281",
      `scheduleRefresh@${PRODUCTION_ASSET_PREFIX}/_next/static/chunks/app/waves.js:51:8567`,
    ]);

    expect(diagnostics).toEqual({
      schemaVersion: "v2",
      timerSampleRate: 1 / 16,
      callbackName: "anonymous",
      webViewFamily: "ios-wkwebview",
      scheduleOrigin: "mixed",
      schedulingFrames: [
        {
          file: "external/inpage.js",
          function: "injectedCallback",
          line: 790,
          column: 281,
          origin: "third_party",
        },
        {
          file: "/_next/static/chunks/app/waves.js",
          function: "scheduleRefresh",
          line: 51,
          column: 8567,
          origin: "first_party",
        },
      ],
    });
  });

  it.each([
    {
      name: "a lookalike hostname",
      location: `https://${PRODUCTION_ASSET_HOSTNAME}.example.com/web_build/test-release/_next/static/chunks/app.js:3:4`,
      expectedFile: "external/app.js",
      expectedOrigin: "third_party",
    },
    {
      name: "an unrelated path on the app asset CDN",
      location: `https://${PRODUCTION_ASSET_HOSTNAME}/_next/static/chunks/app.js:3:4`,
      expectedFile: "external/app.js",
      expectedOrigin: "third_party",
    },
    {
      name: "the separate media CDN",
      location:
        "https://d3lqz0a4bldqgf.cloudfront.net/web_build/test-release/_next/static/chunks/app.js:3:4",
      expectedFile: "external/app.js",
      expectedOrigin: "third_party",
    },
    {
      name: "a non-HTTP script",
      location: "data:text/javascript,fixture:3:4",
      expectedFile: "non-http-script",
      expectedOrigin: "unknown",
    },
    {
      name: "a generic external script",
      location: "https://scripts.example/vendor.js:3:4",
      expectedFile: "external/vendor.js",
      expectedOrigin: "third_party",
    },
  ])("does not classify $name as a production app asset", (testCase) => {
    const diagnostics = captureDiagnostics([
      "Error: cyclic-json-timer-schedule",
      `u@${PRODUCTION_ASSET_PREFIX}/_next/static/chunks/diagnostics.js:1:2`,
      `candidate@${testCase.location}`,
    ]);

    expect(diagnostics.scheduleOrigin).toBe(testCase.expectedOrigin);
    expect(diagnostics.schedulingFrames).toEqual([
      {
        file: testCase.expectedFile,
        function: "candidate",
        line: 3,
        column: 4,
        origin: testCase.expectedOrigin,
      },
    ]);
  });

  it("does not tag unrelated errors or create a second event", () => {
    const { target, getScheduled } = createTimerHarness();
    const expectedError = new Error("unrelated failure");
    let callbackCalls = 0;
    function unrelatedTimerCallback() {
      callbackCalls += 1;
      throw expectedError;
    }

    target.setTimeout(unrelatedTimerCallback, 0);
    const scheduled = getScheduled();
    expect(() =>
      (scheduled?.handler as (...args: unknown[]) => unknown)()
    ).toThrow(expectedError);

    const event = createCyclicJsonEvent();
    enrichCyclicJsonTimerEvent(event, { originalException: expectedError });

    expect(callbackCalls).toBe(1);
    expect(event.tags).toBeUndefined();
    expect(event.extra).toEqual({ retainedSafeField: "safe" });
  });

  it("redacts identifier-shaped callback secrets", () => {
    const { target, getScheduled } = createTimerHarness();
    const expectedError = new TypeError(CYCLIC_JSON_MESSAGE);
    const callback = () => {
      throw expectedError;
    };
    Object.defineProperty(callback, "name", {
      configurable: true,
      value: "wallet_0x1234567890abcdef1234567890abcdef12345678",
    });

    target.setTimeout(callback, 0);
    const scheduled = getScheduled();
    try {
      (scheduled?.handler as (...args: unknown[]) => unknown)();
    } catch (error) {
      expect(error).toBe(expectedError);
    }

    const event = createCyclicJsonEvent();
    enrichCyclicJsonTimerEvent(event, { originalException: expectedError });

    expect(
      (
        event.extra?.["cyclicJsonTimerDiagnostics"] as {
          callbackName?: string;
        }
      ).callbackName
    ).toBe("redacted");
    expect(JSON.stringify(event.extra)).not.toContain("0x1234567890abcdef");
  });

  it("uses fixed placeholders for non-HTTP and malformed stack locations", () => {
    const { target, getScheduled } = createTimerHarness({
      stackFactory: () =>
        [
          "Error: cyclic-json-timer-schedule",
          "cyclicJsonTimerDiagnosticSetTimeout@https://6529.io/_next/static/chunks/diagnostics.js:2:2",
          "inlineSource@data:text/javascript,privateIdentifier:4:5",
          "malformed@privateIdentifier:6:7",
        ].join("\n"),
    });
    const expectedError = new TypeError(CYCLIC_JSON_MESSAGE);
    function failingTimerCallback() {
      throw expectedError;
    }

    target.setTimeout(failingTimerCallback, 0);
    const scheduled = getScheduled();
    try {
      (scheduled?.handler as (...args: unknown[]) => unknown)();
    } catch (error) {
      expect(error).toBe(expectedError);
    }

    const event = createCyclicJsonEvent();
    enrichCyclicJsonTimerEvent(event, { originalException: expectedError });

    const serializedDiagnostics = JSON.stringify(
      event.extra?.["cyclicJsonTimerDiagnostics"]
    );
    expect(serializedDiagnostics).toContain("non-http-script");
    expect(serializedDiagnostics).toContain("unknown-script");
    expect(serializedDiagnostics).not.toContain("privateIdentifier");
  });

  it("leaves timers untouched in unrelated browsers", () => {
    const { installed, target, originalSetTimeout } = createTimerHarness({
      userAgent: MOBILE_SAFARI_USER_AGENT,
    });
    const callback = jest.fn();

    target.setTimeout(callback, 5);

    expect(installed).toBe(false);
    expect(originalSetTimeout).toHaveBeenCalledWith(callback, 5);
  });
});
