import {
  shouldFilterMetaMaskMobileSpaNavigationCyclicJsonError,
  type SentryClientEvent,
  type SentryStackFrame,
} from "@/utils/sentry-client-filters";

const CYCLIC_JSON_MESSAGE =
  "JSON.stringify cannot serialize cyclic structures.";
const TIMER_MECHANISM = "auto.browser.browserapierrors.setTimeout";
const RAW_CHUNK = "app:///_next/static/chunks/0synthetic-monitoring.js";

const initialInjectedSchedulingFrame = {
  file: "non-http-script",
  function: "anonymous",
  line: 286,
  column: 15,
  origin: "unknown",
};

function createRawExecutionFrames(): SentryStackFrame[] {
  return [
    {
      filename: RAW_CHUNK,
      abs_path: RAW_CHUNK,
      function: "n",
      lineno: 7,
      colno: 4858,
      in_app: true,
    },
    {
      filename: RAW_CHUNK,
      abs_path: RAW_CHUNK,
      lineno: 21,
      colno: 90001,
      in_app: true,
    },
    {
      filename: "[native code]",
      abs_path: "[native code]",
      function: "stringify",
      in_app: true,
    },
  ];
}

type FixtureOptions = {
  eventTimestamp?: number | null | undefined;
  navigationTimestamp?: number | null | undefined;
  navigationCategory?: string | undefined;
  navigationData?: Record<string, unknown> | undefined;
  navigationFunction?: string | undefined;
  frames?: SentryStackFrame[] | undefined;
  exceptionType?: string | undefined;
  exceptionValue?: string | undefined;
  mechanismType?: string | undefined;
  handled?: boolean | undefined;
  additionalException?: boolean | undefined;
  diagnostics?: Record<string, unknown> | null | undefined;
  diagnosticsOverrides?: Record<string, unknown> | undefined;
  tags?: Record<string, unknown> | undefined;
};

function createDiagnostics(
  navigationFunction: string,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    schemaVersion: "v2",
    timerSampleRate: 1 / 16,
    callbackName: "anonymous",
    webViewFamily: "metamask-mobile",
    scheduleOrigin: "first_party",
    schedulingFrames: [
      initialInjectedSchedulingFrame,
      {
        file: "/_next/static/chunks/0synthetic-navigation.js",
        function: navigationFunction,
        line: 2,
        column: 47863,
        origin: "first_party",
      },
    ],
    ...overrides,
  };
}

function createEvent(options: FixtureOptions = {}): SentryClientEvent {
  const diagnostics =
    options.diagnostics === null
      ? undefined
      : (options.diagnostics ??
        createDiagnostics(
          options.navigationFunction ?? "navigate",
          options.diagnosticsOverrides
        ));
  const exceptionValues = [
    {
      type: options.exceptionType ?? "TypeError",
      value: options.exceptionValue ?? CYCLIC_JSON_MESSAGE,
      mechanism: {
        type: options.mechanismType ?? TIMER_MECHANISM,
        handled: options.handled ?? false,
      },
      stacktrace: {
        frames: options.frames ?? createRawExecutionFrames(),
      },
    },
  ];
  if (options.additionalException) {
    exceptionValues.push({
      type: "Error",
      value: "Independent application failure",
      mechanism: {
        type: "generic",
        handled: false,
      },
      stacktrace: {
        frames: [
          {
            filename: "app:///utils/applicationSerializer.ts",
            function: "serializeApplicationState",
            in_app: true,
          },
        ],
      },
    });
  }

  return {
    timestamp:
      options.eventTimestamp === null
        ? undefined
        : (options.eventTimestamp ?? 1000.103),
    transaction: "/waves",
    exception: { values: exceptionValues },
    tags: options.tags ?? {
      cyclic_json_timer_diagnostics: "v2",
      cyclic_json_timer_schedule_origin: "first_party",
    },
    extra: {
      arguments: ["private timer argument"],
      ...(diagnostics && { cyclicJsonTimerDiagnostics: diagnostics }),
    },
    breadcrumbs: [
      {
        timestamp:
          options.navigationTimestamp === null
            ? undefined
            : (options.navigationTimestamp ?? 1000),
        category: options.navigationCategory ?? "navigation",
        data: options.navigationData ?? {
          from: "/notifications",
          to: "/waves/synthetic-wave",
        },
      },
    ],
  };
}

