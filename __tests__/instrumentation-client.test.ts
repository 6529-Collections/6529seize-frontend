import noiseFilterFixtures from "@/__tests__/fixtures/sentry-noise-filter-hardening.json";
import {
  createLatestReactDomRawFrames,
  createObservedReactDomRawInsertBeforeFrames,
} from "@/__tests__/fixtures/reactDomRawInsertBeforeFixtures";

const mockInit = jest.fn();
const mockReplayIntegration = jest.fn(() => ({ name: "replay" }));
const mockThirdPartyErrorFilterIntegration = jest.fn(() => ({
  name: "third-party-errors-filter",
}));
const mockCaptureRouterTransitionStart = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  init: mockInit,
  replayIntegration: mockReplayIntegration,
  thirdPartyErrorFilterIntegration: mockThirdPartyErrorFilterIntegration,
  captureRouterTransitionStart: mockCaptureRouterTransitionStart,
}));

describe("instrumentation-client", () => {
  const wrappedNetworkMessage =
    "Network request failed. Please check your connection and try again. (/api/waves-overview)";
  const dropReactionRequestFailedMessage = "Drop reaction request failed";
  const serverComponentRenderMessage =
    "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.";
  const privateBareWaveId = "2c5e0761-6de2-4e1f-9c23-a8c93ff1158f";
  const privateNonRfcUuid = "00000000-0000-0000-0000-000000000000";
  const privateRelativeDropId = "5651cd9a-1852-42fc-b213-5f8d871f96bf";
  const syntheticAutomaticWaveId = `${"1".repeat(8)}-${"2".repeat(4)}-4${"3".repeat(3)}-8${"4".repeat(3)}-${"5".repeat(12)}`;
  const objectCapturedPromiseRejectionMessage =
    "Object captured as promise rejection with keys: code, message, stack";
  const objectCapturedPromiseRejectionWithoutStackMessage =
    "Object captured as promise rejection with keys: code, message";
  const unsupportedWalletRevokePermissionsMessage =
    "the method wallet_revokePermissions does not exist/is not available";
  const backpackWalletCollisionBreadcrumbMessage =
    "Backpack was unable to override window.ethereum. If you're having issues connecting to a dapp, disable any other wallets and try again.";
  const readOnlyEthereumProxyBreadcrumbMessage =
    "[2026-08-04T04:00:10.853Z] [[WagmiSetup] Skipping safe ethereum proxy install for read-only window.ethereum] Error: Signature request failed. Please try again.";
  const indexedDBUserDeleteMessage = "Database deleted by request of the user";
  const indexedDBGetRecordNoTransactionMessage =
    "Attempt to get a record from database without an in-progress transaction";
  const talismanOnboardingMessage =
    "Talisman extension has not been configured yet. Please continue with onboarding.";
  const braveWalletSelectedAddressMessage =
    "undefined is not an object (evaluating 'window.ethereum.selectedAddress = undefined')";
  const braveWalletEmitMessage =
    "undefined is not an object (evaluating 'window.ethereum.emit')";
  const braveWalletUserAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15 Brave";
  const disconnectedProviderStack =
    "Error: The provider is disconnected from all chains.\n    at o (chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/background.js:2:7356292)";
  const rabbyChromeUserRejectedStack = [
    "Error: User rejected the request.",
    "    at a (chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/content-script.js:423:123184)",
    "    at Object.userRejectedRequest (chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/content-script.js:423:124412)",
    "    at h.dispose (chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/content-script.js:423:297934)",
  ].join("\n");
  const reactDomInsertBeforeMessage =
    "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.";
  const gifPickerTenorUndefinedTagsMessage =
    "undefined is not an object (evaluating 'e.tags')";
  const gifPickerTenorUndefinedResultsMapMessage =
    "undefined is not an object (evaluating 'e.results.map')";
  const instagramPageHideBridgeErrorMessage =
    "undefined is not an object (evaluating 'window.webkit.messageHandlers')";
  const reactDomRemoveChildMessage =
    "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.";
  const reactDomFrame = {
    filename:
      "node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js",
  };
  const gifPickerTenorManagerFrame = {
    filename:
      "node_modules/.pnpm/gif-picker-react@1.5.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/gif-picker-react/src/managers/TenorManager.ts",
    function: "<anonymous>",
  };
  const wasmCspUnsafeEvalMessage = [
    "Aborted(CompileError: WebAssembly.instantiate(): Compiling or instantiating",
    "WebAssembly module violates the following Content Security policy directive",
    "because 'unsafe-eval' is not an allowed source of script in the following",
    "Content Security Policy directive: \"script-src 'self' 'unsafe-inline'\".).",
    "Build with -sASSERTIONS for more info.",
  ].join(" ");
  const observedSentryE7WasmCspUnsafeEvalMessage = [
    "Aborted(CompileError: WebAssembly.instantiate(): Refused to compile or instantiate",
    "WebAssembly module because 'unsafe-eval' is not an allowed source of script in the",
    "following Content Security Policy directive: \"script-src 'self' 'unsafe-inline'",
    "https://dnclu2fna0b2b.cloudfront.net https://www.google-analytics.com",
    "https://www.googletagmanager.com",
    'https://dataplane.rum.us-east-1.amazonaws.com\").',
    "Build with -sASSERTIONS for more info.",
  ].join(" ");
  const observedWasmModuleCspUnsafeEvalMessage =
    "CompileError: WebAssembly.Module(): Compiling or instantiating WebAssembly module violates CSP because unsafe-eval is not allowed";
  const anonymousUnsafeEvalCspMessage =
    "Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: \"script-src 'self' 'unsafe-inline' https://dnclu2fna0b2b.cloudfront.net https://www.google-analytics.com https://www.googletagmanager.com https://dataplane.rum.us-east-1.amazonaws.com\".";
  const sentryRouteParameterizationMessage =
    "JSON.stringify cannot serialize cyclic structures.";
  const sentryRouteParameterizationMechanismType =
    "auto.browser.browserapierrors.setTimeout";
  const browserUnhandledRejectionMechanismType =
    "auto.browser.global_handlers.onunhandledrejection";
  const browserExtensionWalletRejectionMessage = "User rejected the request.";
  const browserExtensionWalletBridgePath = "app:///content-scripts/bridge.js";
  const browserExtensionWalletBridgeFrames = [
    {
      filename: browserExtensionWalletBridgePath,
      abs_path: browserExtensionWalletBridgePath,
      function: "o",
      lineno: 12,
      colno: 50420,
      in_app: true,
    },
    {
      filename: browserExtensionWalletBridgePath,
      abs_path: browserExtensionWalletBridgePath,
      function: "Ce.dispose",
      lineno: 1,
      colno: 30025,
      in_app: true,
    },
    {
      filename: browserExtensionWalletBridgePath,
      abs_path: browserExtensionWalletBridgePath,
      function: "Ce._dispose",
      lineno: 1,
      colno: 28455,
      in_app: true,
    },
    {
      filename: browserExtensionWalletBridgePath,
      abs_path: browserExtensionWalletBridgePath,
      function: "Object.userRejectedRequest",
      lineno: 1,
      colno: 15879,
      in_app: true,
    },
    {
      filename: browserExtensionWalletBridgePath,
      abs_path: browserExtensionWalletBridgePath,
      function: "a",
      lineno: 1,
      colno: 16591,
      in_app: true,
    },
  ];
  const expectedWaveAbortErrorValue = "AbortError: The user aborted a request.";
  const poperBlockerNetworkErrorMessage =
    "Network request failed. Please check your connection and try again. (/api/dm-drops/unread)";
  const poperBlockerInjectedFetchFrames = [
    {
      filename: "app:///injectScriptAdjust.js",
      abs_path: "app:///injectScriptAdjust.js",
      function: "window.fetch",
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
  ];
  const poperBlockerProcessedFrames = [
    {
      filename:
        "node_modules/.pnpm/aws-rum-web@1.25.0/node_modules/aws-rum-web/dist/es/dispatch/FetchHttpHandler.js",
      function: "e.prototype.handle",
      in_app: false,
    },
    ...poperBlockerInjectedFetchFrames,
  ];
  const poperBlockerCurrentProcessedFrames = [
    {
      filename:
        "node_modules/.pnpm/aws-rum-web@1.25.0/node_modules/aws-rum-web/dist/es/dispatch/FetchHttpHandler.js",
      function: "e.prototype.handle",
      in_app: false,
    },
    {
      filename: "app:///injectScriptAdjust.js",
      abs_path: "app:///injectScriptAdjust.js",
      function: null,
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
  ];
  const poperBlockerLatestRawFrames = [
    {
      filename: "app:///_next/static/chunks/0f73v56w55r2u.js",
      abs_path: "app:///_next/static/chunks/0f73v56w55r2u.js",
      function: "a",
      lineno: 11,
      colno: 9819,
      in_app: true,
    },
    {
      filename: "app:///_next/static/chunks/0f73v56w55r2u.js",
      abs_path: "app:///_next/static/chunks/0f73v56w55r2u.js",
      function: "Object.next",
      lineno: 11,
      colno: 10983,
      in_app: true,
    },
    {
      filename: "app:///_next/static/chunks/0f73v56w55r2u.js",
      abs_path: "app:///_next/static/chunks/0f73v56w55r2u.js",
      function: "e.<anonymous>",
      lineno: 11,
      colno: 11456,
      in_app: true,
    },
    {
      filename: "app:///_next/static/chunks/0f73v56w55r2u.js",
      abs_path: "app:///_next/static/chunks/0f73v56w55r2u.js",
      function: "e.handle",
      lineno: 11,
      colno: 6396,
      in_app: true,
    },
    {
      filename: "app:///_next/static/chunks/0_6tmws~mg4aj.js",
      abs_path: "app:///_next/static/chunks/0_6tmws~mg4aj.js",
      lineno: 10,
      colno: 1824,
      in_app: true,
    },
    ...poperBlockerInjectedFetchFrames,
  ];
  const poperBlockerRecommendedRawFrames = [
    {
      filename: "app:///_next/static/chunks/0f73v56w55r2u.js",
      abs_path: "app:///_next/static/chunks/0f73v56w55r2u.js",
      function: "a",
      lineno: 11,
      colno: 1231,
      in_app: true,
    },
    {
      filename: "app:///_next/static/chunks/0f73v56w55r2u.js",
      abs_path: "app:///_next/static/chunks/0f73v56w55r2u.js",
      function: "Object.next",
      lineno: 11,
      colno: 2395,
      in_app: true,
    },
    {
      filename: "app:///_next/static/chunks/0f73v56w55r2u.js",
      abs_path: "app:///_next/static/chunks/0f73v56w55r2u.js",
      function: "ts.<anonymous>",
      lineno: 11,
      colno: 2889,
      in_app: true,
    },
    {
      filename: "app:///_next/static/chunks/0f73v56w55r2u.js",
      abs_path: "app:///_next/static/chunks/0f73v56w55r2u.js",
      function: "e.handle",
      lineno: 11,
      colno: 11269,
      in_app: true,
    },
    {
      filename: "app:///_next/static/chunks/0f73v56w55r2u.js",
      abs_path: "app:///_next/static/chunks/0f73v56w55r2u.js",
      function: "tW",
      lineno: 11,
      colno: 9763,
      in_app: true,
    },
    {
      filename: "<anonymous>",
      abs_path: "<anonymous>",
      function: "new Promise",
      in_app: true,
    },
    {
      filename: "app:///_next/static/chunks/0f73v56w55r2u.js",
      abs_path: "app:///_next/static/chunks/0f73v56w55r2u.js",
      lineno: 11,
      colno: 10014,
      in_app: true,
    },
    {
      filename: "app:///_next/static/chunks/0f73v56w55r2u.js",
      abs_path: "app:///_next/static/chunks/0f73v56w55r2u.js",
      function: "Object.next",
      lineno: 11,
      colno: 10983,
      in_app: true,
    },
    {
      filename: "app:///_next/static/chunks/0f73v56w55r2u.js",
      abs_path: "app:///_next/static/chunks/0f73v56w55r2u.js",
      function: "e.<anonymous>",
      lineno: 11,
      colno: 11456,
      in_app: true,
    },
    {
      filename: "app:///_next/static/chunks/0f73v56w55r2u.js",
      abs_path: "app:///_next/static/chunks/0f73v56w55r2u.js",
      function: "e.handle",
      lineno: 11,
      colno: 6396,
      in_app: true,
    },
    {
      filename: "app:///_next/static/chunks/0l0_44jw8k0xa.js",
      abs_path: "app:///_next/static/chunks/0l0_44jw8k0xa.js",
      lineno: 10,
      colno: 1824,
      in_app: true,
    },
    ...poperBlockerInjectedFetchFrames,
  ];
  const webkitExtensionMessagingTabNotFoundMessage =
    "Invalid call to runtime.sendMessage(). Tab not found.";
  const injectedIosAutoplayNotAllowedMessage =
    "The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.";
  const rainbowKitNotFoundMessage = "not found rainbowkit";
  const nativeJsonStringifyFrame = {
    filename: "[native code]",
    function: "stringify",
    in_app: true,
  };
  const sentryBrowserHelperFrame = {
    filename:
      "node_modules/.pnpm/@sentry+browser@10.45.0/node_modules/@sentry/browser/src/helpers.ts",
    abs_path:
      "node_modules/.pnpm/@sentry+browser@10.45.0/node_modules/@sentry/browser/src/helpers.ts",
    function: "n",
    in_app: true,
    lineno: 111,
    colno: 58,
  };

  type BeforeSendResult = {
    level?: string | undefined;
    tags?: Record<string, unknown> | undefined;
    fingerprint?: string[] | undefined;
    request?: Record<string, unknown> | undefined;
    breadcrumbs?:
      | Array<{
          category?: string | undefined;
          message?: string | undefined;
          data?: Record<string, unknown> | undefined;
        }>
      | undefined;
    exception?:
      | {
          values?: Array<
            | {
                value?: string | undefined;
                mechanism?:
                  | {
                      type?: string | undefined;
                      handled?: boolean | undefined;
                    }
                  | undefined;
              }
            | undefined
          >;
        }
      | undefined;
    message?: string | undefined;
  } | null;

  const loadSentryConfig = () => {
    jest.isolateModules(() => {
      require("@/instrumentation-client");
    });

    const config = mockInit.mock.calls[0]?.[0];
    expect(config).toBeDefined();

    return config;
  };

  const loadBeforeSend = () => {
    const config = loadSentryConfig();
    expect(typeof config.beforeSend).toBe("function");

    return config.beforeSend as (
      event: Record<string, unknown>,
      hint?: Record<string, unknown>
    ) => BeforeSendResult;
  };

  const withRuntimeUserAgent = <T>(
    userAgent: string,
    callback: () => T
  ): T => {
    const originalUserAgent = globalThis.navigator.userAgent;
    Object.defineProperty(globalThis.navigator, "userAgent", {
      configurable: true,
      value: userAgent,
    });

    try {
      return callback();
    } finally {
      Object.defineProperty(globalThis.navigator, "userAgent", {
        configurable: true,
        value: originalUserAgent,
      });
    }
  };

  const loadBeforeSendTransaction = () => {
    const config = loadSentryConfig();
    expect(typeof config.beforeSendTransaction).toBe("function");

    return config.beforeSendTransaction as (event: Record<string, unknown>) => {
      spans?: Array<{
        description?: string | undefined;
        data?: Record<string, unknown> | undefined;
      }>;
      tags?: Record<string, unknown>;
      extra?: Record<string, unknown>;
    };
  };

  const loadBeforeSendSpan = () => {
    const config = loadSentryConfig();
    expect(typeof config.beforeSendSpan).toBe("function");

    return config.beforeSendSpan as (
      span: Record<string, unknown>
    ) => Record<string, unknown>;
  };

  const createUnhandledRejectionEvent = (message: string) => ({
    level: "error",
    exception: {
      values: [
        {
          type: "Error",
          value: message,
          mechanism: {
            type: browserUnhandledRejectionMechanismType,
            handled: false,
          },
        },
      ],
    },
  });

  const createServerComponentRenderError = (
    digest?: unknown,
    message = serverComponentRenderMessage
  ) => {
    const error = new Error(message) as Error & { digest?: unknown };
    if (digest !== undefined) {
      error.digest = digest;
    }
    return error;
  };

  const createServerComponentRenderEvent = (
    message = serverComponentRenderMessage,
    overrides: Record<string, unknown> = {}
  ) => ({
    level: "error",
    exception: {
      values: [
        {
          type: "Error",
          value: message,
          mechanism: {
            type: "generic",
            handled: true,
          },
        },
      ],
    },
    ...overrides,
  });

  const createRabbyChromeUserRejectedEvent = (
    exceptionValueOverrides: Record<string, unknown> = {},
    serializedStack = rabbyChromeUserRejectedStack
  ) => ({
    event_id: "rabby-chrome-user-rejected",
    exception: {
      values: [
        {
          type: "UnhandledRejection",
          value: objectCapturedPromiseRejectionMessage,
          mechanism: {
            type: browserUnhandledRejectionMechanismType,
            handled: false,
          },
          ...exceptionValueOverrides,
        },
      ],
    },
    extra: {
      __serialized__: {
        code: 4001,
        message: "User rejected the request.",
        stack: serializedStack,
      },
    },
  });

  const createBrowserExtensionWalletRejectionEvent = (
    frames: Array<Record<string, unknown>> = browserExtensionWalletBridgeFrames
  ) => ({
    ...createUnhandledRejectionEvent(browserExtensionWalletRejectionMessage),
    exception: {
      values: [
        {
          type: "Error",
          value: browserExtensionWalletRejectionMessage,
          mechanism: {
            type: browserUnhandledRejectionMechanismType,
            handled: false,
          },
          stacktrace: { frames },
        },
      ],
    },
  });

  const createDropReactionNetworkEvent = (eventId: string) => ({
    event_id: eventId,
    level: "warning",
    message: "",
    fingerprint: ["drop-reaction", "network"],
    exception: {
      values: [
        {
          type: "Error",
          value: dropReactionRequestFailedMessage,
          mechanism: {
            type: "generic",
            handled: true,
          },
        },
      ],
    },
    tags: {
      feature: "drop-reaction",
      operation: "reaction-request",
      error_kind: "network",
      url: "/waves/private-wave-id",
    },
    request: {
      url: "/waves/private-wave-id",
      headers: {
        Referer: "/waves/private-referrer-wave-id",
      },
    },
    breadcrumbs: [
      {
        category: "navigation",
        data: {
          from: "/waves/private-navigation-from-wave-id",
          to: "/private-navigation-to-profile-id",
        },
      },
      {
        category: "console",
        level: "error",
        message: `Retry failed for drops/${privateRelativeDropId}/reaction`,
        data: {
          arguments: [
            "Retrying reaction",
            `Retrying wave ${privateBareWaveId}`,
            `Analytics id ${privateNonRfcUuid}`,
            {
              request: {
                endpoint: `drops/${privateRelativeDropId}/reaction`,
                state: "retrying",
              },
            },
          ],
        },
      },
      {
        category: "reactions",
        level: "info",
        message: "reaction.request_sent",
        data: {
          action: "add",
          endpoint_family: "drop_reaction",
          method: "POST",
          mutation_sequence: 1,
          route_family: "/waves/[wave]",
          source: "chip",
        },
      },
      {
        category: "reactions",
        level: "info",
        message: "reaction.request_sent",
        data: {
          action: "add",
          endpoint_family: "drop_reaction",
          method: "POST",
          mutation_sequence: 1,
          route_family: "/waves/[wave]",
          source: "chip",
        },
      },
      {
        type: "http",
        category: "fetch",
        level: "error",
        data: {
          method: "GET",
          url: "/api/waves/private-api-wave-id",
          "url.is_first_party": true,
          "url.is_first_party_api": true,
        },
      },
      {
        type: "http",
        category: "fetch",
        level: "error",
        data: {
          method: "GET",
          url: "/private-profile-id",
          "url.is_first_party": true,
          "url.is_first_party_api": false,
        },
      },
      {
        type: "http",
        category: "fetch",
        level: "error",
        data: {
          method: "POST",
          url: "/api/drops/private-drop-id/reaction",
          "url.is_first_party": true,
          "url.is_first_party_api": true,
        },
      },
      {
        category: "reactions",
        level: "warning",
        message: "reaction.request_failed",
        data: {
          action: "add",
          endpoint_family: "drop_reaction",
          error_kind: "network",
          method: "POST",
          mutation_sequence: 1,
          route_family: "/waves/[wave]",
          source: "chip",
        },
      },
    ],
  });

  const createExpectedWaveReplacementAbortEvent = () => ({
    ...createUnhandledRejectionEvent(expectedWaveAbortErrorValue),
    timestamp: 1_785_689_742.621,
    tags: {
      "DOMException.code": "20",
    },
    breadcrumbs: [
      {
        category: "wave.request",
        message: "wave_request_aborted",
        timestamp: 1_785_689_742.5,
        data: {
          request_kind: "background_sync",
          trigger: "request_replaced",
        },
      },
    ],
  });

  const createPoperBlockerOrphanFetchRejectionEvent = (
    value = poperBlockerNetworkErrorMessage,
    frames: Array<Record<string, unknown>> = poperBlockerProcessedFrames
  ) => ({
    level: "warning",
    exception: {
      values: [
        {
          type: "TypeError",
          value,
          mechanism: {
            type: browserUnhandledRejectionMechanismType,
            handled: false,
          },
          stacktrace: {
            frames,
          },
        },
      ],
    },
  });

  const createBraveWalletPageEvaluationErrorEvent = (
    message: string,
    includeRequest = true
  ) => ({
    transaction: "/waves/:wave",
    ...(includeRequest
      ? {
          request: {
            url: "/waves/[wave]",
            headers: {
              "User-Agent": braveWalletUserAgent,
            },
          },
        }
      : {}),
    tags: {
      transaction: "/waves/:wave",
      url: "/waves/[wave]",
    },
    exception: {
      values: [
        {
          type: "TypeError",
          value: message,
          mechanism: {
            type: "auto.browser.global_handlers.onerror",
            handled: false,
          },
          stacktrace: {
            frames: [
              {
                filename:
                  "app:///waves/00000000-0000-4000-8000-000000000002",
                function: "global code",
                lineno: 1,
                colno: 16,
                in_app: true,
              },
            ],
          },
        },
      ],
    },
  });

  const createWebKitExtensionMessagingTabNotFoundEvent = (
    valueOverrides: Record<string, unknown> = {},
    eventOverrides: Record<string, unknown> = {}
  ) => {
    const event = createUnhandledRejectionEvent(
      webkitExtensionMessagingTabNotFoundMessage
    );

    return {
      ...event,
      ...eventOverrides,
      exception: {
        values: [
          {
            ...event.exception.values[0],
            ...valueOverrides,
          },
        ],
      },
    };
  };

  const createAppleWebKitSortedTrackListEvent = (
    frames: Array<Record<string, unknown>> = [
      {
        filename: "[native code]",
        abs_path: "[native code]",
        function: "sortedTrackListForMenu",
      },
    ]
  ) => ({
    transaction: "/notifications",
    contexts: {
      browser: {
        name: "Apple Mail",
      },
    },
    exception: {
      values: [
        {
          type: "TypeError",
          value: "Type error",
          mechanism: {
            type: "auto.browser.global_handlers.onerror",
            handled: false,
          },
          stacktrace: {
            frames,
          },
        },
      ],
    },
  });

  const createChromeMobileIosInjectedGaEvent = () => ({
    level: "error",
    transaction: "/nextgen/collection/:collection/art",
    request: {
      url: "https://6529.io/nextgen/collection/pebbles/art",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.1 Mobile/TEST Safari/604.1",
      },
    },
    exception: {
      values: [
        {
          type: "Error",
          value: "ga",
          mechanism: {
            type: "auto.browser.global_handlers.onerror",
            handled: false,
          },
          stacktrace: {
            frames: [
              {
                filename: "app:///nextgen/collection/pebbles/art",
                function: "?",
                lineno: 415,
                colno: 45,
                in_app: true,
              },
            ],
          },
        },
      ],
    },
  });

  const createInjectedIosAutoplayFrames = (documentPath = "app:///") => [
    {
      filename: documentPath,
      function: "global code",
      lineno: 27,
      colno: 5,
    },
    {
      filename: documentPath,
      function: "?",
      lineno: 4,
      colno: 32,
    },
    {
      filename: "[native code]",
      function: "forEach",
    },
    {
      filename: documentPath,
      function: "?",
      lineno: 6,
      colno: 21,
    },
    {
      filename: "[native code]",
      function: "play",
    },
  ];

  const createInjectedIosAutoplayNotAllowedEvent = (
    valueOverrides: Record<string, unknown> = {},
    eventOverrides: Record<string, unknown> = {},
    frames: Array<Record<string, unknown>> = createInjectedIosAutoplayFrames()
  ) => ({
    contexts: {
      browser: {
        name: "Mobile Safari",
        version: "17.4.1",
      },
      os: {
        name: "iOS",
        version: "17.4.1",
      },
    },
    ...eventOverrides,
    exception: {
      values: [
        {
          type: "NotAllowedError",
          value: injectedIosAutoplayNotAllowedMessage,
          mechanism: {
            type: browserUnhandledRejectionMechanismType,
            handled: false,
          },
          stacktrace: {
            frames,
          },
          ...valueOverrides,
        },
      ],
    },
  });

  const createInstagramPageHideBridgeEvent = (
    columns: readonly [number, number, number] = [5517, 3808, 1208],
    documentPath = "app:///example-profile/rep"
  ) => ({
    contexts: {
      browser: { name: "Instagram" },
      os: { name: "iOS" },
    },
    exception: {
      values: [
        {
          type: "TypeError",
          value: instagramPageHideBridgeErrorMessage,
          mechanism: {
            type: "auto.browser.global_handlers.onerror",
            handled: false,
          },
          stacktrace: {
            frames: [
              {
                filename: documentPath,
                abs_path: documentPath,
                function: "?",
                lineno: 1,
                colno: columns[0],
                in_app: true,
              },
              {
                filename: documentPath,
                abs_path: documentPath,
                function: "sendPageHideMessage",
                lineno: 1,
                colno: columns[1],
                in_app: true,
              },
              {
                filename: documentPath,
                abs_path: documentPath,
                function: "sendDataToNative",
                lineno: 1,
                colno: columns[2],
                in_app: true,
              },
            ],
          },
        },
      ],
    },
  });

  const createSentryRouteParameterizationEvent = (
    frames: Array<Record<string, unknown>> = [nativeJsonStringifyFrame],
    overrides: Record<string, unknown> = {}
  ) => ({
    transaction: "/waves/:wave",
    exception: {
      values: [
        {
          type: "TypeError",
          value: sentryRouteParameterizationMessage,
          mechanism: {
            type: sentryRouteParameterizationMechanismType,
            handled: false,
          },
          stacktrace: {
            frames,
          },
        },
      ],
    },
    request: {
      url: "https://6529.io/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
    },
    contexts: {
      app: {
        app_name: "MetaMaskMobile",
      },
      browser: {
        name: "Mobile Safari UI/WKWebView",
      },
    },
    tags: {
      browser: "Mobile Safari UI/WKWebView",
      "browser.name": "Mobile Safari UI/WKWebView",
    },
    breadcrumbs: [
      {
        category: "navigation",
        data: {
          from: "/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
          to: "/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
        },
      },
    ],
    ...overrides,
  });

  const createAppKitCoinbaseBreadcrumbs = () => [
    {
      category: "console",
      level: "debug",
      message: "[AppKitInitialization] Initializing AppKit adapter (web) with",
      data: {
        arguments: [
          "[AppKitInitialization] Initializing AppKit adapter (web) with",
          0,
          "AppWallets",
        ],
      },
    },
    {
      category: "console",
      level: "debug",
      message: "AppKit config",
      data: {
        arguments: [
          {
            enableCoinbase: true,
            featuredWalletIds: ["metamask", "walletConnect"],
            features: {
              connectMethodsOrder: ["wallet"],
            },
          },
        ],
      },
    },
  ];
  const createObservedAppKitBootstrapBreadcrumbs = () => [
    {
      category: "mobile_launch",
      level: "info",
      message: "wagmi_appkit_init_start",
      data: { offset_ms: 181 },
    },
    {
      category: "mobile_launch",
      level: "info",
      message: "wagmi_appkit_init_ok",
      data: { offset_ms: 181 },
    },
    {
      category: "mobile_launch",
      level: "info",
      message: "wagmi_adapter_created",
      data: { offset_ms: 187 },
    },
  ];

  const createObservedRabbyRainbowKitRawFrames = () => [
    {
      filename: "app:///_next/static/chunks/observed-rabby-webview.js",
      abs_path: "app:///_next/static/chunks/observed-rabby-webview.js",
      function: "n",
      in_app: true,
    },
    {
      filename: "[native code]",
      abs_path: "[native code]",
      function: "Promise",
      in_app: true,
    },
  ];

  const createRabbyMobileRainbowKitNotFoundEvent = (
    overrides: Record<string, unknown> = {}
  ) => ({
    event_id: "rabby-mobile-rainbowkit-not-found",
    exception: {
      values: [
        {
          type: "Error",
          value: rainbowKitNotFoundMessage,
          mechanism: {
            type: "auto.browser.global_handlers.onunhandledrejection",
            handled: false,
          },
          stacktrace: {
            frames: createObservedRabbyRainbowKitRawFrames(),
          },
        },
      ],
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.resetModules();
    mockInit.mockReset();
    mockReplayIntegration.mockReset();
    mockReplayIntegration.mockImplementation(() => ({ name: "replay" }));
    mockThirdPartyErrorFilterIntegration.mockReset();
    mockThirdPartyErrorFilterIntegration.mockImplementation(() => ({
      name: "third-party-errors-filter",
    }));
    mockCaptureRouterTransitionStart.mockReset();
  });

  it("configures filtering for exclusively third-party frames", () => {
    const config = loadSentryConfig();
    const defaultIntegrations = [{ name: "default" }];

    expect(config.integrations(defaultIntegrations)).toEqual([
      ...defaultIntegrations,
      { name: "third-party-errors-filter" },
    ]);
    expect(mockThirdPartyErrorFilterIntegration).toHaveBeenCalledWith({
      filterKeys: ["6529-frontend"],
      behaviour: "drop-error-if-exclusively-contains-third-party-frames",
    });
  });

  it("keeps exact Server Component render errors and groups them by digest", () => {
    const beforeSend = loadBeforeSend();

    const first = beforeSend(createServerComponentRenderEvent(), {
      originalException: createServerComponentRenderError("779660776"),
    });
    const repeated = beforeSend(createServerComponentRenderEvent(), {
      originalException: createServerComponentRenderError("779660776"),
    });
    const different = beforeSend(createServerComponentRenderEvent(), {
      originalException: createServerComponentRenderError("1680982760"),
    });

    expect(first).toEqual(
      expect.objectContaining({
        level: "error",
        tags: expect.objectContaining({
          next_error_digest: "779660776",
        }),
        fingerprint: ["next-server-component-render", "779660776"],
      })
    );
    expect(repeated).toEqual(
      expect.objectContaining({
        tags: expect.objectContaining({
          next_error_digest: "779660776",
        }),
        fingerprint: ["next-server-component-render", "779660776"],
      })
    );
    expect(different).toEqual(
      expect.objectContaining({
        tags: expect.objectContaining({
          next_error_digest: "1680982760",
        }),
        fingerprint: ["next-server-component-render", "1680982760"],
      })
    );
    expect(different?.fingerprint).not.toEqual(first?.fingerprint);
  });

  it("prefers the original Server Component error digest", () => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(createServerComponentRenderEvent(), {
      originalException: createServerComponentRenderError("779660776"),
      syntheticException: createServerComponentRenderError("1680982760"),
    });

    expect(result).toEqual(
      expect.objectContaining({
        tags: expect.objectContaining({
          next_error_digest: "779660776",
        }),
        fingerprint: ["next-server-component-render", "779660776"],
      })
    );
  });

  it("preserves an existing Server Component render error fingerprint", () => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(
      createServerComponentRenderEvent(serverComponentRenderMessage, {
        fingerprint: ["existing-fingerprint"],
      }),
      {
        syntheticException: createServerComponentRenderError("779660776"),
      }
    );

    expect(result).toEqual(
      expect.objectContaining({
        tags: expect.objectContaining({
          next_error_digest: "779660776",
        }),
        fingerprint: ["existing-fingerprint"],
      })
    );
  });

  it("replaces an empty Server Component error fingerprint", () => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(
      createServerComponentRenderEvent(serverComponentRenderMessage, {
        fingerprint: [],
      }),
      {
        originalException: createServerComponentRenderError("779660776"),
      }
    );

    expect(result?.fingerprint).toEqual([
      "next-server-component-render",
      "779660776",
    ]);
  });

  it.each([
    {
      description: "changed wrapper message",
      message: `${serverComponentRenderMessage} Extra detail.`,
      digest: "779660776",
    },
    {
      description: "missing digest",
      message: serverComponentRenderMessage,
      digest: undefined,
    },
    {
      description: "digest containing whitespace",
      message: serverComponentRenderMessage,
      digest: "779 660 776",
    },
    {
      description: "non-string digest",
      message: serverComponentRenderMessage,
      digest: 779660776,
    },
    ...[401, 403, 404].map((status) => ({
      description: `HTTP ${status} access-fallback digest`,
      message: serverComponentRenderMessage,
      digest: `NEXT_HTTP_ERROR_FALLBACK;${status}`,
    })),
  ])(
    "keeps the $description Server Component near miss unchanged",
    ({ message, digest }) => {
      const beforeSend = loadBeforeSend();

      const result = beforeSend(createServerComponentRenderEvent(message), {
        originalException: createServerComponentRenderError(digest, message),
      });

      expect(result).not.toBeNull();
      expect(result?.tags).toBeUndefined();
      expect(result?.fingerprint).toBeUndefined();
      expect(result).toEqual(
        expect.objectContaining({
          level: "error",
          exception: expect.objectContaining({
            values: [expect.objectContaining({ value: message })],
          }),
        })
      );
    }
  );

  it.each([
    {
      description: "raw WebKit user-delete message",
      message: indexedDBUserDeleteMessage,
    },
    {
      description: "Sentry-prefixed WebKit user-delete value",
      message: `UnknownError: ${indexedDBUserDeleteMessage}`,
    },
    {
      description: "raw WebKit open-failure message",
      message: "Unable to open database file on disk",
    },
    {
      description: "Sentry-prefixed WebKit open-failure value",
      message: "UnknownError: Unable to open database file on disk",
    },
    {
      description: "raw WebKit record-without-transaction message",
      message: indexedDBGetRecordNoTransactionMessage,
    },
    {
      description: "Sentry-prefixed WebKit record-without-transaction value",
      message: `UnknownError: ${indexedDBGetRecordNoTransactionMessage}`,
    },
  ])(
    "classifies the $description as a handled IndexedDB warning",
    ({ message }) => {
      const beforeSend = loadBeforeSend();

      const result = beforeSend(createUnhandledRejectionEvent(message));

      expect(result).toEqual(
        expect.objectContaining({
          level: "warning",
          tags: expect.objectContaining({
            errorType: "indexeddb",
            handled: true,
          }),
          fingerprint: ["indexeddb-connection-lost"],
          exception: expect.objectContaining({
            values: [
              expect.objectContaining({
                mechanism: {
                  type: browserUnhandledRejectionMechanismType,
                  handled: true,
                },
              }),
            ],
          }),
        })
      );
    }
  );

  it.each([
    "UnknownError: Database deleted by request of the administrator",
    "UnknownError: Database deleted by request of the user during migration",
    "UnknownError: Unable to open database file on disk because it is locked",
    `${indexedDBGetRecordNoTransactionMessage} while reopening`,
    `UnknownError:${indexedDBGetRecordNoTransactionMessage}`,
    "Attempt to get records from database without an in-progress transaction",
    "Attempt to store a record in an object store without an in-progress transaction",
  ])("preserves the near-miss database failure %s", (message) => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(createUnhandledRejectionEvent(message));

    expect(result).toEqual(expect.objectContaining({ level: "error" }));
    expect(result?.tags).toBeUndefined();
    expect(result?.fingerprint).toBeUndefined();
    expect(result?.exception?.values?.[0]?.mechanism).toEqual({
      type: browserUnhandledRejectionMechanismType,
      handled: false,
    });
  });

  it.each([
    braveWalletSelectedAddressMessage,
    braveWalletEmitMessage,
  ])("drops the exact Brave Wallet page-evaluation error: %s", (message) => {
    const beforeSend = loadBeforeSend();
    const event = createBraveWalletPageEvaluationErrorEvent(message);

    const result = beforeSend(event);

    expect(event).not.toHaveProperty("contexts.browser");
    expect(event).not.toHaveProperty("tags.browser.name");
    expect(result).toBeNull();
  });

  it("drops a Brave Wallet page-evaluation error using the runtime user agent without request data", () => {
    const beforeSend = loadBeforeSend();
    const event = createBraveWalletPageEvaluationErrorEvent(
      braveWalletSelectedAddressMessage,
      false
    );

    const result = withRuntimeUserAgent(braveWalletUserAgent, () =>
      beforeSend(event)
    );

    expect(event).not.toHaveProperty("request");
    expect(result).toBeNull();
  });

  it("drops the Brave Wallet error with its WebKit page stack in the hint", () => {
    const beforeSend = loadBeforeSend();
    const event = createBraveWalletPageEvaluationErrorEvent(
      braveWalletSelectedAddressMessage
    );
    const originalException = new TypeError(
      braveWalletSelectedAddressMessage
    );
    originalException.stack = [
      `TypeError: ${braveWalletSelectedAddressMessage}`,
      "global code@https://6529.io/waves/00000000-0000-4000-8000-000000000002:1:16",
    ].join("\n");

    const result = beforeSend(event, { originalException });

    expect(result).toBeNull();
  });

  it("preserves a near-miss Brave Wallet page-evaluation error", () => {
    const beforeSend = loadBeforeSend();
    const event = createBraveWalletPageEvaluationErrorEvent(
      "window.ethereum is unavailable"
    );

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("drops disconnected wallet-provider object promise rejections", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "wallet-provider-disconnected",
      exception: {
        values: [
          {
            type: "UnhandledRejection",
            value: objectCapturedPromiseRejectionMessage,
          },
        ],
      },
      extra: {
        __serialized__: {
          code: 4900,
          message: "The provider is disconnected from all chains.",
          stack: disconnectedProviderStack,
        },
      },
      tags: {
        mechanism: "auto.browser.global_handlers.onunhandledrejection",
      },
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops the exact Rabby Chrome user-rejected object rejection", () => {
    const beforeSend = loadBeforeSend();
    const event = createRabbyChromeUserRejectedEvent();

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("keeps Rabby Chrome user rejections with app-owned frames", () => {
    const beforeSend = loadBeforeSend();
    const event = createRabbyChromeUserRejectedEvent({
      stacktrace: {
        frames: [
          {
            filename: "hooks/drops/useDropSignature.ts",
            abs_path: "hooks/drops/useDropSignature.ts",
            in_app: true,
          },
        ],
      },
    });

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps Rabby Chrome user rejections with app-owned serialized frames", () => {
    const beforeSend = loadBeforeSend();
    const event = createRabbyChromeUserRejectedEvent(
      {},
      [
        rabbyChromeUserRejectedStack,
        "    at signDrop (app:///hooks/drops/useDropSignature.ts:1:1)",
      ].join("\n")
    );

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("drops unsupported wallet_revokePermissions provider rejections", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "wallet-revoke-permissions-unsupported",
      exception: {
        values: [
          {
            type: "UnhandledRejection",
            value: objectCapturedPromiseRejectionWithoutStackMessage,
            mechanism: {
              type: browserUnhandledRejectionMechanismType,
              handled: false,
            },
          },
        ],
      },
      extra: {
        __serialized__: {
          code: -32601,
          message: unsupportedWalletRevokePermissionsMessage,
        },
      },
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops Backpack internal provider rejections during a recent window.ethereum collision", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "backpack-window-ethereum-collision",
      timestamp: 1000.475,
      exception: {
        values: [
          {
            type: "UnhandledRejection",
            value: objectCapturedPromiseRejectionWithoutStackMessage,
            mechanism: {
              type: browserUnhandledRejectionMechanismType,
              handled: false,
            },
          },
        ],
      },
      extra: {
        __serialized__: {
          code: -32603,
          message: "Internal JSON-RPC error.",
        },
      },
      breadcrumbs: [
        {
          timestamp: 1000,
          category: "console",
          level: "error",
          message: readOnlyEthereumProxyBreadcrumbMessage,
        },
        {
          timestamp: 1000.458,
          category: "console",
          level: "info",
          message: backpackWalletCollisionBreadcrumbMessage,
        },
        {
          timestamp: 1000.462,
          type: "http",
          category: "fetch",
          level: "info",
        },
      ],
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops exact React DOM insertBefore NotFoundError events on waves routes with no app frames", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "react-dom-insert-before-event",
      transaction: "/waves",
      exception: {
        values: [
          {
            type: "NotFoundError",
            value: reactDomInsertBeforeMessage,
            stacktrace: {
              frames: [reactDomFrame],
            },
          },
        ],
      },
      tags: {
        transaction: "/waves",
        url: "/waves/633b5f84-3461-461d-b6d1-4d0cc03e7099",
      },
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it.each([
    {
      name: "ending in sN",
      getFrames: () => createObservedReactDomRawInsertBeforeFrames("sN"),
      transaction: "/waves",
    },
    {
      name: "ending in sR",
      getFrames: () => createObservedReactDomRawInsertBeforeFrames("sR"),
      transaction: "/waves",
    },
    {
      name: "with repeated sN placement frames on join-6529",
      getFrames: createLatestReactDomRawFrames,
      transaction: "/join-6529",
    },
  ])(
    "drops the production-shaped raw React DOM stack $name",
    ({ getFrames, transaction }) => {
      const beforeSend = loadBeforeSend();
      const event = {
        event_id: "raw-react-dom-insert-before-event",
        transaction,
        exception: {
          values: [
            {
              type: "NotFoundError",
              value: reactDomInsertBeforeMessage,
              mechanism: {
                type: "generic",
                handled: true,
              },
              stacktrace: {
                frames: getFrames(),
              },
            },
          ],
        },
        tags: {
          transaction,
          url: transaction,
        },
      };

      const result = beforeSend(event);

      expect(result).toBeNull();
    }
  );

  it("keeps the production-shaped raw React DOM stack on an unobserved route", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "raw-react-dom-insert-before-unobserved-route",
      transaction: "/about",
      exception: {
        values: [
          {
            type: "NotFoundError",
            value: reactDomInsertBeforeMessage,
            mechanism: {
              type: "generic",
              handled: true,
            },
            stacktrace: {
              frames: createLatestReactDomRawFrames(),
            },
          },
        ],
      },
      tags: {
        transaction: "/about",
        url: "/about",
      },
    };

    const result = beforeSend(event);

    expect(result).toEqual(event);
  });

  it("drops exact React DOM removeChild NotFoundError events on affected routes with no app frames", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "react-dom-remove-child-event",
      transaction: "/6529-gradient",
      exception: {
        values: [
          {
            type: "NotFoundError",
            value: reactDomRemoveChildMessage,
            stacktrace: {
              frames: [reactDomFrame],
            },
          },
        ],
      },
      tags: {
        transaction: "/6529-gradient",
        url: "/6529-gradient",
      },
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops production-shaped React DOM removeChild NotFoundError events on the parameterized profile transaction", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "profile-react-dom-remove-child-event",
      transaction: "/:user",
      request: {
        url: "https://6529.io/profile-name",
      },
      exception: {
        values: [
          {
            type: "NotFoundError",
            value: reactDomRemoveChildMessage,
            stacktrace: {
              frames: [reactDomFrame],
            },
          },
        ],
      },
      tags: {
        transaction: "/:user",
        url: "/profile-name",
      },
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops injected WebAssembly CSP unsafe-eval errors", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      exception: {
        values: [
          {
            type: "RuntimeError",
            value: wasmCspUnsafeEvalMessage,
            stacktrace: {
              frames: [
                {
                  filename: "app:///inject.js",
                  abs_path: "app:///inject.js",
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops observed Sentry E7 WebAssembly CSP unsafe-eval errors from injected static chunks", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      transaction: "/the-memes/:id",
      exception: {
        values: [
          {
            type: "RuntimeError",
            value: observedSentryE7WasmCspUnsafeEvalMessage,
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename: "app:///chunks/utils-DNoBWR8F.js",
                  abs_path: "app:///chunks/utils-DNoBWR8F.js",
                  in_app: true,
                },
                {
                  filename: "app:///chunks/utils-DNoBWR8F.js",
                  abs_path: "app:///chunks/utils-DNoBWR8F.js",
                  in_app: true,
                },
                {
                  filename: "app:///chunks/utils-DNoBWR8F.js",
                  abs_path: "app:///chunks/utils-DNoBWR8F.js",
                  function: "k",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
      tags: {
        environment: "production",
        transaction: "/the-memes/:id",
        url: "/the-memes/447",
      },
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops observed anonymous EvalError CSP unsafe-eval errors", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      transaction: "/",
      exception: {
        values: [
          {
            type: "EvalError",
            value: anonymousUnsafeEvalCspMessage,
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename:
                    "node_modules/.pnpm/@sentry+browser@10.45.0/node_modules/@sentry/browser/src/helpers.ts",
                  abs_path:
                    "node_modules/.pnpm/@sentry+browser@10.45.0/node_modules/@sentry/browser/src/helpers.ts",
                  function: "n",
                },
                {
                  filename: "<anonymous>:234:30",
                  abs_path: "<anonymous>:234:30",
                  function: "next",
                },
                {
                  filename: "<anonymous>:234:30",
                  abs_path: "<anonymous>:234:30",
                  function: "predicate",
                },
                {
                  filename: "<anonymous>",
                  abs_path: "<anonymous>",
                  function: "eval",
                },
              ],
            },
          },
        ],
      },
      tags: {
        environment: "production",
        transaction: "/",
        url: "/",
      },
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it.each([3, 7])(
    "drops the observed raw anonymous EvalError wrapper at line %i",
    (wrapperLine) => {
      const beforeSend = loadBeforeSend();
      const event = {
        transaction: "/waves/:wave",
        exception: {
          values: [
            {
              type: "EvalError",
              value: anonymousUnsafeEvalCspMessage,
              mechanism: {
                type: "auto.browser.global_handlers.onunhandledrejection",
                handled: false,
              },
              stacktrace: {
                frames: [
                  {
                    filename: "app:///_next/static/chunks/0example-chunk.js",
                    abs_path: "app:///_next/static/chunks/0example-chunk.js",
                    function: "n",
                    in_app: true,
                    lineno: wrapperLine,
                    colno: 4853,
                  },
                  {
                    filename: "<anonymous>",
                    abs_path: "<anonymous>",
                    function: "next",
                    in_app: true,
                    lineno: 234,
                    colno: 30,
                  },
                  {
                    filename: "<anonymous>",
                    abs_path: "<anonymous>",
                    function: "predicate",
                    in_app: true,
                    lineno: 234,
                    colno: 30,
                  },
                  {
                    filename: "<anonymous>",
                    abs_path: "<anonymous>",
                    function: "eval",
                    in_app: true,
                  },
                ],
              },
            },
          ],
        },
        tags: {
          environment: "production",
          transaction: "/waves/:wave",
          url: "/waves/example",
        },
      };
      const error = new EvalError(anonymousUnsafeEvalCspMessage);
      error.stack = [
        `EvalError: ${anonymousUnsafeEvalCspMessage}`,
        "    at eval (<anonymous>)",
        "    at predicate (<anonymous>:234:30)",
        "    at next (<anonymous>:234:30)",
        `    at n (app:///_next/static/chunks/0example-chunk.js:${wrapperLine}:4853)`,
      ].join("\n");

      const result = beforeSend(event, { originalException: error });

      expect(result).toBeNull();
    }
  );

  it("drops gif-picker Tenor category errors with no app frames", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "gif-picker-tenor-categories-event",
      transaction: "/waves/:wave",
      request: {
        url: "https://6529.io/waves/b38288e6-ca9d-45ce-8323-3dc5e094f04e",
      },
      tags: {
        transaction: "/waves/:wave",
        url: "/waves/b38288e6-ca9d-45ce-8323-3dc5e094f04e",
      },
      exception: {
        values: [
          {
            type: "TypeError",
            value: gifPickerTenorUndefinedTagsMessage,
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [gifPickerTenorManagerFrame],
            },
          },
        ],
      },
      breadcrumbs: [
        {
          category: "console",
          level: "error",
          message: "[gif-picker-react] Failed to fetch data from Tenor API",
        },
        {
          type: "http",
          category: "fetch",
          level: "error",
          message: "GET: /v2/categories [403]",
          data: {
            url: "/v2/categories",
            status_code: 403,
            "url.is_first_party": false,
            "url.is_first_party_api": false,
          },
        },
      ],
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops gif-picker Tenor search errors with no app frames", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "gif-picker-tenor-search-event",
      transaction: "/waves",
      request: {
        url: "https://6529.io/waves/1e2686e7-fa70-4be7-acf2-b763ed6b320b",
      },
      tags: {
        transaction: "/waves",
        url: "/waves/1e2686e7-fa70-4be7-acf2-b763ed6b320b",
      },
      exception: {
        values: [
          {
            type: "TypeError",
            value: gifPickerTenorUndefinedResultsMapMessage,
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [gifPickerTenorManagerFrame],
            },
          },
        ],
      },
      breadcrumbs: [
        {
          category: "console",
          level: "error",
          message: "[gif-picker-react] Failed to fetch data from Tenor API",
        },
        {
          type: "http",
          category: "fetch",
          level: "warning",
          message: "GET: /v2/search [403]",
          data: {
            url: "/v2/search",
            "url.is_first_party": false,
            "url.is_first_party_api": false,
          },
        },
      ],
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops observed injected WebAssembly.Module CSP unsafe-eval errors", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      exception: {
        values: [
          {
            type: "CompileError",
            value: observedWasmModuleCspUnsafeEvalMessage,
            stacktrace: {
              frames: [
                {
                  filename: "///inject.js",
                  abs_path: "///inject.js",
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops Coinbase WalletLink websocket 1006 unhandled rejections", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename:
                    "https://dnclu2fna0b2b.cloudfront.net/_next/static/chunks/app/layout-123.js",
                  function: "webSocket.onclose",
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event, {
      originalException: new Error("websocket error 1006:"),
    });

    expect(result).toBeNull();
  });

  it("drops production Coinbase WalletLink websocket 1006 frames marked in_app", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename:
                    "webpack://_n_e/./node_modules/@coinbase/wallet-sdk/dist/relay/walletlink/connection/WalletLinkWebSocket.js",
                  abs_path:
                    "webpack://_n_e/./node_modules/@coinbase/wallet-sdk/dist/relay/walletlink/connection/WalletLinkWebSocket.js",
                  function: "webSocket.onclose",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops exact Talisman onboarding errors from extension page.js frames", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      transaction: "/the-memes/mint",
      exception: {
        values: [
          {
            type: "Error",
            value: talismanOnboardingMessage,
            stacktrace: {
              frames: [
                {
                  filename: "chrome-extension://talisman-wallet/page.js",
                  abs_path: "chrome-extension://talisman-wallet/page.js",
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: [
        {
          category: "console",
          message:
            "Detected multiple injected wallet providers; Backpack override skipped.",
        },
      ],
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops no-frame AppKit Coinbase websocket 1006 errors", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [],
            },
          },
        ],
      },
      breadcrumbs: createAppKitCoinbaseBreadcrumbs(),
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops raw AppKit Coinbase websocket 1006 unhandled rejections", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      exception: {
        values: [
          {
            type: "Error",
            value: "Error: websocket error 1006:",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename:
                    "https://dnclu2fna0b2b.cloudfront.net/_next/static/chunks/app/layout-123.js",
                  function: "e",
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: createAppKitCoinbaseBreadcrumbs(),
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops raw AppKit Coinbase websocket 1006 frames marked in_app", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      exception: {
        values: [
          {
            type: "Error",
            value: "Error: websocket error 1006:",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename:
                    "https://dnclu2fna0b2b.cloudfront.net/_next/static/chunks/app/layout-123.js",
                  function: "e",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: createAppKitCoinbaseBreadcrumbs(),
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops observed AppKit bootstrap websocket 1006 unhandled rejections", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      exception: {
        values: [
          {
            type: "Error",
            value: "Error: websocket error 1006:",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename:
                    "https://dnclu2fna0b2b.cloudfront.net/_next/static/chunks/app/layout-123.js",
                  function: "e",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: createObservedAppKitBootstrapBreadcrumbs(),
    };

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("keeps exact Talisman onboarding errors with app-owned frames", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      transaction: "/the-memes/mint",
      exception: {
        values: [
          {
            type: "Error",
            value: talismanOnboardingMessage,
            stacktrace: {
              frames: [
                {
                  filename: "chrome-extension://talisman-wallet/page.js",
                  abs_path: "chrome-extension://talisman-wallet/page.js",
                },
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./components/auth/WagmiSetup.tsx",
                  function: "initializeWalletProviders",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps app-owned websocket 1006 errors with AppKit Coinbase breadcrumbs", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
            stacktrace: {
              frames: [
                {
                  filename: "services/websocket/WebSocketProvider.tsx",
                  abs_path:
                    "webpack-internal:///(app-pages-browser)/./services/websocket/WebSocketProvider.tsx",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: createAppKitCoinbaseBreadcrumbs(),
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps raw Next static in_app websocket 1006 close errors without third-party wallet evidence", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename:
                    "https://dnclu2fna0b2b.cloudfront.net/_next/static/chunks/app/services-websocket-provider-123.js",
                  function: "webSocket.onclose",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("drops the exact Apple WebKit native track-list TypeError", () => {
    const beforeSend = loadBeforeSend();
    const event = createAppleWebKitSortedTrackListEvent();

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("keeps the Apple WebKit-shaped TypeError when an application frame is present", () => {
    const beforeSend = loadBeforeSend();
    const event = createAppleWebKitSortedTrackListEvent([
      {
        filename: "[native code]",
        abs_path: "[native code]",
        function: "sortedTrackListForMenu",
      },
      {
        filename: "webpack-internal:///(app-pages-browser)/./app/page.tsx",
        function: "renderPage",
        in_app: true,
      },
    ]);

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("drops the exact Chrome Mobile iOS document ga error", () => {
    const beforeSend = loadBeforeSend();
    const event = createChromeMobileIosInjectedGaEvent();

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("keeps the Chrome Mobile iOS ga error when an application chunk frame is present", () => {
    const beforeSend = loadBeforeSend();
    const documentEvent = createChromeMobileIosInjectedGaEvent();
    const [documentException] = documentEvent.exception.values;
    if (!documentException) {
      throw new Error("Expected the test event to contain an exception.");
    }
    const event = {
      ...documentEvent,
      exception: {
        values: [
          {
            ...documentException,
            stacktrace: {
              frames: [
                ...documentException.stacktrace.frames,
                {
                  filename: "app:///_next/static/chunks/app-owned.js",
                  function: "renderArt",
                  lineno: 1,
                  colno: 1,
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it.each(["app:///", "app:///waves/11111111-2222-4333-8444-555555555555"])(
    "drops the exact client-shaped injected iOS autoplay rejection from %s",
    (path) => {
      const beforeSend = loadBeforeSend();
      const event = createInjectedIosAutoplayNotAllowedEvent(
        {},
        {},
        createInjectedIosAutoplayFrames(path)
      );

      const result = beforeSend(event);

      expect(result).toBeNull();
    }
  );

  it.each([
    ["Instagram 439.x", [5421, 3712, 1142] as const, "app:///"],
    ["Instagram 438.x", [5517, 3808, 1208] as const, "app:///profile/rep"],
    ["Instagram 436.x/437.x", [6257, 4139, 1325] as const, "app:///waves/id"],
  ])(
    "drops the %s raw iOS page-hide bridge signature",
    (_cohort, columns, documentPath) => {
      const beforeSend = loadBeforeSend();
      const event = createInstagramPageHideBridgeEvent(columns, documentPath);

      const result = beforeSend(event);

      expect(result).toBeNull();
    }
  );

  it.each<
    [
      string,
      Record<string, unknown>,
      Record<string, unknown>,
      Array<Record<string, unknown>> | undefined,
    ]
  >([
    [
      "an unrelated permission message",
      { value: "The operation is not allowed in the current context." },
      {},
      undefined,
    ],
    ["a different exception type", { type: "Error" }, {}, undefined],
    [
      "a different mechanism",
      {
        mechanism: {
          type: "auto.browser.global_handlers.onerror",
          handled: false,
        },
      },
      {},
      undefined,
    ],
    [
      "a handled rejection",
      {
        mechanism: {
          type: browserUnhandledRejectionMechanismType,
          handled: true,
        },
      },
      {},
      undefined,
    ],
    [
      "a non-iOS browser context",
      {},
      {
        contexts: {
          browser: { name: "Chrome" },
          os: { name: "Android" },
        },
      },
      undefined,
    ],
    [
      "an application chunk frame",
      {},
      {},
      [
        {
          filename:
            "webpack-internal:///(app-pages-browser)/./components/media/VideoPlayer.tsx",
          abs_path:
            "webpack-internal:///(app-pages-browser)/./components/media/VideoPlayer.tsx",
          function: "playVideo",
          lineno: 27,
          colno: 5,
        },
        ...createInjectedIosAutoplayFrames().slice(1),
      ],
    ],
    [
      "a conflicting absolute path",
      {},
      {},
      createInjectedIosAutoplayFrames().map((frame, index) =>
        index === 0
          ? { ...frame, abs_path: "app:///components/media/VideoPlayer.tsx" }
          : frame
      ),
    ],
    [
      "a named document callback",
      {},
      {},
      createInjectedIosAutoplayFrames().map((frame, index) =>
        index === 1 ? { ...frame, function: "playVideo" } : frame
      ),
    ],
    [
      "a changed document coordinate",
      {},
      {},
      createInjectedIosAutoplayFrames().map((frame, index) =>
        index === 1 ? { ...frame, lineno: 5 } : frame
      ),
    ],
    [
      "an extra frame",
      {},
      {},
      [
        ...createInjectedIosAutoplayFrames(),
        { filename: "[native code]", function: "dispatchEvent" },
      ],
    ],
    [
      "a different document route",
      {},
      {},
      createInjectedIosAutoplayFrames("app:///notifications"),
    ],
  ])("keeps the iOS autoplay near miss with %s", (_, value, event, frames) => {
    const beforeSend = loadBeforeSend();
    const result = beforeSend(
      createInjectedIosAutoplayNotAllowedEvent(value, event, frames)
    );

    expect(result).not.toBeNull();
  });

  it("keeps mixed events containing the injected autoplay rejection", () => {
    const beforeSend = loadBeforeSend();
    const autoplayEvent = createInjectedIosAutoplayNotAllowedEvent();
    const event = {
      ...autoplayEvent,
      exception: {
        values: [
          ...autoplayEvent.exception.values,
          {
            type: "TypeError",
            value: "Application media state failed.",
            stacktrace: {
              frames: [
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./components/media/VideoPlayer.tsx",
                  function: "updatePlaybackState",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps the Instagram 439.x bridge shape with a changed coordinate", () => {
    const beforeSend = loadBeforeSend();
    const event = createInstagramPageHideBridgeEvent(
      [5422, 3712, 1142],
      "app:///"
    );

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps an Instagram page-hide bridge error with changed coordinates", () => {
    const beforeSend = loadBeforeSend();
    const event = createInstagramPageHideBridgeEvent([5518, 3808, 1208]);

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps the exact bridge shape outside Instagram", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      ...createInstagramPageHideBridgeEvent(),
      contexts: {
        browser: { name: "Twitter" },
        os: { name: "iOS" },
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps the exact bridge shape with an app-owned original stack", () => {
    const beforeSend = loadBeforeSend();
    const event = createInstagramPageHideBridgeEvent();
    const error = new Error(instagramPageHideBridgeErrorMessage);
    error.stack = [
      `TypeError: ${instagramPageHideBridgeErrorMessage}`,
      "    at sendDataToNative (webpack-internal:///(app-pages-browser)/./utils/instagram-bridge.ts:10:1)",
    ].join("\n");

    const result = beforeSend(event, { originalException: error });

    expect(result).not.toBeNull();
  });

  it("drops exact MetaMask Mobile cyclic JSON timer noise", () => {
    const beforeSend = loadBeforeSend();
    const event = createSentryRouteParameterizationEvent();

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops exact MetaMask Mobile cyclic JSON timer noise with a Sentry browser helper frame", () => {
    const beforeSend = loadBeforeSend();
    const event = createSentryRouteParameterizationEvent(
      [sentryBrowserHelperFrame, nativeJsonStringifyFrame],
      {
        transaction: "/messages",
        request: {
          url: "https://6529.io/messages",
        },
        breadcrumbs: [],
      }
    );

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("keeps iOS WKWebView cyclic JSON timer errors without app context", () => {
    const beforeSend = loadBeforeSend();
    const event = createSentryRouteParameterizationEvent(
      [
        {
          filename:
            "node_modules/.pnpm/@sentry+nextjs@10.45.0/node_modules/@sentry/nextjs/src/client/routing/parameterization.ts",
          function: "n",
        },
        nativeJsonStringifyFrame,
      ],
      {
        transaction: "/waves",
        request: {
          url: "https://6529.io/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
        },
        contexts: {
          browser: {
            name: "Mobile Safari UI/WKWebView",
          },
          os: {
            name: "iOS",
            version: "18.7",
          },
        },
        tags: {
          browser: "Mobile Safari UI/WKWebView",
          "browser.name": "Mobile Safari UI/WKWebView",
          "os.name": "iOS",
          url: "/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
          transaction: "/waves",
        },
        breadcrumbs: [
          {
            category: "navigation",
            data: {
              from: "/waves",
              to: "/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
            },
          },
        ],
      }
    );

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps route parameterization cyclic JSON errors without MetaMaskMobile WKWebView context", () => {
    const beforeSend = loadBeforeSend();
    const event = createSentryRouteParameterizationEvent(
      [nativeJsonStringifyFrame],
      {
        contexts: {
          browser: {
            name: "Mobile Safari",
          },
        },
        tags: {
          browser: "Mobile Safari",
          "browser.name": "Mobile Safari",
        },
      }
    );

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps cyclic JSON errors with app-owned frames", () => {
    const beforeSend = loadBeforeSend();
    const event = createSentryRouteParameterizationEvent(
      [
        {
          filename:
            "node_modules/.pnpm/@sentry+nextjs@10.45.0/node_modules/@sentry/nextjs/src/client/routing/parameterization.ts",
          function: "n",
        },
        nativeJsonStringifyFrame,
        {
          filename: "https://6529.io/_next/static/chunks/app-client.js",
          function: "serializeWaveParams",
          in_app: true,
        },
      ],
      {
        contexts: {},
        tags: {},
      }
    );

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps sampled cyclic JSON timer diagnostics", () => {
    const beforeSend = loadBeforeSend();
    const event = createSentryRouteParameterizationEvent([
      nativeJsonStringifyFrame,
      {
        filename: "utils/monitoring/cyclicJsonTimerDiagnostics.ts",
        function: "diagnosticCallback",
        lineno: 404,
        in_app: true,
      },
    ]);

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps Sentry route-parameterization cyclic JSON errors outside iOS webviews", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      ...noiseFilterFixtures.cp,
      request: {
        ...noiseFilterFixtures.cp.request,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
        },
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps the raw CP event before browser context enrichment", () => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(noiseFilterFixtures.cp);

    expect(result).not.toBeNull();
  });

  it("drops the raw B9 Twitter CONFIG event with a Sentry wrapper frame", () => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(noiseFilterFixtures.b9);

    expect(result).toBeNull();
  });

  it("keeps B9-shaped events from Twitter-lookalike user agents", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      ...noiseFilterFixtures.b9,
      request: {
        ...noiseFilterFixtures.b9.request,
        headers: {
          "User-Agent": "ExampleTwitter/12.3 (iPhone; iOS 16.7.14)",
        },
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("drops the raw 9N Twitter currentInset event", () => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(noiseFilterFixtures.nineN);

    expect(result).toBeNull();
  });

  it("drops the raw 3V injected sendMessage event with a Sentry helper frame", () => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(noiseFilterFixtures.threeV);

    expect(result).toBeNull();
  });

  it("drops the exact browser-extension wallet rejection bridge stack", () => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(createBrowserExtensionWalletRejectionEvent());

    expect(result).toBeNull();
  });

  it("keeps a browser-extension wallet rejection with changed coordinates", () => {
    const beforeSend = loadBeforeSend();
    const frames = browserExtensionWalletBridgeFrames.map((frame, index) =>
      index === 4 ? { ...frame, colno: 16592 } : frame
    );

    const result = beforeSend(
      createBrowserExtensionWalletRejectionEvent(frames)
    );

    expect(result).not.toBeNull();
  });

  it("drops the exact frame-less WebKit extension tab-not-found rejection", () => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(createWebKitExtensionMessagingTabNotFoundEvent());

    expect(result).toBeNull();
  });

  it("keeps mixed WebKit and app-owned exceptions", () => {
    const beforeSend = loadBeforeSend();
    const baseEvent = createWebKitExtensionMessagingTabNotFoundEvent();
    const event = {
      ...baseEvent,
      exception: {
        values: [
          ...baseEvent.exception.values,
          {
            type: "TypeError",
            value: "App-owned failure",
            stacktrace: {
              frames: [
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./services/messaging/sendMessage.ts",
                  function: "sendMessage",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it.each([
    [
      "an altered message",
      { value: "Invalid call to runtime.sendMessage(). No tab found." },
      {},
    ],
    ["a different exception type", { type: "TypeError" }, {}],
    [
      "a different mechanism",
      {
        mechanism: {
          type: "auto.browser.global_handlers.onerror",
          handled: false,
        },
      },
      {},
    ],
    [
      "a handled mechanism",
      {
        mechanism: {
          type: browserUnhandledRejectionMechanismType,
          handled: true,
        },
      },
      {},
    ],
    [
      "an app-owned frame",
      {
        stacktrace: {
          frames: [
            {
              filename:
                "webpack-internal:///(app-pages-browser)/./services/messaging/sendMessage.ts",
              function: "sendMessage",
              in_app: true,
            },
          ],
        },
      },
      {},
    ],
    [
      "an app-owned serialized stack",
      {},
      {
        extra: {
          __serialized__: {
            message: webkitExtensionMessagingTabNotFoundMessage,
            stack:
              "Error: Invalid call to runtime.sendMessage(). Tab not found.\n    at sendMessage (app:///services/messaging/sendMessage.ts:10:1)",
          },
        },
      },
    ],
  ])("keeps the WebKit tab-not-found near miss with %s", (_, value, event) => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(
      createWebKitExtensionMessagingTabNotFoundEvent(value, event)
    );

    expect(result).not.toBeNull();
  });

  it("keeps WebKit tab-not-found rejections with app-owned original stacks", () => {
    const beforeSend = loadBeforeSend();
    const error = new Error(webkitExtensionMessagingTabNotFoundMessage);
    error.stack = [
      `Error: ${webkitExtensionMessagingTabNotFoundMessage}`,
      "    at sendMessage (webpack-internal:///(app-pages-browser)/./services/messaging/sendMessage.ts:10:1)",
    ].join("\n");

    const result = beforeSend(
      createWebKitExtensionMessagingTabNotFoundEvent(),
      { originalException: error }
    );

    expect(result).not.toBeNull();
  });

  it("drops the raw DK Coinbase request-relay websocket event", () => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(noiseFilterFixtures.dk);

    expect(result).toBeNull();
  });

  it("keeps the intentional raw 2Y sampled first-party network event", () => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(noiseFilterFixtures.twoY);

    expect(result).not.toBeNull();
    expect(result?.tags?.["network_noise_sampled"]).toBe("true");
  });

  it("drops the exact expected Wave background-sync replacement abort", () => {
    const beforeSend = loadBeforeSend();
    const event = createExpectedWaveReplacementAbortEvent();

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("keeps the Wave AbortError without the replacement breadcrumb", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      ...createExpectedWaveReplacementAbortEvent(),
      breadcrumbs: [],
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("drops the normalized Poper Blocker orphan fetch rejection", () => {
    const beforeSend = loadBeforeSend();
    const event = createPoperBlockerOrphanFetchRejectionEvent();

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops the current Poper Blocker rejection with an unsymbolicated fetch frame", () => {
    const beforeSend = loadBeforeSend();
    const event = createPoperBlockerOrphanFetchRejectionEvent(
      poperBlockerNetworkErrorMessage,
      poperBlockerCurrentProcessedFrames
    );

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops the latest raw Poper Blocker orphan fetch rejection", () => {
    const beforeSend = loadBeforeSend();
    const event = createPoperBlockerOrphanFetchRejectionEvent(
      poperBlockerNetworkErrorMessage,
      poperBlockerLatestRawFrames
    );

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("drops the recommended raw Poper Blocker orphan fetch rejection", () => {
    const beforeSend = loadBeforeSend();
    const event = createPoperBlockerOrphanFetchRejectionEvent(
      "Failed to fetch",
      poperBlockerRecommendedRawFrames
    );

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("keeps mixed-exception events with a Poper Blocker rejection first", () => {
    const beforeSend = loadBeforeSend();
    const poperBlockerEvent = createPoperBlockerOrphanFetchRejectionEvent();
    const event = {
      ...poperBlockerEvent,
      exception: {
        values: [
          ...poperBlockerEvent.exception.values,
          {
            type: "Error",
            value: "Application request validation failed.",
            stacktrace: {
              frames: [
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./services/api/common-api.ts",
                  function: "executeApiRequest",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps first-party unread-DM network failures without the extension signature", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      level: "warning",
      exception: {
        values: [
          {
            type: "TypeError",
            value: poperBlockerNetworkErrorMessage,
            mechanism: {
              type: browserUnhandledRejectionMechanismType,
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./services/api/common-api.ts",
                  function: "executeApiRequest",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps handled frame-less network failures grouped with Poper Blocker noise", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      level: "warning",
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "Network request failed. Please check your connection and try again. (/track/)",
            mechanism: {
              type: "generic",
              handled: true,
            },
            stacktrace: {
              frames: [],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps app-owned Twitter currentInset errors", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      ...noiseFilterFixtures.nineN,
      exception: {
        values: [
          {
            ...noiseFilterFixtures.nineN.exception.values[0],
            stacktrace: {
              frames: [
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./components/waves/WaveLayout.tsx",
                  function: "updateCurrentInset",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps app-owned sendMessage failures", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      ...noiseFilterFixtures.threeV,
      exception: {
        values: [
          {
            ...noiseFilterFixtures.threeV.exception.values[0],
            stacktrace: {
              frames: [
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./services/messaging/sendMessage.ts",
                  function: "sendMessage",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps app-owned requestRelay websocket failures", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      ...noiseFilterFixtures.dk,
      exception: {
        values: [
          {
            ...noiseFilterFixtures.dk.exception.values[0],
            stacktrace: {
              frames: [
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./services/websocket/requestRelay.ts",
                  function: "handleRelayClose",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("drops the observed raw RainbowKit lookup error without wallet context", () => {
    const beforeSend = loadBeforeSend();
    const event = createRabbyMobileRainbowKitNotFoundEvent();

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("keeps exact RabbyMobile RainbowKit lookup errors with app-owned frames", () => {
    const beforeSend = loadBeforeSend();
    const event = createRabbyMobileRainbowKitNotFoundEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: rainbowKitNotFoundMessage,
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename: "https://6529.io/_next/static/chunks/app-client.js",
                  function: "initializeWallet",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps exact RainbowKit lookup errors without the observed raw frames", () => {
    const beforeSend = loadBeforeSend();
    const event = createRabbyMobileRainbowKitNotFoundEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: rainbowKitNotFoundMessage,
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename:
                    "node_modules/@sentry/nextjs/src/client/routing/parameterization.ts",
                  function: "n",
                  in_app: false,
                },
                {
                  filename: "[native code]",
                  function: "Promise",
                  in_app: false,
                },
              ],
            },
          },
        ],
      },
    });

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("keeps non-exact RainbowKit lookup messages", () => {
    const beforeSend = loadBeforeSend();
    const event = createRabbyMobileRainbowKitNotFoundEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "Error: not found rainbowkit",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: createObservedRabbyRainbowKitRawFrames(),
            },
          },
        ],
      },
    });

    const result = beforeSend(event);

    expect(result).not.toBeNull();
  });

  it("drops sampled-out first-party browser transport network errors", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Load failed",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("Load failed"),
    });

    expect(result).toBeNull();
  });

  it("drops sampled-out first-party WebKit network connection lost errors", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      exception: {
        values: [
          {
            type: "TypeError",
            value: "The network connection was lost.",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("The network connection was lost."),
    });

    expect(result).toBeNull();
    expect(event.exception.values[0]?.value).toBe(
      "Network request failed. Please check your connection and try again. (/api/waves-overview)"
    );
  });

  it("rewrites raw browser network errors with the first-party failed target before dropping", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Load failed",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "https://example.com/collect",
            "url.is_first_party": false,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("Load failed"),
    });

    expect(result).toBeNull();
    expect(event.exception.values[0]?.value).toBe(
      "Network request failed. Please check your connection and try again. (/api/waves-overview)"
    );
  });

  it("ignores non-URL parentheses in raw browser network error messages", () => {
    const beforeSend = loadBeforeSend();
    const message = "Failed to fetch (while loading wave overview)";
    const event = {
      event_id: "network-drop-event",
      exception: {
        values: [
          {
            type: "TypeError",
            value: message,
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError(message),
    });

    expect(result).toBeNull();
    expect(event.exception.values[0]?.value).toBe(
      "Network request failed. Please check your connection and try again. (/api/waves-overview)"
    );
  });

  it("uses valid parenthesized URLs in raw browser network error messages", () => {
    const beforeSend = loadBeforeSend();
    const message = "Failed to fetch (/api/message-target)";
    const event = {
      event_id: "network-drop-event",
      request: {
        url: "/api/request-target",
      },
      exception: {
        values: [
          {
            type: "TypeError",
            value: message,
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/breadcrumb-target",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError(message),
    });

    expect(result).not.toBeNull();
    expect(result?.exception?.values?.[0]?.value).toBe(
      "Network request failed. Please check your connection and try again. (/api/message-target)"
    );
  });

  it("does not send raw browser network messages with absolute URLs", () => {
    const beforeSend = loadBeforeSend();
    const message =
      "Failed to fetch (https://api.6529.io/api/waves-overview?token=secret#hash)";
    const event = {
      event_id: "event-200",
      message,
      exception: {
        values: [
          {
            type: "TypeError",
            value: message,
          },
        ],
      },
    };

    const result = beforeSend(event, {
      originalException: new TypeError(message),
    });
    const value = result?.exception?.values?.[0]?.value;
    const eventMessage = result?.message;

    expect(result).not.toBeNull();
    expect(value).toBe(
      "Network request failed. Please check your connection and try again. (/api/waves-overview)"
    );
    expect(eventMessage).toBe(
      "Network request failed. Please check your connection and try again. (/api/waves-overview)"
    );
    for (const output of [value, eventMessage]) {
      expect(output).not.toContain("Failed to fetch");
      expect(output).not.toContain("https://");
      expect(output).not.toContain("token=");
      expect(output).not.toContain("#hash");
    }
  });

  it("keeps raw browser network errors for newer first-party page failures", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Load failed",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/notifications",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("Load failed"),
    });

    expect(result).not.toBeNull();
    expect(result?.exception?.values?.[0]?.value).toBe(
      "Network request failed. Please check your connection and try again. (/notifications)"
    );
    expect(result?.tags).toEqual(
      expect.objectContaining({
        errorType: "network",
        handled: true,
      })
    );
    expect(result?.tags?.["network_noise_sampled"]).toBeUndefined();
  });

  it("drops sampled-out raw browser transport network errors when a later unrelated request fails", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Load failed",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 500,
            url: "/api/identity",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("Load failed"),
    });

    expect(result).toBeNull();
  });

  it("uses a failed fetch breadcrumb with no status for raw browser network errors", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Load failed",
          },
        ],
      },
      breadcrumbs: [
        {
          category: "fetch",
          level: "error",
          data: {
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 500,
            url: "/api/identity",
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("Load failed"),
    });

    expect(result).toBeNull();
    expect(event.exception.values[0]?.value).toBe(
      "Network request failed. Please check your connection and try again. (/api/waves-overview)"
    );
  });

  it("keeps a failed fetch breadcrumb with no status ahead of a later successful breadcrumb", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Load failed",
          },
        ],
      },
      breadcrumbs: [
        {
          category: "fetch",
          level: "error",
          data: {
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 200,
            url: "/api/identity",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("Load failed"),
    });

    expect(result).toBeNull();
    expect(event.exception.values[0]?.value).toBe(
      "Network request failed. Please check your connection and try again. (/api/waves-overview)"
    );
  });

  it("uses a status 0 breadcrumb instead of a later successful breadcrumb", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      request: {
        url: "/api/request-target",
      },
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Load failed",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 200,
            url: "/api/identity",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("Load failed"),
    });

    expect(result).toBeNull();
    expect(event.exception.values[0]?.value).toBe(
      "Network request failed. Please check your connection and try again. (/api/waves-overview)"
    );
  });

  it("falls back to the request URL when only successful breadcrumbs exist", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-keep-event",
      request: {
        url: "/api/request-target",
      },
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Load failed",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 200,
            url: "/api/identity",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("Load failed"),
    });

    expect(result).not.toBeNull();
    expect(result?.exception?.values?.[0]?.value).toBe(
      "Network request failed. Please check your connection and try again. (/api/request-target)"
    );
    expect(result?.tags?.["network_noise_sampled"]).toBeUndefined();
  });

  it("uses the latest failed fetch breadcrumb for raw browser network errors", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Load failed",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/a",
            "url.is_first_party": true,
          },
        },
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/b",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("Load failed"),
    });

    expect(result).toBeNull();
    expect(event.exception.values[0]?.value).toBe(
      "Network request failed. Please check your connection and try again. (/api/b)"
    );
  });

  it("keeps and tags sampled-in first-party browser transport network errors", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "event-200",
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Load failed",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("Load failed"),
    });

    expect(result).not.toBeNull();
    expect(result?.tags).toEqual(
      expect.objectContaining({
        errorType: "network",
        handled: true,
        network_failure_kind: "browser_transport",
        network_noise_sampled: "true",
      })
    );
    expect(result?.fingerprint).toEqual(["network-error"]);
  });

  it("drops sampled-out app-wrapped first-party browser transport network errors", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      exception: {
        values: [
          {
            type: "Error",
            value: wrappedNetworkMessage,
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new Error(wrappedNetworkMessage),
    });

    expect(result).toBeNull();
  });

  it("drops sampled-out app-wrapped browser transport network errors when a later unrelated request fails", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      exception: {
        values: [
          {
            type: "Error",
            value: wrappedNetworkMessage,
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 500,
            url: "/api/identity",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new Error(wrappedNetworkMessage),
    });

    expect(result).toBeNull();
  });

  it("sanitizes app-wrapped absolute network URLs before sending", () => {
    const beforeSend = loadBeforeSend();
    const message =
      "Network request failed. Please check your connection and try again. (https://api.6529.io/api/waves-overview?token=secret#hash)";
    const expectedMessage =
      "Network request failed. Please check your connection and try again. (/api/waves-overview)";
    const event = {
      event_id: "event-200",
      message,
      exception: {
        values: [
          {
            type: "Error",
            value: message,
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new Error(message),
    });

    expect(result).not.toBeNull();
    expect(result?.exception?.values?.[0]?.value).toBe(expectedMessage);
    expect(result?.message).toBe(expectedMessage);
    expect(result?.exception?.values?.[0]?.value).not.toContain("token=");
    expect(result?.message).not.toContain("#hash");
  });

  it("drops sampled-out app-wrapped absolute API network errors using the original target", () => {
    const beforeSend = loadBeforeSend();
    const message =
      "Network request failed. Please check your connection and try again. (https://api.6529.io/api/waves-overview?token=secret#hash)";
    const expectedMessage =
      "Network request failed. Please check your connection and try again. (/api/waves-overview)";
    const event = {
      event_id: "network-drop-event",
      message,
      exception: {
        values: [
          {
            type: "Error",
            value: message,
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new Error(message),
    });

    expect(result).toBeNull();
    expect(event.exception.values[0]?.value).toBe(expectedMessage);
    expect(event.message).toBe(expectedMessage);
    expect(event.exception.values[0]?.value).not.toContain("token=");
    expect(event.message).not.toContain("#hash");
  });

  it("drops a sampled-out concurrent synthetic drop-reaction transport warning", () => {
    const beforeSend = loadBeforeSend();
    const event = createDropReactionNetworkEvent("network-drop-event");

    const result = beforeSend(event, {
      originalException: new Error(dropReactionRequestFailedMessage),
    });

    expect(result).toBeNull();
  });

  it("keeps and tags a sampled-in concurrent synthetic drop-reaction transport warning", () => {
    const beforeSend = loadBeforeSend();
    const event = createDropReactionNetworkEvent("event-200");

    const result = beforeSend(event, {
      originalException: new Error(dropReactionRequestFailedMessage),
    });

    expect(result).not.toBeNull();
    expect(result?.tags).toEqual(
      expect.objectContaining({
        feature: "drop-reaction",
        operation: "reaction-request",
        error_kind: "network",
        network_failure_kind: "browser_transport",
        network_noise_sampled: "true",
      })
    );
    expect(result?.tags?.["errorType"]).toBeUndefined();
    expect(result?.exception?.values?.[0]?.value).toBe(
      dropReactionRequestFailedMessage
    );
    expect(result?.exception?.values?.[0]?.value).not.toContain("/");
    expect(result?.fingerprint).toEqual(["drop-reaction", "network"]);
    expect(result?.request).toBeUndefined();
    expect(result?.tags?.["url"]).toBeUndefined();

    const serializedResult = JSON.stringify(result);
    for (const privateValue of [
      "private-api-wave-id",
      "private-drop-id",
      "private-navigation-from-wave-id",
      "private-navigation-to-profile-id",
      "private-profile-id",
      "private-referrer-wave-id",
      "private-wave-id",
      privateBareWaveId,
      privateNonRfcUuid,
      privateRelativeDropId,
    ]) {
      expect(serializedResult).not.toContain(privateValue);
    }

    const breadcrumbUrls = result?.breadcrumbs
      ?.map((breadcrumb) => breadcrumb.data?.["url"])
      .filter((url): url is string => typeof url === "string");
    expect(breadcrumbUrls).toEqual(["[Filtered]", "[Filtered]", "[Filtered]"]);
    expect(
      result?.breadcrumbs?.find(
        (breadcrumb) => breadcrumb.category === "navigation"
      )?.data
    ).toEqual(
      expect.objectContaining({
        from: "[Filtered]",
        to: "[Filtered]",
      })
    );
    expect(
      result?.breadcrumbs?.find(
        (breadcrumb) => breadcrumb.category === "console"
      )
    ).toEqual(
      expect.objectContaining({
        message: "[Filtered]",
        data: expect.objectContaining({
          arguments: [
            "Retrying reaction",
            "[Filtered]",
            "[Filtered]",
            {
              request: {
                endpoint: "[Filtered]",
                state: "retrying",
              },
            },
          ],
        }),
      })
    );
    expect(
      result?.breadcrumbs
        ?.filter((breadcrumb) => breadcrumb.category === "reactions")
        .map((breadcrumb) => breadcrumb.data?.["route_family"])
    ).toEqual(["/waves/[wave]", "/waves/[wave]", "/waves/[wave]"]);
  });

  it("keeps and tags sampled-in app-wrapped absolute API network errors using the original target", () => {
    const beforeSend = loadBeforeSend();
    const message =
      "Network request failed. Please check your connection and try again. (https://api.6529.io/api/waves-overview?token=secret#hash)";
    const expectedMessage =
      "Network request failed. Please check your connection and try again. (/api/waves-overview)";
    const event = {
      event_id: "event-200",
      message,
      exception: {
        values: [
          {
            type: "Error",
            value: message,
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new Error(message),
    });

    expect(result).not.toBeNull();
    expect(result?.tags).toEqual(
      expect.objectContaining({
        errorType: "network",
        handled: true,
        network_failure_kind: "browser_transport",
        network_noise_sampled: "true",
      })
    );
    expect(result?.exception?.values?.[0]?.value).toBe(expectedMessage);
    expect(result?.message).toBe(expectedMessage);
    expect(result?.exception?.values?.[0]?.value).not.toContain("token=");
    expect(result?.message).not.toContain("#hash");
  });

  it("keeps and tags sampled-in app-wrapped first-party browser transport network errors without rewriting the message", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "event-200",
      message: wrappedNetworkMessage,
      fingerprint: ["drop-reaction", "network"],
      exception: {
        values: [
          {
            type: "Error",
            value: wrappedNetworkMessage,
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new Error(wrappedNetworkMessage),
    });

    expect(result).not.toBeNull();
    expect(result?.tags).toEqual(
      expect.objectContaining({
        errorType: "network",
        handled: true,
        network_failure_kind: "browser_transport",
        network_noise_sampled: "true",
      })
    );
    expect(result?.exception?.values?.[0]?.value).toBe(wrappedNetworkMessage);
    expect(result?.message).toBe(wrappedNetworkMessage);
    expect(result?.fingerprint).toEqual(["drop-reaction", "network"]);
  });

  it("does not tag unrelated plain errors that mention network", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "event-200",
      exception: {
        values: [
          {
            type: "Error",
            value: "network switch failed",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new Error("network switch failed"),
    });

    expect(result).not.toBeNull();
    expect(result?.tags?.["errorType"]).toBeUndefined();
  });

  it("does not tag unrelated TypeErrors that mention network", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "event-200",
      exception: {
        values: [
          {
            type: "TypeError",
            value: "network switch failed",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("network switch failed"),
    });

    expect(result).not.toBeNull();
    expect(result?.tags?.["errorType"]).toBeUndefined();
    expect(result?.exception?.values?.[0]?.value).toBe("network switch failed");
  });

  it("does not tag unrelated TypeErrors that contain NetworkError in a function name", () => {
    const beforeSend = loadBeforeSend();
    const message = "handleNetworkError is not a function";
    const event = {
      event_id: "event-200",
      message,
      exception: {
        values: [
          {
            type: "TypeError",
            value: message,
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError(message),
    });

    expect(result).not.toBeNull();
    expect(result?.tags?.["errorType"]).toBeUndefined();
    expect(result?.message).toBe(message);
    expect(result?.exception?.values?.[0]?.value).toBe(message);
  });

  it("keeps browser network errors with a real HTTP status", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Load failed",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 500,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("Load failed"),
    });

    expect(result).not.toBeNull();
    expect(result?.tags).toEqual(
      expect.objectContaining({
        errorType: "network",
        handled: true,
      })
    );
    expect(result?.tags?.["network_noise_sampled"]).toBeUndefined();
    expect(result?.exception?.values?.[0]?.value).toBe(
      "Network request failed. Please check your connection and try again. (/api/waves-overview)"
    );
  });

  it("keeps browser network errors when a later breadcrumb has a real HTTP failure", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Load failed",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 500,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("Load failed"),
    });

    expect(result).not.toBeNull();
    expect(result?.tags).toEqual(
      expect.objectContaining({
        errorType: "network",
        handled: true,
      })
    );
    expect(result?.tags?.["network_noise_sampled"]).toBeUndefined();
    expect(result?.exception?.values?.[0]?.value).toBe(
      "Network request failed. Please check your connection and try again. (/api/waves-overview)"
    );
  });

  it("uses the failed breadcrumb instead of request URL when a later same-target request has a real HTTP failure", () => {
    const beforeSend = loadBeforeSend();
    const event = {
      event_id: "network-drop-event",
      request: {
        url: "/api/identity",
      },
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Load failed",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 500,
            url: "/api/waves-overview",
            "url.is_first_party": true,
          },
        },
      ],
    };

    const result = beforeSend(event, {
      originalException: new TypeError("Load failed"),
    });

    expect(result).not.toBeNull();
    expect(result?.exception?.values?.[0]?.value).toBe(
      "Network request failed. Please check your connection and try again. (/api/waves-overview)"
    );
    expect(result?.tags?.["network_noise_sampled"]).toBeUndefined();
  });

  it("removes only the known noisy third-party telemetry spans", () => {
    const beforeSendTransaction = loadBeforeSendTransaction();
    const event = {
      type: "transaction",
      transaction: "/waves",
      spans: [
        {
          op: "http.client",
          description: "GET https://6529.io/waves",
          data: {
            "http.url": "https://6529.io/waves?_rsc=vusbg",
            "http.response.status_code": 200,
            "url.same_origin": true,
          },
        },
        {
          op: "http.client",
          description: `GET https://api.6529.io/api/waves/${syntheticAutomaticWaveId}`,
          data: {
            "http.url": `https://api.6529.io/api/waves/${syntheticAutomaticWaveId}`,
            "http.response.status_code": 200,
            "url.same_origin": false,
          },
        },
        {
          op: "ui.long-animation-frame",
          description: "Main UI thread blocked",
          data: {
            "code.filepath":
              "https://dnclu2fna0b2b.cloudfront.net/_next/static/chunks/722c02d231c5c0f1.js",
          },
        },
        {
          op: "http.client",
          description: "POST https://region1.google-analytics.com/g/collect",
          data: {
            "http.url": "https://region1.google-analytics.com/g/collect",
            "http.response.status_code": 0,
            "url.same_origin": false,
          },
        },
        {
          op: "http.client",
          description: "POST https://cca-lite.coinbase.com/metrics",
          data: {
            "http.url": "https://cca-lite.coinbase.com/metrics",
            "http.response.status_code": 0,
            "url.same_origin": false,
          },
        },
        {
          op: "resource.beacon",
          description: "https://cca-lite.coinbase.com/amp",
          data: {
            "http.response.status_code": 0,
            "http.response_transfer_size": 0,
            "url.same_origin": false,
          },
        },
      ],
    };

    const result = beforeSendTransaction(event);
    const remainingDescriptions = result.spans?.map(
      (span) => span.description ?? span.data?.["http.url"]
    );

    expect(remainingDescriptions).toEqual(
      expect.arrayContaining([
        "GET /waves",
        "GET /api/waves/:uuid",
        "Main UI thread blocked",
      ])
    );
    expect(remainingDescriptions).not.toEqual(
      expect.arrayContaining([
        "POST https://region1.google-analytics.com/g/collect",
        "POST https://cca-lite.coinbase.com/metrics",
        "https://cca-lite.coinbase.com/amp",
      ])
    );
    expect(result.tags).toEqual(
      expect.objectContaining({
        third_party_span_noise_filtered: "true",
      })
    );
    expect(result.extra).toEqual(
      expect.objectContaining({
        filteredThirdPartySpanCount: 3,
        filteredThirdPartySpanKeys: [
          "cca-lite.coinbase.com/amp",
          "cca-lite.coinbase.com/metrics",
          "region1.google-analytics.com/g/collect",
        ],
      })
    );
    expect(JSON.stringify(result)).not.toContain(syntheticAutomaticWaveId);
  });

  it("registers a non-dropping sanitizer for standalone automatic spans", () => {
    const beforeSendSpan = loadBeforeSendSpan();
    const span = {
      op: "http.client",
      description: `GET https://api.6529.io/api/waves/${syntheticAutomaticWaveId}?access_token=synthetic#private`,
      start_timestamp: 10,
      timestamp: 10.5,
      data: {
        "http.method": "GET",
        "http.response.status_code": 502,
        "http.url": `https://api.6529.io/api/waves/${syntheticAutomaticWaveId}?access_token=synthetic#private`,
        "url.same_origin": false,
      },
    };

    const result = beforeSendSpan(span);
    const payload = JSON.stringify(result);

    expect(result).toEqual(
      expect.objectContaining({
        description: "GET /api/waves/:uuid",
        start_timestamp: 10,
        timestamp: 10.5,
        data: expect.objectContaining({
          "http.method": "GET",
          "http.response.status_code": 502,
          "http.url": "/api/waves/:uuid",
          "url.same_origin": false,
        }),
      })
    );
    expect(payload).not.toContain(syntheticAutomaticWaveId);
    expect(payload).not.toContain("access_token");
    expect(payload).not.toContain("#private");
  });

  it("does not add audit metadata when no spans were filtered", () => {
    const beforeSendTransaction = loadBeforeSendTransaction();
    const event = {
      type: "transaction",
      transaction: "/waves",
      spans: [
        {
          op: "http.client",
          description: "GET https://6529.io/waves",
          data: {
            "http.url": "https://6529.io/waves?_rsc=vusbg",
            "http.response.status_code": 200,
            "url.same_origin": true,
          },
        },
        {
          op: "http.client",
          description: "POST https://api-js.mixpanel.com/track/",
          data: {
            "http.url": "https://api-js.mixpanel.com/track/",
            "http.response.status_code": 200,
            "url.same_origin": false,
          },
        },
      ],
    };

    const result = beforeSendTransaction(event);

    expect(result.spans).toHaveLength(2);
    expect(result.tags?.["third_party_span_noise_filtered"]).toBeUndefined();
    expect(result.extra?.["filteredThirdPartySpanCount"]).toBeUndefined();
    expect(result.extra?.["filteredThirdPartySpanKeys"]).toBeUndefined();
  });

  it("is a no-op when the transaction has no spans", () => {
    const beforeSendTransaction = loadBeforeSendTransaction();
    const event = {
      type: "transaction",
      transaction: "/waves",
    };

    const result = beforeSendTransaction(event);

    expect(result.spans).toBeUndefined();
    expect(result.tags).toBeUndefined();
    expect(result.extra).toBeUndefined();
  });
});
