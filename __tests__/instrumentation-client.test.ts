import noiseFilterFixtures from "@/__tests__/fixtures/sentry-noise-filter-hardening.json";

const mockInit = jest.fn();
const mockReplayIntegration = jest.fn(() => ({ name: "replay" }));
const mockCaptureRouterTransitionStart = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  init: mockInit,
  replayIntegration: mockReplayIntegration,
  captureRouterTransitionStart: mockCaptureRouterTransitionStart,
}));

describe("instrumentation-client", () => {
  const wrappedNetworkMessage =
    "Network request failed. Please check your connection and try again. (/api/waves-overview)";
  const objectCapturedPromiseRejectionMessage =
    "Object captured as promise rejection with keys: code, message, stack";
  const indexedDBUserDeleteMessage =
    "Database deleted by request of the user";
  const talismanOnboardingMessage =
    "Talisman extension has not been configured yet. Please continue with onboarding.";
  const disconnectedProviderStack =
    "Error: The provider is disconnected from all chains.\n    at o (chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/background.js:2:7356292)";
  const reactDomInsertBeforeMessage =
    "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.";
  const gifPickerTenorUndefinedTagsMessage =
    "undefined is not an object (evaluating 'e.tags')";
  const gifPickerTenorUndefinedResultsMapMessage =
    "undefined is not an object (evaluating 'e.results.map')";
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
  const rainbowKitNotFoundMessage = "not found rainbowkit";
  const nativeJsonStringifyFrame = {
    filename: "[native code]",
    function: "stringify",
    in_app: true,
  };

  type BeforeSendResult = {
    level?: string | undefined;
    tags?: Record<string, unknown> | undefined;
    fingerprint?: string[] | undefined;
    exception?:
      | {
          values?: Array<{ value?: string | undefined } | undefined>;
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

  const createUnhandledRejectionEvent = (message: string) => ({
    level: "error",
    exception: {
      values: [
        {
          type: "Error",
          value: message,
          mechanism: {
            type: "auto.browser.global_handlers.onunhandledrejection",
            handled: false,
          },
        },
      ],
    },
  });

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
    mockCaptureRouterTransitionStart.mockReset();
  });

  it.each([
    {
      description: "raw WebKit message",
      message: indexedDBUserDeleteMessage,
    },
    {
      description: "Sentry-prefixed WebKit value",
      message: `UnknownError: ${indexedDBUserDeleteMessage}`,
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
        })
      );
    }
  );

  it.each([
    "UnknownError: Database deleted by request of the administrator",
    "UnknownError: Database deleted by request of the user during migration",
  ])("preserves the near-miss database failure %s", (message) => {
    const beforeSend = loadBeforeSend();

    const result = beforeSend(createUnhandledRejectionEvent(message));

    expect(result).toEqual(expect.objectContaining({ level: "error" }));
    expect(result?.tags).toBeUndefined();
    expect(result?.fingerprint).toBeUndefined();
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
                    filename:
                      "app:///_next/static/chunks/0example-chunk.js",
                    abs_path:
                      "app:///_next/static/chunks/0example-chunk.js",
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

  it("keeps cyclic JSON timer errors for origin diagnostics", () => {
    const beforeSend = loadBeforeSend();
    const event = createSentryRouteParameterizationEvent();

    const result = beforeSend(event);

    expect(result).not.toBeNull();
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
          description:
            "GET https://api.6529.io/api/waves/b6128077-ea78-4dd9-b381-52c4eadb2077",
          data: {
            "http.url":
              "https://api.6529.io/api/waves/b6128077-ea78-4dd9-b381-52c4eadb2077",
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
        "GET https://6529.io/waves",
        "GET https://api.6529.io/api/waves/b6128077-ea78-4dd9-b381-52c4eadb2077",
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