describe("MetaMask Mobile SPA navigation cyclic JSON filter", () => {
  it.each(["pushState", "replaceState"])(
    "filters the v2-enriched %s navigation signature",
    (navigationFunction) => {
      const event = createEvent({ navigationFunction });

      expect(
        shouldFilterMetaMaskMobileSpaNavigationCyclicJsonError(event)
      ).toBe(true);
    }
  );

  it.each([0.103, 0.145, 0.295])(
    "filters the cohort-backed %.3f second navigation delay",
    (delaySeconds) => {
      const event = createEvent({ eventTimestamp: 1000 + delaySeconds });

      expect(
        shouldFilterMetaMaskMobileSpaNavigationCyclicJsonError(event)
      ).toBe(true);
    }
  );

  it.each([
    ["generic iOS WKWebView", { webViewFamily: "ios-wkwebview" }],
    ["another wallet WebView", { webViewFamily: "rabby-mobile" }],
    ["a named callback", { callbackName: "updateUrl" }],
    ["legacy diagnostics", { schemaVersion: "v1" }],
    ["a changed sample rate", { timerSampleRate: 1 / 8 }],
    ["mixed scheduling provenance", { scheduleOrigin: "mixed" }],
  ])("preserves the near miss with %s", (_name, diagnosticsOverrides) => {
    const event = createEvent({ diagnosticsOverrides });

    expect(shouldFilterMetaMaskMobileSpaNavigationCyclicJsonError(event)).toBe(
      false
    );
  });

  it.each([
    ["missing diagnostics", undefined, undefined],
    ["a missing diagnostics tag", createDiagnostics("navigate"), {}],
    [
      "legacy diagnostic tags",
      createDiagnostics("navigate", { schemaVersion: "v1" }),
      {
        cyclic_json_timer_diagnostics: "v1",
        cyclic_json_timer_schedule_origin: "first_party",
      },
    ],
    [
      "a mismatched origin tag",
      createDiagnostics("navigate"),
      {
        cyclic_json_timer_diagnostics: "v2",
        cyclic_json_timer_schedule_origin: "mixed",
      },
    ],
  ])("preserves %s", (_name, diagnostics, tags) => {
    const event = createEvent({
      diagnostics: diagnostics ?? null,
      tags,
    });

    expect(shouldFilterMetaMaskMobileSpaNavigationCyclicJsonError(event)).toBe(
      false
    );
  });

  it.each([
    ["no injected frame", []],
    [
      "a third-party injected origin",
      [{ ...initialInjectedSchedulingFrame, origin: "third_party" }],
    ],
    [
      "no first-party navigation frame",
      [
        initialInjectedSchedulingFrame,
        {
          file: "non-http-script",
          function: "anonymous",
          line: 290,
          column: 20,
          origin: "unknown",
        },
      ],
    ],
    [
      "a third-party follow-up frame",
      [
        initialInjectedSchedulingFrame,
        {
          file: "external/inpage.js",
          function: "navigate",
          line: 10,
          column: 20,
          origin: "third_party",
        },
      ],
    ],
  ])("preserves diagnostics with %s", (_name, schedulingFrames) => {
    const event = createEvent({ diagnosticsOverrides: { schedulingFrames } });

    expect(shouldFilterMetaMaskMobileSpaNavigationCyclicJsonError(event)).toBe(
      false
    );
  });

  it.each([
    ["a different exception type", { exceptionType: "Error" }],
    [
      "a different message",
      { exceptionValue: "Converting circular structure to JSON" },
    ],
    [
      "a different mechanism",
      {
        mechanismType: "auto.browser.browserapierrors.requestAnimationFrame",
      },
    ],
    ["a handled exception", { handled: true }],
    ["multiple exceptions", { additionalException: true }],
  ] satisfies Array<[string, FixtureOptions]>)(
    "preserves the event with %s",
    (_name, options) => {
      const event = createEvent(options);

      expect(
        shouldFilterMetaMaskMobileSpaNavigationCyclicJsonError(event)
      ).toBe(false);
    }
  );

  it.each([
    [
      "a missing native stringify frame",
      createRawExecutionFrames().slice(0, 2),
    ],
    [
      "a changed Sentry wrapper coordinate",
      createRawExecutionFrames().map((frame, index) =>
        index === 0 ? { ...frame, colno: 4859 } : frame
      ),
    ],
    [
      "a diagnostic wrapper from another chunk",
      createRawExecutionFrames().map((frame, index) =>
        index === 1
          ? {
              ...frame,
              filename: "app:///_next/static/chunks/0other.js",
              abs_path: "app:///_next/static/chunks/0other.js",
            }
          : frame
      ),
    ],
    [
      "a named application caller",
      createRawExecutionFrames().map((frame, index) =>
        index === 1
          ? { ...frame, function: "serializeApplicationState" }
          : frame
      ),
    ],
    [
      "an additional application serialization caller",
      [
        ...createRawExecutionFrames().slice(0, 2),
        {
          filename: "app:///utils/applicationSerializer.ts",
          function: "serializeApplicationState",
          in_app: true,
        },
        createRawExecutionFrames()[2],
      ],
    ],
  ])("preserves the execution stack with %s", (_name, frames) => {
    const event = createEvent({ frames });

    expect(shouldFilterMetaMaskMobileSpaNavigationCyclicJsonError(event)).toBe(
      false
    );
  });

  it.each([
    ["a missing event timestamp", { eventTimestamp: null }],
    ["a missing breadcrumb timestamp", { navigationTimestamp: null }],
    ["a 50 ms delay", { eventTimestamp: 1000.05 }],
    ["a 500 ms delay", { eventTimestamp: 1000.5 }],
    ["a non-navigation breadcrumb", { navigationCategory: "ui.click" }],
    ["missing navigation data", { navigationData: {} }],
  ] satisfies Array<[string, FixtureOptions]>)(
    "preserves the timing near miss with %s",
    (_name, options) => {
      const event = createEvent(options);

      expect(
        shouldFilterMetaMaskMobileSpaNavigationCyclicJsonError(event)
      ).toBe(false);
    }
  );
});
