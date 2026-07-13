import {
  __testing,
  getLowValueNetworkErrorDecision,
  getLowValueNetworkErrorTargetUrl,
  getNetworkErrorMessageTargetUrl,
  shouldFilterByFilenameExceptions,
  shouldFilterAnonymousUnsafeEvalCspError,
  shouldFilterBrowserExtensionMessagingConnectionError,
  shouldFilterCoinbaseWalletLinkWebSocket1006,
  shouldFilterDisconnectedWalletProviderRejection,
  shouldFilterGifPickerTenorCategoriesError,
  shouldFilterInjectedProviderProxyStartsWithError,
  shouldFilterInjectedWalletCollision,
  shouldFilterReactDomInsertBeforeNotFoundError,
  shouldFilterReactDomRemoveChildNotFoundError,
  shouldFilterInjectedWasmCspUnsafeEval,
  shouldFilterRabbyMobileRainbowKitNotFoundError,
  shouldFilterRabbyMobileUserRejectedRequest,
  shouldFilterSentryRouteParameterizationError,
  shouldFilterTalismanExtensionOnboardingError,
  shouldFilterThirdPartyTelemetryNetworkError,
  shouldFilterThirdPartyTelemetrySpan,
  shouldFilterTwitterConfigReferenceError,
  shouldFilterWalletConnectStaleSessionTopic,
  tagSampledLowValueNetworkError,
  type SentryClientEvent,
  type SentryStackFrame,
  type SentryTransactionSpan,
} from "@/utils/sentry-client-filters";

type TestSentryClientEvent = SentryClientEvent;
type TestSentryClientEventOverrides = Partial<TestSentryClientEvent>;
type TestSentryTransactionSpanOverrides = Partial<SentryTransactionSpan>;

describe("sentry-client-filters", () => {
  const wrappedNetworkMessage =
    "Network request failed. Please check your connection and try again. (/api/waves-overview)";
  const objectCapturedPromiseRejectionMessage =
    "Object captured as promise rejection with keys: code, message, stack";
  const objectCapturedPromiseRejectionWithoutStackMessage =
    "Object captured as promise rejection with keys: code, message";
  const coinbaseMetricsNetworkMessage =
    "Network request failed. Please check your connection and try again. (/metrics)";
  const talismanOnboardingMessage =
    "Talisman extension has not been configured yet. Please continue with onboarding.";
  const disconnectedProviderStack =
    "Error: The provider is disconnected from all chains.\n    at o (chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/background.js:2:7356292)";
  const rabbyMobileUserRejectedStack =
    "Error: Not Allowed\n    at userRejectedRequest (RabbyMobile://native-bundle/background.js:1:1)";
  const rabbyMobileAndroidUserRejectedStack = [
    "EthereumProviderError: Not Allowed",
    "    at getEthProviderError (inpage.js:1:1)",
    "    at userRejectedRequest (inpage.js:1:1)",
  ].join("\n");
  const rabbyMobileUserAgent =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 RabbyMobile/1.0 RabbyMobileIOS/1.0 Mobile/15E148";
  const rabbyMobileAndroidUserAgent =
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 RabbyMobile/0.6.78 RabbyMobileAndroid/0.6.78 Mobile Safari/537.36";
  const rainbowKitNotFoundMessage = "not found rainbowkit";
  const originalNavigatorUserAgent = globalThis.navigator.userAgent;
  const reactDomInsertBeforeMessage =
    __testing.REACT_DOM_INSERT_BEFORE_NOT_FOUND_ERROR_MESSAGE;
  const gifPickerTenorUndefinedTagsMessage =
    __testing.gifPickerTenorUndefinedTagsMessage;
  const reactDomRemoveChildMessage =
    __testing.REACT_DOM_REMOVE_CHILD_NOT_FOUND_ERROR_MESSAGE;
  const reactDomFrame = {
    filename:
      "node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js",
  };
  const gifPickerTenorManagerFrame = {
    filename:
      "node_modules/.pnpm/gif-picker-react@1.5.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/gif-picker-react/src/managers/TenorManager.ts",
    function: "<anonymous>",
  };
  const reactDomStaticChunkFrame = (
    functionName: string
  ): SentryStackFrame => ({
    filename:
      "https://6529.io/_next/static/chunks/app/waves/%5Bwave%5D/page-1234567890abcdef.js",
    function: functionName,
  });
  const reactDomStaticWebpackFrame = (
    functionName: string
  ): SentryStackFrame => ({
    filename:
      "https://6529.io/_next/static/webpack/1234567890abcdef.webpack.js",
    function: functionName,
  });
  const metaMaskCircularMetaElementMessage =
    "Converting circular structure to JSON --> starting at object with constructor 'HTMLMetaElement' | property '__reactFiber$nkfb4ziusym' -> object with constructor 'ry' --- property 'stateNode' closes the circle";
  const metaMaskMobileWebViewUserAgent =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WebView MetaMaskMobile";
  const metaMaskMobileUserAgent =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1 MetaMaskMobile";
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
  const injectedProviderProxyStartsWithMessage =
    "t?.startsWith is not a function";
  const walletConnectStaleSessionTopicMessage =
    "No matching key. session topic doesn't exist: f17f5eaa1c3041fe37871f9eb24f4de53e1b11e494ec3def4b510d09acf42e32";
  const extensionMessagingConnectionFailureMessage =
    "Could not establish connection. Receiving end does not exist.";

  const buildSpan = (
    overrides: TestSentryTransactionSpanOverrides = {}
  ): SentryTransactionSpan => ({
    op: "http.client",
    data: {
      "http.url": "https://region1.google-analytics.com/g/collect",
      "http.response.status_code": 0,
      "url.same_origin": false,
    },
    ...overrides,
  });

  function withRuntimeUserAgent<T>(userAgent: string, callback: () => T): T {
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
  }

  const createTwitterConfigEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
    exception: {
      values: [
        {
          type: "ReferenceError",
          value: "Can't find variable: CONFIG",
          stacktrace: {
            frames: [
              { filename: "app:///", abs_path: "app:///" },
              { filename: "app:///", abs_path: "app:///" },
            ],
          },
        },
      ],
    },
    contexts: {
      browser: {
        name: "Twitter",
      },
    },
    tags: {
      browser: "Twitter 11.62",
      "browser.name": "Twitter",
    },
    ...overrides,
  });

  const createInjectedWalletCollisionEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
    exception: {
      values: [
        {
          type: "TypeError",
          value:
            "'set' on proxy: trap returned falsish for property 'tronlinkParams'",
          stacktrace: {
            frames: [
              {
                filename: "app:///injected/injected.js",
                abs_path: "app:///injected/injected.js",
              },
            ],
          },
        },
      ],
    },
    breadcrumbs: {
      values: [
        {
          category: "console",
          message:
            "[WagmiSetup] Failed to install safe ethereum proxy Error: Cannot set property ethereum of #<Window> which has only a getter",
          data: {
            arguments: [
              "[WagmiSetup] Failed to install safe ethereum proxy Error:",
              "Cannot set property ethereum of #<Window> which has only a getter",
            ],
          },
        },
      ],
    },
    ...overrides,
  });

  const createInjectedKeplrWalletCollisionEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
    transaction: "/waves",
    exception: {
      values: [
        {
          type: "TypeError",
          value:
            "Cannot assign to read only property 'keplr' of object '#<Window>'",
          stacktrace: {
            frames: [
              {
                filename: "app:///inject-runtime.js",
                abs_path: "app:///inject-runtime.js",
              },
            ],
          },
        },
      ],
    },
    ...overrides,
  });

  const createCoinbaseWalletLinkWebSocketEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
    exception: {
      values: [
        {
          type: "Error",
          value: "websocket error 1006:",
          stacktrace: {
            frames: [
              {
                filename:
                  "node_modules/.pnpm/@coinbase+wallet-sdk@3.9.3/node_modules/@coinbase/wallet-sdk/dist/relay/walletlink/connection/WalletLinkWebSocket.js",
                abs_path:
                  "node_modules/.pnpm/@coinbase+wallet-sdk@3.9.3/node_modules/@coinbase/wallet-sdk/dist/relay/walletlink/connection/WalletLinkWebSocket.js",
              },
            ],
          },
        },
      ],
    },
    ...overrides,
  });

  const createAppKitCoinbaseBreadcrumbs = (): NonNullable<
    SentryClientEvent["breadcrumbs"]
  > => ({
    values: [
      {
        category: "console",
        level: "debug",
        message:
          "[AppKitInitialization] Initializing AppKit adapter (web) with",
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
    ],
  });
  const createObservedAppKitBootstrapBreadcrumbs = (): NonNullable<
    SentryClientEvent["breadcrumbs"]
  > => [
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

  const createMetaMaskUpdateUrlCircularEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
    exception: {
      values: [
        {
          type: "TypeError",
          value: metaMaskCircularMetaElementMessage,
          stacktrace: {
            frames: [
              {
                filename: "<anonymous>",
                abs_path: "<anonymous>",
                function: "JSON.stringify",
              },
              {
                filename: "<anonymous>",
                abs_path: "<anonymous>",
                function: "__mm__updateUrl",
              },
            ],
          },
        },
      ],
    },
    ...overrides,
  });

  const createTalismanExtensionOnboardingEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
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
    ...overrides,
  });

  const createInjectedWasmCspUnsafeEvalEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
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
              {
                filename: "app:///inject.js",
                abs_path: "app:///inject.js",
              },
            ],
          },
        },
      ],
    },
    breadcrumbs: {
      values: [
        {
          category: "console",
          message: [
            "failed to asynchronously prepare wasm: CompileError:",
            "WebAssembly.instantiate(): Compiling or instantiating",
            "WebAssembly module violates the following Content Security",
            "policy directive because 'unsafe-eval' is not an allowed source",
            "of script",
          ].join(" "),
        },
      ],
    },
    ...overrides,
  });

  const createObservedInjectedWasmCspUnsafeEvalEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
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
    ...overrides,
  });

  const createObservedAnonymousUnsafeEvalCspEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
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
      transaction: "/",
      url: "/",
    },
    ...overrides,
  });

  const createObservedSentryE7WasmCspUnsafeEvalEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
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
    contexts: {
      browser: {
        name: "Edge",
        version: "125.0.0",
      },
      os: {
        name: "Windows",
      },
    },
    tags: {
      environment: "production",
      transaction: "/the-memes/:id",
      url: "/the-memes/447",
    },
    ...overrides,
  });

  const createInjectedProviderProxyStartsWithEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
    transaction: "/notifications",
    exception: {
      values: [
        {
          type: "TypeError",
          value: injectedProviderProxyStartsWithMessage,
          mechanism: {
            type: "auto.browser.global_handlers.onunhandledrejection",
            handled: false,
          },
          stacktrace: {
            frames: [
              {
                filename: "app:///js/injected/proxy-injected-providers.js",
                abs_path: "app:///js/injected/proxy-injected-providers.js",
                in_app: true,
              },
            ],
          },
        },
      ],
    },
    ...overrides,
  });

  const createBrowserExtensionMessagingConnectionEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
    transaction: "/waves/:wave",
    request: {
      url: "https://6529.io/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
    },
    tags: {
      browser: "Edge 148",
      os: "Windows",
      transaction: "/waves/:wave",
      url: "/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
    },
    exception: {
      values: [
        {
          type: "Error",
          value: extensionMessagingConnectionFailureMessage,
          stacktrace: {
            frames: [
              {
                filename: "app:///injectedScript.bundle.js",
                abs_path: "app:///injectedScript.bundle.js",
                function: "n",
              },
            ],
          },
        },
      ],
    },
    breadcrumbs: [
      {
        type: "http",
        category: "fetch",
        level: "info",
        message: "POST: https://region1.google-analytics.com/g/collect [200]",
        data: {
          url: "https://region1.google-analytics.com/g/collect",
          "url.is_first_party": false,
          "url.is_first_party_api": false,
        },
      },
    ],
    ...overrides,
  });

  const createSentryRouteParameterizationEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
    transaction: "/waves/:wave",
    exception: {
      values: [
        {
          type: "TypeError",
          value: __testing.sentryRouteParameterizationMessage,
          mechanism: {
            type: __testing.sentryRouteParameterizationMechanismType,
            handled: false,
          },
          stacktrace: {
            frames: [
              {
                filename: "[native code]",
                function: "stringify",
                in_app: true,
              },
            ],
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

  const createObservedSentryRouteParameterizationEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent =>
    createSentryRouteParameterizationEvent({
      transaction: "/:user",
      request: {
        url: "https://6529.io/york",
        headers: {
          "User-Agent": metaMaskMobileWebViewUserAgent,
        },
      },
      contexts: {},
      tags: {
        browser: "Mobile Safari UI/WKWebView",
        "browser.name": "Mobile Safari UI/WKWebView",
        url: "/york",
        transaction: "/:user",
      },
      breadcrumbs: [
        {
          category: "navigation",
          data: {
            from: "/the-memes/516",
            to: "/york",
          },
        },
      ],
      exception: {
        values: [
          {
            type: "TypeError",
            value: __testing.sentryRouteParameterizationMessage,
            mechanism: {
              type: __testing.sentryRouteParameterizationMechanismType,
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename: "[native code]",
                  function: "stringify",
                  in_app: true,
                },
                {
                  filename:
                    "node_modules/.pnpm/@sentry+nextjs@10.45.0/node_modules/@sentry/nextjs/src/client/routing/parameterization.ts",
                  function: "n",
                },
              ],
            },
          },
        ],
      },
      ...overrides,
    });

  const createObservedMetaMaskMobileWkWebViewWaveRouteParameterizationEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent =>
    createSentryRouteParameterizationEvent({
      transaction: "/waves/:wave",
      request: {
        url: "https://6529.io/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
        headers: {
          "User-Agent": metaMaskMobileUserAgent,
        },
      },
      contexts: {
        browser: {
          name: "Mobile Safari UI/WKWebView",
        },
      },
      tags: {
        browser: "Mobile Safari UI/WKWebView",
        "browser.name": "Mobile Safari UI/WKWebView",
        url: "/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
        transaction: "/waves/:wave",
      },
      breadcrumbs: [
        {
          category: "navigation",
          data: {
            from: "/anon93",
            to: "/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
          },
        },
      ],
      ...overrides,
    });

  const createObservedIosWkWebViewWaveRouteParameterizationEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent =>
    createSentryRouteParameterizationEvent({
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
      exception: {
        values: [
          {
            type: "TypeError",
            value: __testing.sentryRouteParameterizationMessage,
            mechanism: {
              type: __testing.sentryRouteParameterizationMechanismType,
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename:
                    "node_modules/.pnpm/@sentry+nextjs@10.45.0/node_modules/@sentry/nextjs/src/client/routing/parameterization.ts",
                  function: "n",
                },
                {
                  filename: "[native code]",
                  function: "stringify",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
      ...overrides,
    });

  const createObservedSentryCpNotificationsEvent =
    (): TestSentryClientEvent => ({
      transaction: "/notifications",
      exception: {
        values: [
          {
            type: "TypeError",
            value: __testing.sentryRouteParameterizationMessage,
            mechanism: {
              type: __testing.sentryRouteParameterizationMechanismType,
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename:
                    "node_modules/.pnpm/@sentry+nextjs@10.45.0_@opentelemetry+context-async-hooks@2.7.1_@opentelemetry+api@1.9._9f030f10fd79c9d796c635bb51c5a1cc/node_modules/@sentry/nextjs/src/client/routing/parameterization.ts",
                  function: "n",
                  in_app: true,
                  lineno: 94,
                  colno: 19,
                  context_line: "  routeResultCache.clear();",
                },
                {
                  filename: "[native code]",
                  function: "stringify",
                  in_app: false,
                },
              ],
            },
          },
        ],
      },
      contexts: {
        browser: {
          browser: "Mobile Safari UI/WKWebView",
          name: "Mobile Safari UI/WKWebView",
        },
        device: {
          family: "iPhone",
          model: "iPhone",
          brand: "Apple",
        },
        os: {
          os: "iOS 18.7",
          name: "iOS",
          version: "18.7",
        },
      },
      extra: {
        arguments: [],
      },
      tags: {
        browser: "Mobile Safari UI/WKWebView",
        "browser.name": "Mobile Safari UI/WKWebView",
        device: "iPhone",
        "device.family": "iPhone",
        environment: "production",
        handled: "no",
        interface_type: "exception",
        level: "error",
        mechanism: __testing.sentryRouteParameterizationMechanismType,
        os: "iOS 18.7",
        "os.name": "iOS",
        release: "c7d1ee2cdf4f09d9e5c88dddf342fdbd145ad093",
        transaction: "/notifications",
        turbopack: "True",
        url: "/notifications",
      },
    });

  const createRabbyMobileUserRejectedRequestEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent =>
    ({
      exception: {
        values: [
          {
            type: "UnhandledRejection",
            value: objectCapturedPromiseRejectionMessage,
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
          },
        ],
      },
      extra: {
        __serialized__: {
          code: 4001,
          message: "Not Allowed",
          stack: rabbyMobileUserRejectedStack,
        },
      },
      ...overrides,
    }) as TestSentryClientEvent;

  const createRabbyMobileRainbowKitNotFoundEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent =>
    ({
      event_id: "rabby-mobile-rainbowkit-not-found",
      transaction: "/about/the-memes",
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
                  filename: "[native code]",
                  function: "Promise",
                  in_app: false,
                },
              ],
            },
          },
        ],
      },
      ...overrides,
    }) as TestSentryClientEvent;

  const createThirdPartyTelemetryNetworkErrorEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
    transaction: "/notifications",
    exception: {
      values: [
        {
          type: "TypeError",
          value: coinbaseMetricsNetworkMessage,
          mechanism: {
            type: "generic",
            handled: true,
          },
        },
      ],
    },
    tags: {
      errorType: "network",
      handled: "yes",
      transaction: "/notifications",
      url: "/notifications",
    },
    breadcrumbs: [
      {
        category: "console",
        level: "error",
        message: "TypeError: Load failed",
      },
      {
        type: "http",
        category: "fetch",
        level: "info",
        message: "GET: /notifications [200]",
        data: {
          url: "/notifications",
          "url.is_first_party": true,
          "url.is_first_party_api": false,
        },
      },
    ],
    ...overrides,
  });

  const observedFrameAntNetworkFrames: SentryStackFrame[] = [
    {
      filename: "app:///frame_ant/frame_ant.js",
      abs_path: "app:///frame_ant/frame_ant.js",
      function: "o",
      in_app: true,
    },
    {
      filename: "app:///frame_ant/frame_ant.js",
      abs_path: "app:///frame_ant/frame_ant.js",
      function: "window.fetch",
      in_app: true,
    },
    {
      filename:
        "node_modules/.pnpm/@sentry+core@10.45.0/node_modules/@sentry/core/src/instrument/fetch.ts",
      function: "<anonymous>",
      in_app: false,
    },
    {
      filename:
        "node_modules/.pnpm/aws-rum-web@1.25.0/node_modules/aws-rum-web/dist/es/sessions/VirtualPageLoadTimer.js",
      function: "i.fetch",
      in_app: false,
    },
    {
      filename:
        "node_modules/.pnpm/aws-rum-web@1.25.0/node_modules/aws-rum-web/dist/es/sessions/VirtualPageLoadTimer.js",
      function: "<anonymous>",
      in_app: false,
    },
    {
      filename:
        "node_modules/.pnpm/aws-rum-web@1.25.0/node_modules/aws-rum-web/dist/es/plugins/event-plugins/FetchPlugin.js",
      function: "n.fetch",
      in_app: false,
    },
    {
      filename:
        "node_modules/.pnpm/aws-rum-web@1.25.0/node_modules/aws-rum-web/dist/es/plugins/event-plugins/FetchPlugin.js",
      function: "<anonymous>",
      in_app: false,
    },
    {
      filename: "<anonymous>",
      function: "_t",
      in_app: false,
    },
    {
      filename: "<anonymous>",
      function: "<anonymous>",
      in_app: false,
    },
  ];

  const createObservedFrameAntNetworkException = (
    value: string = coinbaseMetricsNetworkMessage,
    frames: SentryStackFrame[] = observedFrameAntNetworkFrames
  ): NonNullable<TestSentryClientEvent["exception"]> => ({
    values: [
      {
        type: "TypeError",
        value,
        mechanism: {
          type: "auto.browser.global_handlers.onunhandledrejection",
          handled: false,
        },
        stacktrace: {
          frames,
        },
      },
    ],
  });

  const createObservedFrameAntMetricsNetworkErrorEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
    event_id: "frame-ant-metrics-network-error",
    transaction: "/:user",
    exception: createObservedFrameAntNetworkException(),
    tags: {
      environment: "production",
      errorType: "network",
      handled: "no",
      transaction: "/:user",
      url: "/example",
    },
    ...overrides,
  });

  const createWalletConnectStaleSessionTopicEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
    transaction: "/waves",
    exception: {
      values: [
        {
          type: "Error",
          value: walletConnectStaleSessionTopicMessage,
          mechanism: {
            type: "auto.browser.global_handlers.onunhandledrejection",
            handled: false,
          },
          stacktrace: {
            frames: [
              {
                filename: "app:///_next/static/chunks/10s7s3u16zx-f.js",
                abs_path: "app:///_next/static/chunks/10s7s3u16zx-f.js",
                function: "isValidSessionTopic",
                in_app: true,
              },
              {
                filename: "app:///_next/static/chunks/10s7s3u16zx-f.js",
                abs_path: "app:///_next/static/chunks/10s7s3u16zx-f.js",
                function: "onRelayMessage",
                in_app: true,
              },
            ],
          },
        },
      ],
    },
    ...overrides,
  });

  const createLowValueNetworkEvent = (
    overrides: TestSentryClientEventOverrides = {}
  ): TestSentryClientEvent => ({
    event_id: "network-drop-event",
    exception: {
      values: [
        {
          type: "TypeError",
          value: wrappedNetworkMessage,
        },
      ],
    },
    tags: {
      errorType: "network",
      handled: true,
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
    ...overrides,
  });

  const setNavigatorUserAgent = (userAgent: string): void => {
    Object.defineProperty(globalThis.navigator, "userAgent", {
      value: userAgent,
      configurable: true,
    });
  };

  afterEach(() => {
    setNavigatorUserAgent(originalNavigatorUserAgent);
  });

  describe("first-party static frame paths", () => {
    it("keeps the Next static path token stable", () => {
      expect(__testing.nextStaticFramePathToken).toBe("/_next/static/");
    });

    it("classifies hosted and app Next static paths as first-party", () => {
      expect(
        __testing.isFirstPartyFramePath(
          "https://host.example/_next/static/chunk.js"
        )
      ).toBe(true);
      expect(
        __testing.isFirstPartyFramePath("app:///_next/static/chunks/app.js")
      ).toBe(true);
    });

    it("does not classify partial third-party Next static tokens as first-party", () => {
      expect(
        __testing.isFirstPartyFramePath(
          "https://cdn.example/assets_next/static/chunk.js"
        )
      ).toBe(false);
    });
  });

  const createReactDomInsertBeforeEvent = (
    overrides: Partial<SentryClientEvent> = {}
  ): SentryClientEvent => ({
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
      url: "/waves",
    },
    ...overrides,
  });

  const createGifPickerTenorCategoriesEvent = (
    overrides: Partial<SentryClientEvent> = {}
  ): SentryClientEvent => ({
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
        category: "console",
        level: "error",
        message: "TypeError: Load failed (tenor.googleapis.com)",
      },
      {
        type: "http",
        category: "fetch",
        level: "error",
        message: "GET: /v2/categories",
        data: {
          url: "/v2/categories",
          "url.is_first_party": false,
          "url.is_first_party_api": false,
        },
      },
    ],
    ...overrides,
  });

  const createReactDomRemoveChildEvent = (
    overrides: Partial<SentryClientEvent> = {}
  ): SentryClientEvent => ({
    transaction: "/the-memes/mint",
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
      transaction: "/the-memes/mint",
      url: "/the-memes/mint",
    },
    ...overrides,
  });

  it("filters events when a stack frame matches a filename exception", () => {
    // Arrange
    const frames: SentryStackFrame[] = [
      { filename: "app:///extensionServiceWorker.js" },
    ];

    // Act
    const result = shouldFilterByFilenameExceptions(frames);

    // Assert
    expect(result).toBe(true);
  });

  it("filters events when the original exception stack contains a filename exception", () => {
    // Arrange
    const error = new Error(
      "Cannot read properties of undefined (reading 'ton')"
    );
    error.stack = `TypeError: Cannot read properties of undefined (reading 'ton')\n    at requestAccounts (app:///extensionServiceWorker.js:75067:1)`;

    // Act
    const result = shouldFilterByFilenameExceptions(undefined, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(true);
  });

  it("filters events when a stack frame matches extensionPageScript.js", () => {
    // Arrange
    const frames: SentryStackFrame[] = [
      { filename: "app:///extensionPageScript.js" },
    ];

    // Act
    const result = shouldFilterByFilenameExceptions(frames);

    // Assert
    expect(result).toBe(true);
  });

  it("filters events when the original exception stack contains extensionPageScript.js", () => {
    // Arrange
    const error = new Error(
      "Cannot assign to read only property 'solana' of object '#<Window>'"
    );
    error.stack = `TypeError: Cannot assign to read only property 'solana' of object '#<Window>'\n    at foo (app:///extensionPageScript.js:4857:19)`;

    // Act
    const result = shouldFilterByFilenameExceptions(undefined, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(true);
  });

  it("filters events when only abs_path matches a filename exception", () => {
    // Arrange
    const frames: SentryStackFrame[] = [
      {
        filename: "https://example.com/main.js",
        abs_path: "chrome-extension://wallet/extensionServiceWorker.js",
      },
    ];

    // Act
    const result = shouldFilterByFilenameExceptions(frames);

    // Assert
    expect(result).toBe(true);
  });

  it("filters exact React DOM insertBefore NotFoundError events on waves routes with only runtime frames", () => {
    const result = shouldFilterReactDomInsertBeforeNotFoundError(
      createReactDomInsertBeforeEvent({
        tags: {
          transaction: "/waves",
          url: "/waves/633b5f84-3461-461d-b6d1-4d0cc03e7099",
        },
      })
    );

    expect(result).toBe(true);
  });

  it("filters React DOM insertBefore NotFoundError events before Sentry source-map symbolication", () => {
    const result = shouldFilterReactDomInsertBeforeNotFoundError(
      createReactDomInsertBeforeEvent({
        transaction: "/waves/:wave",
        exception: {
          values: [
            {
              type: "NotFoundError",
              value: reactDomInsertBeforeMessage,
              stacktrace: {
                frames: [
                  reactDomStaticChunkFrame("insertOrAppendPlacementNode"),
                  reactDomStaticChunkFrame("commitReconciliationEffects"),
                  reactDomStaticChunkFrame("commitMutationEffectsOnFiber"),
                  reactDomStaticChunkFrame(
                    "recursivelyTraverseMutationEffects"
                  ),
                ],
              },
            },
          ],
        },
        tags: {
          transaction: "/waves/:wave",
          url: "/waves/aadd124b-e5c7-4c40-9644-a24d1ce5384b",
        },
      })
    );

    expect(result).toBe(true);
  });

  it("filters React DOM insertBefore NotFoundError events from webpack static chunks", () => {
    const result = shouldFilterReactDomInsertBeforeNotFoundError(
      createReactDomInsertBeforeEvent({
        exception: {
          values: [
            {
              type: "NotFoundError",
              value: reactDomInsertBeforeMessage,
              stacktrace: {
                frames: [
                  reactDomStaticWebpackFrame("insertOrAppendPlacementNode"),
                ],
              },
            },
          ],
        },
      })
    );

    expect(result).toBe(true);
  });

  it("filters React DOM insertBefore NotFoundError events when request URL identifies a waves route", () => {
    const result = shouldFilterReactDomInsertBeforeNotFoundError(
      createReactDomInsertBeforeEvent({
        transaction: undefined,
        tags: {},
        request: {
          url: "https://6529.io/waves/633b5f84-3461-461d-b6d1-4d0cc03e7099?view=full",
        },
      })
    );

    expect(result).toBe(true);
  });

  it("keeps React DOM insertBefore NotFoundError events when an app frame is present", () => {
    const result = shouldFilterReactDomInsertBeforeNotFoundError(
      createReactDomInsertBeforeEvent({
        exception: {
          values: [
            {
              type: "NotFoundError",
              value: reactDomInsertBeforeMessage,
              stacktrace: {
                frames: [
                  reactDomFrame,
                  {
                    filename:
                      "webpack-internal:///(app-pages-browser)/./components/waves/drops/WaveDrop.tsx",
                  },
                ],
              },
            },
          ],
        },
      })
    );

    expect(result).toBe(false);
  });

  it("keeps pre-symbolicated insertBefore events when a non-React DOM frame is present", () => {
    const result = shouldFilterReactDomInsertBeforeNotFoundError(
      createReactDomInsertBeforeEvent({
        exception: {
          values: [
            {
              type: "NotFoundError",
              value: reactDomInsertBeforeMessage,
              stacktrace: {
                frames: [
                  reactDomStaticChunkFrame("insertOrAppendPlacementNode"),
                  reactDomStaticChunkFrame("WaveDrop"),
                ],
              },
            },
          ],
        },
      })
    );

    expect(result).toBe(false);
  });

  it("keeps React DOM insertBefore NotFoundError events outside waves routes", () => {
    const result = shouldFilterReactDomInsertBeforeNotFoundError(
      createReactDomInsertBeforeEvent({
        transaction: "/about",
        tags: {
          transaction: "/about",
          url: "/about",
        },
      })
    );

    expect(result).toBe(false);
  });

  it("keeps different NotFoundError messages from React DOM runtime frames", () => {
    const result = shouldFilterReactDomInsertBeforeNotFoundError(
      createReactDomInsertBeforeEvent({
        exception: {
          values: [
            {
              type: "NotFoundError",
              value: "The requested node was not found.",
              stacktrace: {
                frames: [reactDomFrame],
              },
            },
          ],
        },
      })
    );

    expect(result).toBe(false);
  });

  it("filters exact React DOM removeChild NotFoundError events on The Memes mint route with only runtime frames", () => {
    const result = shouldFilterReactDomRemoveChildNotFoundError(
      createReactDomRemoveChildEvent({
        tags: {
          transaction: "/the-memes/mint",
          url: "/the-memes/mint",
        },
      })
    );

    expect(result).toBe(true);
  });

  it("filters React DOM removeChild NotFoundError events when request URL identifies a waves route", () => {
    const result = shouldFilterReactDomRemoveChildNotFoundError(
      createReactDomRemoveChildEvent({
        transaction: undefined,
        tags: {},
        request: {
          url: "https://6529.io/waves/633b5f84-3461-461d-b6d1-4d0cc03e7099?view=full",
        },
      })
    );

    expect(result).toBe(true);
  });

  it("keeps React DOM removeChild NotFoundError events when an app frame is present", () => {
    const result = shouldFilterReactDomRemoveChildNotFoundError(
      createReactDomRemoveChildEvent({
        exception: {
          values: [
            {
              type: "NotFoundError",
              value: reactDomRemoveChildMessage,
              stacktrace: {
                frames: [
                  reactDomFrame,
                  {
                    filename:
                      "webpack-internal:///(app-pages-browser)/./components/the-memes/TheMemesMint.tsx",
                  },
                ],
              },
            },
          ],
        },
      })
    );

    expect(result).toBe(false);
  });

  it("keeps React DOM removeChild NotFoundError events outside affected routes", () => {
    const result = shouldFilterReactDomRemoveChildNotFoundError(
      createReactDomRemoveChildEvent({
        transaction: "/the-memes",
        tags: {
          transaction: "/the-memes",
          url: "/the-memes",
        },
      })
    );

    expect(result).toBe(false);
  });

  it("keeps different removeChild NotFoundError messages from React DOM runtime frames", () => {
    const result = shouldFilterReactDomRemoveChildNotFoundError(
      createReactDomRemoveChildEvent({
        exception: {
          values: [
            {
              type: "NotFoundError",
              value: "The requested node was not found.",
              stacktrace: {
                frames: [reactDomFrame],
              },
            },
          ],
        },
      })
    );

    expect(result).toBe(false);
  });

  it("filters gif-picker Tenor category errors on waves routes with no app-owned frames", () => {
    const result = shouldFilterGifPickerTenorCategoriesError(
      createGifPickerTenorCategoriesEvent()
    );

    expect(result).toBe(true);
  });

  it("filters gif-picker Tenor category errors from the breadcrumb signature when source frames are unavailable", () => {
    const event = createGifPickerTenorCategoriesEvent({
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
              frames: [],
            },
          },
        ],
      },
    });

    const result = shouldFilterGifPickerTenorCategoriesError(event);

    expect(result).toBe(true);
  });

  it("keeps gif-picker Tenor category errors when an app-owned frame is present", () => {
    const event = createGifPickerTenorCategoriesEvent({
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
              frames: [
                gifPickerTenorManagerFrame,
                {
                  filename: "https://6529.io/_next/static/chunks/app-client.js",
                  function: "loadGifCategories",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    const result = shouldFilterGifPickerTenorCategoriesError(event);

    expect(result).toBe(false);
  });

  it("keeps matching undefined tags errors without gif-picker or Tenor evidence", () => {
    const event = createGifPickerTenorCategoriesEvent({
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
              frames: [],
            },
          },
        ],
      },
      breadcrumbs: [],
    });

    const result = shouldFilterGifPickerTenorCategoriesError(event);

    expect(result).toBe(false);
  });

  it("keeps gif-picker Tenor category errors outside waves routes", () => {
    const result = shouldFilterGifPickerTenorCategoriesError(
      createGifPickerTenorCategoriesEvent({
        transaction: "/about",
        tags: {
          transaction: "/about",
          url: "/about",
        },
        request: {
          url: "https://6529.io/about",
        },
      })
    );

    expect(result).toBe(false);
  });

  it("does not filter when frames do not match any filename exception", () => {
    // Arrange
    const frames: SentryStackFrame[] = [{ filename: "app:///main.js" }];

    // Act
    const result = shouldFilterByFilenameExceptions(frames);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter when the original exception stack does not match any filename exception", () => {
    // Arrange
    const error = new Error("Some other error");
    error.stack = `Error: Some other error\n    at foo (app:///main.js:1:1)`;

    // Act
    const result = shouldFilterByFilenameExceptions(undefined, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(false);
  });

  it("includes extensionServiceWorker.js in filename exceptions", () => {
    // Arrange
    const expected = "extensionServiceWorker.js";

    // Act
    const result = __testing.filenameExceptions;

    // Assert
    expect(result).toContain(expected);
  });

  it("includes extensionPageScript.js in filename exceptions", () => {
    // Arrange
    const expected = "extensionPageScript.js";

    // Act
    const result = __testing.filenameExceptions;

    // Assert
    expect(result).toContain(expected);
  });

  it("filters failed Google Analytics collect spans with exact target matching", () => {
    const result = shouldFilterThirdPartyTelemetrySpan(buildSpan());

    expect(result).toBe(true);
  });

  it("filters failed Coinbase metrics spans with exact target matching", () => {
    const result = shouldFilterThirdPartyTelemetrySpan(
      buildSpan({
        data: {
          "http.url": "https://cca-lite.coinbase.com/metrics",
          "http.response.status_code": 0,
          "url.same_origin": false,
        },
      })
    );

    expect(result).toBe(true);
  });

  it("filters failed Coinbase amp beacons with zero transfer size", () => {
    const result = shouldFilterThirdPartyTelemetrySpan({
      op: "resource.beacon",
      description: "https://cca-lite.coinbase.com/amp",
      data: {
        "http.response.status_code": 0,
        "http.response_transfer_size": 0,
        "url.same_origin": false,
      },
    });

    expect(result).toBe(true);
  });

  it("filters Coinbase metrics network error events without app frames", () => {
    const result = shouldFilterThirdPartyTelemetryNetworkError(
      createThirdPartyTelemetryNetworkErrorEvent()
    );

    expect(result).toBe(true);
  });

  it("filters the observed frame_ant metrics network error", () => {
    const result = shouldFilterThirdPartyTelemetryNetworkError(
      createObservedFrameAntMetricsNetworkErrorEvent()
    );

    expect(result).toBe(true);
  });

  it("preserves frame_ant network errors for other targets", () => {
    const result = shouldFilterThirdPartyTelemetryNetworkError(
      createObservedFrameAntMetricsNetworkErrorEvent({
        exception: createObservedFrameAntNetworkException(
          "Network request failed. Please check your connection and try again. (/messages)"
        ),
      })
    );

    expect(result).toBe(false);
  });

  it("preserves non-network metrics messages from frame_ant", () => {
    const result = shouldFilterThirdPartyTelemetryNetworkError(
      createObservedFrameAntMetricsNetworkErrorEvent({
        exception: createObservedFrameAntNetworkException(
          "Telemetry request rejected. (/metrics)"
        ),
      })
    );

    expect(result).toBe(false);
  });

  it("does not filter first-party spans", () => {
    const result = shouldFilterThirdPartyTelemetrySpan(
      buildSpan({
        data: {
          "http.url":
            "https://api.6529.io/api/waves/b6128077-ea78-4dd9-b381-52c4eadb2077",
          "http.response.status_code": 0,
          "url.same_origin": false,
        },
      })
    );

    expect(result).toBe(false);
  });

  it("does not filter Coinbase metrics network errors with app-owned frames", () => {
    const result = shouldFilterThirdPartyTelemetryNetworkError(
      createThirdPartyTelemetryNetworkErrorEvent({
        exception: {
          values: [
            {
              type: "TypeError",
              value: coinbaseMetricsNetworkMessage,
              mechanism: {
                type: "generic",
                handled: true,
              },
              stacktrace: {
                frames: [
                  {
                    filename: "services/api/common-api.ts",
                    abs_path: "services/api/common-api.ts",
                    in_app: true,
                  },
                ],
              },
            },
          ],
        },
      })
    );

    expect(result).toBe(false);
  });

  it("preserves the observed frame_ant metrics error with an app-owned frame", () => {
    const result = shouldFilterThirdPartyTelemetryNetworkError(
      createObservedFrameAntMetricsNetworkErrorEvent({
        exception: createObservedFrameAntNetworkException(
          coinbaseMetricsNetworkMessage,
          [
            ...observedFrameAntNetworkFrames,
            {
              filename: "services/api/common-api.ts",
              abs_path: "services/api/common-api.ts",
              function: "fetchUrl",
              in_app: true,
            },
          ]
        ),
      })
    );

    expect(result).toBe(false);
  });

  it("preserves the same metrics message for a matching first-party failure", () => {
    const result = shouldFilterThirdPartyTelemetryNetworkError(
      createObservedFrameAntMetricsNetworkErrorEvent({
        breadcrumbs: [
          {
            type: "http",
            category: "fetch",
            level: "error",
            data: {
              url: "https://api.6529.io/metrics",
              status_code: 0,
              "url.is_first_party": true,
              "url.is_first_party_api": true,
            },
          },
        ],
      })
    );

    expect(result).toBe(false);
  });

  it("does not filter first-party network error targets as telemetry", () => {
    const result = shouldFilterThirdPartyTelemetryNetworkError(
      createThirdPartyTelemetryNetworkErrorEvent({
        exception: {
          values: [
            {
              type: "TypeError",
              value:
                "Network request failed. Please check your connection and try again. (/api/metrics)",
              mechanism: {
                type: "generic",
                handled: true,
              },
            },
          ],
        },
      })
    );

    expect(result).toBe(false);
  });

  it("does not filter allowlisted third-party targets when the request succeeded", () => {
    const result = shouldFilterThirdPartyTelemetrySpan(
      buildSpan({
        data: {
          "http.url": "https://region1.google-analytics.com/g/collect",
          "http.response.status_code": 200,
          "url.same_origin": false,
        },
      })
    );

    expect(result).toBe(false);
  });

  it("does not filter broader third-party domains outside the exact allowlist", () => {
    const result = shouldFilterThirdPartyTelemetrySpan(
      buildSpan({
        data: {
          "http.url": "https://api-js.mixpanel.com/track/",
          "http.response.status_code": 0,
          "url.same_origin": false,
        },
      })
    );

    expect(result).toBe(false);
  });

  it("drops sampled-out first-party status 0 network errors", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent(),
      0
    );

    expect(result).toBe("drop");
  });

  it("drops sampled-out status 0 network errors from API environment subdomains", () => {
    const event = createLowValueNetworkEvent({
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
            url: "https://api.staging.6529.io/alchemy-proxy",
          },
        },
      ],
    });

    expect(getLowValueNetworkErrorTargetUrl(event)).toBe(
      "https://api.staging.6529.io/alchemy-proxy"
    );
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("drop");
  });

  it("drops sampled-out sanitized API subdomain network errors using preserved metadata", () => {
    const targetUrl = "https://api.staging.6529.io/alchemy-proxy";
    const event = createLowValueNetworkEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: `Network request failed. Please check your connection and try again. (${targetUrl})`,
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/alchemy-proxy",
            "url.is_first_party": true,
            "url.is_first_party_api": true,
          },
        },
      ],
    });

    expect(getLowValueNetworkErrorTargetUrl(event)).toBe(targetUrl);
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("drop");
  });

  it("drops sampled-out WebKit network connection lost errors", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        exception: {
          values: [
            {
              type: "TypeError",
              value: "The network connection was lost.",
            },
          ],
        },
      }),
      0
    );

    expect(result).toBe("drop");
  });

  it("drops sampled-out first-party status 0 network errors when a later request succeeds", () => {
    const event = createLowValueNetworkEvent({
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
    });

    expect(getNetworkErrorMessageTargetUrl(event)).toBe("/api/waves-overview");
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("drop");
  });

  it("ignores plain parenthesized context when matching low-value network errors", () => {
    const event = createLowValueNetworkEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Failed to fetch (while loading wave overview)",
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
    });

    expect(getLowValueNetworkErrorTargetUrl(event)).toBe("/api/waves-overview");
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("drop");
  });

  it("uses a real failed HTTP breadcrumb before a later successful breadcrumb for message targets", () => {
    const event = createLowValueNetworkEvent({
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
    });

    expect(getNetworkErrorMessageTargetUrl(event)).toBe("/api/waves-overview");
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("not_applicable");
  });

  it("uses a first-party status 0 page breadcrumb before a later HTTP failure for raw message targets", () => {
    const event = createLowValueNetworkEvent({
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
            url: "/waves",
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
    });

    expect(getLowValueNetworkErrorTargetUrl(event)).toBeNull();
    expect(getNetworkErrorMessageTargetUrl(event)).toBe("/waves");
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("not_applicable");
  });

  it("uses a third-party status 0 breadcrumb before a later HTTP failure for raw message targets", () => {
    const event = createLowValueNetworkEvent({
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
            url: "https://example.com/collect",
            "url.is_first_party": false,
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
    });

    expect(getLowValueNetworkErrorTargetUrl(event)).toBeNull();
    expect(getNetworkErrorMessageTargetUrl(event)).toBe(
      "https://example.com/collect"
    );
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("not_applicable");
  });

  it("does not use successful breadcrumbs for network error message targets", () => {
    const event = createLowValueNetworkEvent({
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
    });

    expect(getNetworkErrorMessageTargetUrl(event)).toBeNull();
  });

  it("drops sampled-out message-target status 0 errors when a later status 0 targets a different first-party API", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        exception: {
          values: [
            {
              type: "TypeError",
              value:
                "Network request failed. Please check your connection and try again. (/api/a)",
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
      }),
      0
    );

    expect(result).toBe("drop");
  });

  it("drops sampled-out message-target status 0 errors when a later status 0 targets a third-party URL", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        exception: {
          values: [
            {
              type: "TypeError",
              value:
                "Network request failed. Please check your connection and try again. (/api/a)",
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
              url: "https://example.com/collect",
              "url.is_first_party": false,
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("drop");
  });

  it("drops raw first-party status 0 network errors when a later third-party status 0 fails", () => {
    const event = createLowValueNetworkEvent({
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
    });

    expect(getLowValueNetworkErrorTargetUrl(event)).toBe("/api/waves-overview");
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("drop");
  });

  it("keeps raw network errors when only a third-party status 0 fails", () => {
    const event = createLowValueNetworkEvent({
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
            url: "https://example.com/collect",
            "url.is_first_party": false,
          },
        },
      ],
    });

    expect(getLowValueNetworkErrorTargetUrl(event)).toBeNull();
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("not_applicable");
  });

  it("keeps message-target network errors when only a different API has status 0", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        exception: {
          values: [
            {
              type: "TypeError",
              value:
                "Network request failed. Please check your connection and try again. (/api/a)",
            },
          ],
        },
        breadcrumbs: [
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
      }),
      0
    );

    expect(result).toBe("not_applicable");
  });

  it("drops sampled-out first-party status 0 network errors when a later unrelated first-party request fails", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
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
      }),
      0
    );

    expect(result).toBe("drop");
  });

  it("drops sampled-out first-party status 0 network errors when later unrelated third-party requests fail", () => {
    for (const statusCode of [404, 500]) {
      const result = getLowValueNetworkErrorDecision(
        createLowValueNetworkEvent({
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
                status_code: statusCode,
                url: "https://example.com/collect",
                "url.is_first_party": false,
              },
            },
          ],
        }),
        0
      );

      expect(result).toBe("drop");
    }
  });

  it("keeps first-party network errors when a later request has a real HTTP failure", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
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
      }),
      0
    );

    expect(result).toBe("not_applicable");
  });

  it("keeps first-party network errors when a later real HTTP failure has no URL", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
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
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("not_applicable");
  });

  it("keeps first-party network errors when a later real HTTP failure has a filtered URL", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
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
              url: "[Filtered]",
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("not_applicable");
  });

  it("drops sampled-out first-party status 0 network errors when later unknown HTTP failures are marked third-party", () => {
    for (const laterFailureData of [
      {
        status_code: 500,
        "url.is_first_party": false,
      },
      {
        status_code: 500,
        url: "[Filtered]",
        "url.is_first_party": false,
      },
    ]) {
      const result = getLowValueNetworkErrorDecision(
        createLowValueNetworkEvent({
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
              data: laterFailureData,
            },
          ],
        }),
        0
      );

      expect(result).toBe("drop");
    }
  });

  it("keeps raw first-party network errors when a later same-target request has a real HTTP failure", () => {
    const event = createLowValueNetworkEvent({
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
    });

    expect(getLowValueNetworkErrorTargetUrl(event)).toBeNull();
    expect(getNetworkErrorMessageTargetUrl(event)).toBe("/api/waves-overview");
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("not_applicable");
  });

  it("keeps third-party API paths after URL sanitization", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        exception: {
          values: [
            {
              type: "TypeError",
              value:
                "Network request failed. Please check your connection and try again. (/api/third-party)",
            },
          ],
        },
        breadcrumbs: [
          {
            type: "http",
            category: "fetch",
            data: {
              status_code: 0,
              url: "/api/third-party",
              "url.is_first_party": false,
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("not_applicable");
  });

  it("drops sampled-out relative API network errors when the breadcrumb URL is filtered", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        breadcrumbs: [
          {
            type: "http",
            category: "fetch",
            data: {
              status_code: 0,
              url: "[Filtered]",
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("drop");
  });

  it("drops sampled-out relative API network errors when the filtered breadcrumb URL was sanitized", () => {
    for (const url of ["/[Filtered]", "/%5BFiltered%5D"]) {
      const result = getLowValueNetworkErrorDecision(
        createLowValueNetworkEvent({
          breadcrumbs: [
            {
              type: "http",
              category: "fetch",
              data: {
                status_code: 0,
                url,
              },
            },
          ],
        }),
        0
      );

      expect(result).toBe("drop");
    }
  });

  it("uses message targets when metadata-free failed breadcrumb URLs are unknown placeholders", () => {
    for (const url of ["unknown", "/unknown"]) {
      const event = createLowValueNetworkEvent({
        breadcrumbs: [
          {
            type: "http",
            category: "fetch",
            data: {
              status_code: 0,
              url,
            },
          },
        ],
      });

      expect(getLowValueNetworkErrorTargetUrl(event)).toBe(
        "/api/waves-overview"
      );
      expect(getLowValueNetworkErrorDecision(event, 0)).toBe("drop");
    }
  });

  it("uses older API transport failures when later /unknown HTTP failures have first-party metadata", () => {
    const event = createLowValueNetworkEvent({
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
            url: "/unknown",
            "url.is_first_party": true,
          },
        },
      ],
    });

    expect(getLowValueNetworkErrorTargetUrl(event)).toBe("/api/waves-overview");
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("drop");
  });

  it("drops sampled-out relative API network errors when the breadcrumb URL is missing", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        breadcrumbs: [
          {
            type: "http",
            category: "fetch",
            data: {
              status_code: 0,
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("drop");
  });

  it("keeps events with filtered breadcrumb URLs marked third-party", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        breadcrumbs: [
          {
            type: "http",
            category: "fetch",
            data: {
              status_code: 0,
              url: "[Filtered]",
              "url.is_first_party": false,
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("not_applicable");
  });

  it("keeps events with missing breadcrumb URLs marked third-party", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        breadcrumbs: [
          {
            type: "http",
            category: "fetch",
            data: {
              status_code: 0,
              "url.is_first_party": false,
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("not_applicable");
  });

  it("drops first-party relative API paths when sampled out", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        exception: {
          values: [
            {
              type: "TypeError",
              value:
                "Network request failed. Please check your connection and try again. (/api/first-party)",
            },
          ],
        },
        breadcrumbs: [
          {
            type: "http",
            category: "fetch",
            data: {
              status_code: 0,
              url: "/api/first-party",
              "url.is_first_party": true,
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("drop");
  });

  it("keeps sampled-in first-party status 0 network errors", () => {
    const event = createLowValueNetworkEvent();
    const result = getLowValueNetworkErrorDecision(event, 1);

    expect(result).toBe("keep_sampled");

    tagSampledLowValueNetworkError(event);

    expect(event.tags).toEqual(
      expect.objectContaining({
        network_failure_kind: "browser_transport",
        network_noise_sampled: "true",
      })
    );
  });

  it("keeps network errors when the browser received a real HTTP status", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
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
      }),
      0
    );

    expect(result).toBe("not_applicable");
  });

  it("keeps TypeErrors that are not tagged as network errors", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        tags: {},
      }),
      0
    );

    expect(result).toBe("not_applicable");
  });

  it("samples tagged plain Error network events the same way as tagged TypeError events", () => {
    const event = createLowValueNetworkEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: wrappedNetworkMessage,
          },
        ],
      },
    });

    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("drop");
    expect(getLowValueNetworkErrorDecision(event, 1)).toBe("keep_sampled");
  });

  it("keeps network errors when no failed status is known", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        breadcrumbs: [
          {
            type: "http",
            category: "fetch",
            level: "info",
            data: {
              url: "/api/waves-overview",
              "url.is_first_party": true,
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("not_applicable");
  });

  it("drops Sentry fetch error breadcrumbs without a status", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        breadcrumbs: [
          {
            category: "fetch",
            level: "error",
            data: {
              url: "/api/waves-overview",
              "url.is_first_party": true,
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("drop");
  });

  it("uses an HTTP error breadcrumb without a status before a later success", () => {
    const event = createLowValueNetworkEvent({
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
    });

    expect(getNetworkErrorMessageTargetUrl(event)).toBe("/api/waves-overview");
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("drop");
  });

  it("handles Sentry breadcrumb values form for first-party status 0 errors", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        breadcrumbs: {
          values: [
            {
              type: "http",
              category: "xhr",
              data: {
                status_code: 0,
                url: "/api/waves-overview",
                "url.is_first_party": true,
              },
            },
          ],
        },
      }),
      0
    );

    expect(result).toBe("drop");
  });

  it("treats api.6529.io as a first-party API target", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        exception: {
          values: [
            {
              type: "TypeError",
              value:
                "Network request failed. Please check your connection and try again. (https://api.6529.io/waves-overview)",
            },
          ],
        },
        breadcrumbs: [
          {
            type: "http",
            category: "fetch",
            data: {
              status_code: 0,
              url: "https://api.6529.io/waves-overview",
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("drop");
  });

  it("matches api.6529.io errors to sanitized breadcrumb paths", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        exception: {
          values: [
            {
              type: "TypeError",
              value:
                "Network request failed. Please check your connection and try again. (https://api.6529.io/waves-overview)",
            },
          ],
        },
        breadcrumbs: [
          {
            type: "http",
            category: "fetch",
            data: {
              status_code: 0,
              url: "/waves-overview",
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("drop");
  });

  it("does not match api.6529.io errors to sanitized breadcrumbs explicitly marked non-API", () => {
    const event = createLowValueNetworkEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "Network request failed. Please check your connection and try again. (https://api.6529.io/alchemy-proxy)",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/alchemy-proxy",
            "url.is_first_party": true,
            "url.is_first_party_api": false,
          },
        },
      ],
    });

    expect(getLowValueNetworkErrorTargetUrl(event)).toBeNull();
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("not_applicable");
  });

  it("drops api.6529.io paths after sanitization when the breadcrumb keeps API metadata", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        exception: {
          values: [
            {
              type: "TypeError",
              value:
                "Network request failed. Please check your connection and try again. (/oracle/prenodes)",
            },
          ],
        },
        breadcrumbs: [
          {
            type: "http",
            category: "fetch",
            data: {
              status_code: 0,
              url: "/oracle/prenodes",
              "url.is_first_party": true,
              "url.is_first_party_api": true,
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("drop");
  });

  it("keeps same-looking page paths when sanitized API metadata is missing", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        exception: {
          values: [
            {
              type: "TypeError",
              value:
                "Network request failed. Please check your connection and try again. (/oracle/prenodes)",
            },
          ],
        },
        breadcrumbs: [
          {
            type: "http",
            category: "fetch",
            data: {
              status_code: 0,
              url: "/oracle/prenodes",
              "url.is_first_party": true,
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("not_applicable");
  });

  it("drops /unknown when sanitized API metadata marks it as first-party API", () => {
    const event = createLowValueNetworkEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "Network request failed. Please check your connection and try again. (/unknown)",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/unknown",
            "url.is_first_party": true,
            "url.is_first_party_api": true,
          },
        },
      ],
    });

    expect(getLowValueNetworkErrorTargetUrl(event)).toBe("/unknown");
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("drop");
  });

  it("keeps /unknown page failures when sanitized API metadata is missing", () => {
    const event = createLowValueNetworkEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "Network request failed. Please check your connection and try again. (/unknown)",
          },
        ],
      },
      breadcrumbs: [
        {
          type: "http",
          category: "fetch",
          data: {
            status_code: 0,
            url: "/unknown",
            "url.is_first_party": true,
          },
        },
      ],
    });

    expect(getLowValueNetworkErrorTargetUrl(event)).toBeNull();
    expect(getNetworkErrorMessageTargetUrl(event)).toBe("/unknown");
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("not_applicable");
  });

  it("keeps first-party page navigation failures", () => {
    const result = getLowValueNetworkErrorDecision(
      createLowValueNetworkEvent({
        exception: {
          values: [
            {
              type: "TypeError",
              value:
                "Network request failed. Please check your connection and try again. (/notifications)",
            },
          ],
        },
        breadcrumbs: [
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
      }),
      0
    );

    expect(result).toBe("not_applicable");
  });

  it("keeps newer first-party page failures ahead of older API transport failures", () => {
    const event = createLowValueNetworkEvent({
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
    });

    expect(getLowValueNetworkErrorTargetUrl(event)).toBeNull();
    expect(getNetworkErrorMessageTargetUrl(event)).toBe("/notifications");
    expect(getLowValueNetworkErrorDecision(event, 0)).toBe("not_applicable");
  });

  it("filters Twitter CONFIG reference errors with app URI frames", () => {
    // Arrange
    const event = createTwitterConfigEvent();

    // Act
    const result = shouldFilterTwitterConfigReferenceError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter CONFIG reference errors outside Twitter", () => {
    // Arrange
    const event = createTwitterConfigEvent({
      contexts: { browser: { name: "Safari" } },
      tags: {
        browser: "Safari Mobile",
        "browser.name": "Safari",
      },
    });

    // Act
    const result = shouldFilterTwitterConfigReferenceError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("filters CONFIG reference errors when Twitter is present only in tags", () => {
    // Arrange
    const event = createTwitterConfigEvent({
      contexts: {},
    });

    // Act
    const result = shouldFilterTwitterConfigReferenceError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters Sentry route parameterization cyclic JSON errors", () => {
    // Arrange
    const event = createSentryRouteParameterizationEvent();

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters observed MetaMaskMobile WKWebView wave route parameterization cyclic JSON errors", () => {
    // Arrange
    const event =
      createObservedMetaMaskMobileWkWebViewWaveRouteParameterizationEvent();

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters observed iOS WKWebView wave route parameterization cyclic JSON errors without app context", () => {
    // Arrange
    const event = createObservedIosWkWebViewWaveRouteParameterizationEvent();

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters the observed Sentry CP notifications event when the SDK frame is marked in-app", () => {
    // Arrange
    const event = createObservedSentryCpNotificationsEvent();

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters Sentry route parameterization errors with the Sentry parameterization frame outside route bounds", () => {
    // Arrange
    const event = createObservedSentryRouteParameterizationEvent();

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters MetaMaskMobile WebView route parameterization errors on the memes mint route", () => {
    // Arrange
    const event = createSentryRouteParameterizationEvent({
      transaction: "/the-memes/mint",
      request: {
        url: "https://6529.io/the-memes/mint",
        headers: {
          "User-Agent": metaMaskMobileWebViewUserAgent,
        },
      },
      contexts: {},
      tags: {},
      breadcrumbs: [],
    });

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("uses the runtime user agent for MetaMaskMobile WebView route parameterization errors", () => {
    // Arrange
    const event = createSentryRouteParameterizationEvent({
      transaction: "/the-memes/mint",
      request: {
        url: "https://6529.io/the-memes/mint",
      },
      contexts: {},
      tags: {},
      breadcrumbs: [],
    });

    // Act
    const result = withRuntimeUserAgent(metaMaskMobileWebViewUserAgent, () =>
      shouldFilterSentryRouteParameterizationError(event)
    );

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter cyclic JSON errors with app-owned frames", () => {
    // Arrange
    const event = createSentryRouteParameterizationEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: __testing.sentryRouteParameterizationMessage,
            mechanism: {
              type: __testing.sentryRouteParameterizationMechanismType,
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename: "[native code]",
                  function: "stringify",
                  in_app: true,
                },
                {
                  filename: "https://6529.io/_next/static/chunks/app-client.js",
                  function: "serializeWaveParams",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter cyclic JSON errors with app-owned source frames", () => {
    // Arrange
    const event = createSentryRouteParameterizationEvent({
      transaction: "/the-memes/mint",
      request: {
        url: "https://6529.io/the-memes/mint",
        headers: {
          "User-Agent": metaMaskMobileWebViewUserAgent,
        },
      },
      contexts: {},
      tags: {},
      breadcrumbs: [],
      exception: {
        values: [
          {
            type: "TypeError",
            value: __testing.sentryRouteParameterizationMessage,
            mechanism: {
              type: __testing.sentryRouteParameterizationMechanismType,
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename: "[native code]",
                  function: "stringify",
                  in_app: true,
                },
                {
                  filename:
                    "https://6529.io/_next/static/chunks/app/the-memes/mint/page-1234567890abcdef.js",
                  function: "submitMint",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter Sentry parameterization errors when an app-owned frame is present", () => {
    // Arrange
    const event = createObservedSentryRouteParameterizationEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: __testing.sentryRouteParameterizationMessage,
            mechanism: {
              type: __testing.sentryRouteParameterizationMechanismType,
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename: "[native code]",
                  function: "stringify",
                  in_app: true,
                },
                {
                  filename:
                    "node_modules/.pnpm/@sentry+nextjs@10.45.0/node_modules/@sentry/nextjs/src/client/routing/parameterization.ts",
                  function: "n",
                },
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./utils/routeParams.ts",
                  function: "serializeRouteParams",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter cyclic JSON errors without the Sentry browser API mechanism", () => {
    // Arrange
    const event = createSentryRouteParameterizationEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: __testing.sentryRouteParameterizationMessage,
            mechanism: {
              type: "auto.browser.browserapierrors.requestAnimationFrame",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename: "[native code]",
                  function: "stringify",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("filters cyclic JSON errors without navigation breadcrumbs when MetaMaskMobile WebView context is present", () => {
    // Arrange
    const event = createSentryRouteParameterizationEvent({
      breadcrumbs: [],
    });

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter cyclic JSON route parameterization errors without MetaMaskMobile WKWebView context", () => {
    // Arrange
    const event = createSentryRouteParameterizationEvent({
      contexts: {
        browser: {
          name: "Mobile Safari",
        },
      },
      tags: {
        browser: "Mobile Safari",
        "browser.name": "Mobile Safari",
      },
    });

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter MetaMaskMobile route parameterization errors without WKWebView evidence", () => {
    // Arrange
    const event = createSentryRouteParameterizationEvent({
      request: {
        url: "https://6529.io/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
        headers: {
          "User-Agent": metaMaskMobileUserAgent,
        },
      },
      contexts: {},
      tags: {},
      breadcrumbs: [],
    });

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("filters WKWebView route parameterization errors without MetaMaskMobile evidence", () => {
    // Arrange
    const event =
      createObservedMetaMaskMobileWkWebViewWaveRouteParameterizationEvent({
        request: {
          url: "https://6529.io/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1",
          },
        },
      });

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter MetaMaskMobile route parameterization errors without route evidence", () => {
    // Arrange
    const event = createSentryRouteParameterizationEvent({
      transaction: undefined,
      request: {
        headers: {
          "User-Agent": metaMaskMobileWebViewUserAgent,
        },
      },
      contexts: {},
      tags: {},
      breadcrumbs: [],
    });

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter MetaMaskMobile route parameterization errors outside known route bounds", () => {
    // Arrange
    const event = createSentryRouteParameterizationEvent({
      transaction: "/about",
      request: {
        url: "https://6529.io/about",
      },
      breadcrumbs: [
        {
          category: "navigation",
          data: {
            from: "/about",
            to: "/about",
          },
        },
      ],
    });

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("filters MetaMaskMobile route parameterization errors when waves route appears only in navigation breadcrumbs", () => {
    // Arrange
    const event = createSentryRouteParameterizationEvent({
      transaction: undefined,
      request: undefined,
      tags: {
        browser: "Mobile Safari UI/WKWebView",
        "browser.name": "Mobile Safari UI/WKWebView",
      },
    });

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters injected wallet collisions for tronlinkParams in app URI stacks", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent();

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters injected wallet collisions from breadcrumb-only ethereum getter errors", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Some wrapper error",
            stacktrace: {
              frames: [
                {
                  filename: "app:///injected/injected.js",
                  abs_path: "app:///injected/injected.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters injected wallet collisions when breadcrumbs are in Sentry array form", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Some wrapper error",
            stacktrace: {
              frames: [
                {
                  filename: "app:///injected/injected.js",
                  abs_path: "app:///injected/injected.js",
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
            "Cannot set property ethereum of #<Window> which has only a getter",
        },
      ],
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters injected wallet collisions from the original exception stack", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Some wrapper error",
          },
        ],
      },
      breadcrumbs: {
        values: [],
      },
    });
    const error = new Error(
      "Cannot set property ethereum of #<Window> which has only a getter"
    );
    error.stack = `TypeError: Cannot set property ethereum of #<Window> which has only a getter\n    at injected (app:///injected/injected.js:1:1)`;

    // Act
    const result = shouldFilterInjectedWalletCollision(event, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(true);
  });

  it("filters injected keplr read-only collisions from inject-runtime stacks", () => {
    // Arrange
    const event = createInjectedKeplrWalletCollisionEvent();

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters Coinbase WalletLink websocket 1006 close errors", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent();

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters Coinbase WalletLink websocket 1006 close errors without a detail suffix", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006",
            stacktrace: {
              frames: [
                {
                  filename:
                    "node_modules/.pnpm/@coinbase+wallet-sdk@3.9.3/node_modules/@coinbase/wallet-sdk/dist/relay/walletlink/connection/WalletLinkWebSocket.js",
                  abs_path:
                    "node_modules/.pnpm/@coinbase+wallet-sdk@3.9.3/node_modules/@coinbase/wallet-sdk/dist/relay/walletlink/connection/WalletLinkWebSocket.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters production Coinbase WalletLink websocket 1006 frames marked in_app by Sentry", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters Coinbase WalletLink websocket 1006 close errors from pnpm virtual-store paths", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
            stacktrace: {
              frames: [
                {
                  filename:
                    "node_modules/.pnpm/@coinbase+wallet-sdk@3.9.3/dist/relay/walletlink/connection/WalletLinkWebSocket.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters Coinbase WalletLink websocket 1006 close errors before source-map symbolication", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters pre-symbolication Coinbase WalletLink websocket 1006 close errors marked in_app by Sentry when AppKit breadcrumbs tie it to Coinbase", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: createAppKitCoinbaseBreadcrumbs(),
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters pre-symbolication Coinbase WalletLink websocket 1006 close errors from the original exception stack", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
          },
        ],
      },
    });
    const error = new Error("websocket error 1006:");
    error.stack =
      "Error: websocket error 1006:\n    at webSocket.onclose (https://dnclu2fna0b2b.cloudfront.net/_next/static/chunks/app/layout-123.js:1:1)";

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(true);
  });

  it("filters Coinbase WalletLink websocket 1006 close errors from the original exception stack", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
          },
        ],
      },
    });
    const error = new Error("websocket error 1006:");
    error.stack =
      "Error: websocket error 1006:\n    at webSocket.onclose (node_modules/.pnpm/@coinbase+wallet-sdk@3.9.3/node_modules/@coinbase/wallet-sdk/dist/relay/walletlink/connection/WalletLinkWebSocket.js:52:28)";

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(true);
  });

  it("filters AppKit Coinbase websocket 1006 errors when Sentry has no app frames", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters raw AppKit Coinbase websocket 1006 unhandled rejections before source-map symbolication", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters raw AppKit Coinbase websocket 1006 unhandled rejections marked in_app by Sentry", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters observed AppKit bootstrap websocket 1006 unhandled rejections before source-map symbolication", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters Coinbase WalletLink websocket 1006 errors from serialized raw stacks", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
      extra: {
        __serialized__: {
          message: "websocket error 1006:",
          stack:
            "Error: websocket error 1006:\n    at webSocket.onclose (node_modules/.pnpm/@coinbase+wallet-sdk@3.9.3/node_modules/@coinbase/wallet-sdk/dist/relay/walletlink/connection/WalletLinkWebSocket.js:52:28)",
        },
      },
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters AppKit Coinbase websocket 1006 errors when vendor stacks only contain incidental app path tokens", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
              frames: [],
            },
          },
        ],
      },
      breadcrumbs: createAppKitCoinbaseBreadcrumbs(),
      extra: {
        __serialized__: {
          message: "websocket error 1006:",
          stack: [
            "Error: websocket error 1006:",
            "    at onClose (https://wallet.example.invalid/vendor/(services/relay.js:1:1)",
          ].join("\n"),
        },
      },
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter app-owned websocket 1006 errors", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
            stacktrace: {
              frames: [
                {
                  filename: "services/websocket/WebSocketProvider.tsx",
                  abs_path: "services/websocket/WebSocketProvider.tsx",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter Coinbase WalletLink websocket 1006 errors with app-owned source frames", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
            stacktrace: {
              frames: [
                {
                  filename:
                    "node_modules/.pnpm/@coinbase+wallet-sdk@3.9.3/node_modules/@coinbase/wallet-sdk/dist/relay/walletlink/connection/WalletLinkWebSocket.js",
                  function: "webSocket.onclose",
                },
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./services/websocket/WebSocketProvider.tsx",
                  function: "connectWebSocket",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter app-owned websocket 1006 errors with AppKit Coinbase breadcrumbs", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter app-owned websocket 1006 errors with observed AppKit bootstrap breadcrumbs", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
      breadcrumbs: createObservedAppKitBootstrapBreadcrumbs(),
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter raw Next static in_app websocket 1006 close errors without third-party wallet evidence", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter app-owned websocket 1006 unhandled rejections with close-handler function names", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
                    "webpack-internal:///(app-pages-browser)/./services/websocket/WebSocketProvider.tsx",
                  function: "webSocket.onclose",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter no-frame websocket 1006 errors when the original exception stack is app-owned", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
            stacktrace: {
              frames: [],
            },
          },
        ],
      },
      breadcrumbs: createAppKitCoinbaseBreadcrumbs(),
    });
    const error = new Error("websocket error 1006:");
    error.stack = [
      "Error: websocket error 1006:",
      "    at connect (webpack-internal:///(app-pages-browser)/./services/websocket/WebSocketProvider.tsx:10:1)",
    ].join("\n");

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter no-frame websocket 1006 errors when the serialized stack is app-owned", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
              frames: [],
            },
          },
        ],
      },
      breadcrumbs: createAppKitCoinbaseBreadcrumbs(),
      extra: {
        __serialized__: {
          message: "websocket error 1006:",
          stack: [
            "Error: websocket error 1006:",
            "    at connect (webpack-internal:///(app-pages-browser)/./services/websocket/WebSocketProvider.tsx:10:1)",
          ].join("\n"),
        },
      },
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter AppKit websocket 1006 errors without a wallet connector breadcrumb", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
            stacktrace: {
              frames: [],
            },
          },
        ],
      },
      breadcrumbs: {
        values: [
          {
            category: "console",
            message:
              "[AppKitInitialization] Initializing AppKit adapter (web) with",
            data: {
              arguments: [
                {
                  enableCoinbase: false,
                  featuredWalletIds: ["metamask"],
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter handled websocket 1006 errors from raw browser frames", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: true,
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
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter raw browser websocket 1006 errors without the WalletLink close function", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
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
                  function: "onclose",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter other Coinbase WalletLink websocket close codes", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1001: Going Away",
            stacktrace: {
              frames: [
                {
                  filename:
                    "node_modules/.pnpm/@coinbase+wallet-sdk@3.9.3/node_modules/@coinbase/wallet-sdk/dist/relay/walletlink/connection/WalletLinkWebSocket.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter broader Coinbase SDK websocket errors", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "websocket error 1006:",
            stacktrace: {
              frames: [
                {
                  filename:
                    "node_modules/.pnpm/@coinbase+wallet-sdk@3.9.3/node_modules/@coinbase/wallet-sdk/dist/relay/SomeOtherWebSocket.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterCoinbaseWalletLinkWebSocket1006(event);

    // Assert
    expect(result).toBe(false);
  });

  it("filters WalletConnect stale session-topic errors from bundled wallet frames", () => {
    // Arrange
    const event = createWalletConnectStaleSessionTopicEvent();

    // Act
    const result = shouldFilterWalletConnectStaleSessionTopic(event);

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter WalletConnect stale session-topic errors with app-owned source frames", () => {
    // Arrange
    const event = createWalletConnectStaleSessionTopicEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: walletConnectStaleSessionTopicMessage,
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename: "app:///_next/static/chunks/10s7s3u16zx-f.js",
                  function: "isValidSessionTopic",
                  in_app: true,
                },
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./services/auth/walletConnectSession.ts",
                  function: "restoreWalletConnectSession",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterWalletConnectStaleSessionTopic(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter other WalletConnect missing-key errors", () => {
    // Arrange
    const event = createWalletConnectStaleSessionTopicEvent({
      exception: {
        values: [
          {
            type: "Error",
            value:
              "No matching key. pairing topic doesn't exist: f17f5eaa1c3041fe37871f9eb24f4de53e1b11e494ec3def4b510d09acf42e32",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename: "app:///_next/static/chunks/10s7s3u16zx-f.js",
                  function: "isValidSessionTopic",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterWalletConnectStaleSessionTopic(event);

    // Assert
    expect(result).toBe(false);
  });

  it("filters injected wallet collisions when stack frames are empty", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Some wrapper error",
            stacktrace: {
              frames: [],
            },
          },
        ],
      },
      breadcrumbs: {
        values: [],
      },
    });
    const error = new Error(
      "Cannot set property ethereum of #<Window> which has only a getter"
    );
    error.stack = `TypeError: Cannot set property ethereum of #<Window> which has only a getter\n    at injected (app:///injected/injected.js:1:1)`;

    // Act
    const result = shouldFilterInjectedWalletCollision(event, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(true);
  });

  it("filters injected wallet collisions when only abs_path has the injected app URI", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "'set' on proxy: trap returned falsish for property 'tronlinkParams'",
            stacktrace: {
              frames: [
                {
                  filename: "https://example.com/injected.js",
                  abs_path: "app:///injected/injected.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters observed injected wallet collisions from requestProvider app URI frames", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      transaction: "/waves",
      request: {
        url: "https://6529.io/waves",
      },
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "Cannot set property ethereum of #<Window> which has only a getter",
            stacktrace: {
              frames: [
                {
                  filename: "app:///requestProvider.js:2:584019",
                  abs_path: "app:///requestProvider.js:2:584019",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: {
        values: [],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter wallet collisions when app-owned source frames are present", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "Cannot set property ethereum of #<Window> which has only a getter",
            stacktrace: {
              frames: [
                {
                  filename: "app:///requestProvider.js",
                  abs_path: "app:///requestProvider.js",
                },
                {
                  filename: "app:///services/auth/wallet-provider.ts",
                  abs_path: "app:///services/auth/wallet-provider.ts",
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: {
        values: [],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter wallet collisions when serialized stack is app-owned", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "Cannot set property ethereum of #<Window> which has only a getter",
            stacktrace: {
              frames: [
                {
                  filename: "app:///requestProvider.js",
                  abs_path: "app:///requestProvider.js",
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: {
        values: [],
      },
      extra: {
        __serialized__: {
          stack:
            "TypeError: Cannot set property ethereum of #<Window> which has only a getter\n    at installProvider (app:///services/auth/wallet-provider.ts:12:3)",
        },
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(false);
  });

  it("filters MetaMask mobile update-url circular React meta element errors", () => {
    // Arrange
    const event = createMetaMaskUpdateUrlCircularEvent();

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters MetaMask mobile update-url circular errors from the original exception stack", () => {
    // Arrange
    const event = createMetaMaskUpdateUrlCircularEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: metaMaskCircularMetaElementMessage,
          },
        ],
      },
    });
    const error = new TypeError(metaMaskCircularMetaElementMessage);
    error.stack =
      "TypeError: Converting circular structure to JSON\n    at JSON.stringify (<anonymous>:12:77)\n    at __mm__updateUrl (<anonymous>:36:7)";

    // Act
    const result = shouldFilterInjectedWalletCollision(event, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter generic app circular JSON errors without MetaMask update-url frames", () => {
    // Arrange
    const event = createMetaMaskUpdateUrlCircularEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: metaMaskCircularMetaElementMessage,
            stacktrace: {
              frames: [
                {
                  filename: "https://6529.io/_next/static/chunks/app.js",
                  abs_path: "https://6529.io/_next/static/chunks/app.js",
                  function: "JSON.stringify",
                },
                {
                  filename: "https://6529.io/_next/static/chunks/app.js",
                  abs_path: "https://6529.io/_next/static/chunks/app.js",
                  function: "serializeMetadata",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter MetaMask update-url errors without the React meta element circular path", () => {
    // Arrange
    const event = createMetaMaskUpdateUrlCircularEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "Converting circular structure to JSON --> starting at object with constructor 'Object'",
            stacktrace: {
              frames: [
                {
                  filename: "<anonymous>",
                  abs_path: "<anonymous>",
                  function: "JSON.stringify",
                },
                {
                  filename: "<anonymous>",
                  abs_path: "<anonymous>",
                  function: "__mm__updateUrl",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter injected wallet collisions when a web frame is present", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "'set' on proxy: trap returned falsish for property 'tronlinkParams'",
            stacktrace: {
              frames: [
                {
                  filename: "app:///injected/injected.js",
                  abs_path: "app:///injected/injected.js",
                },
                {
                  filename: "https://example.com/app.js",
                  abs_path: "https://example.com/app.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter keplr read-only collisions with app-owned source frames", () => {
    // Arrange
    const event = createInjectedKeplrWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "Cannot assign to read only property 'keplr' of object '#<Window>'",
            stacktrace: {
              frames: [
                {
                  filename: "app:///inject-runtime.js",
                  abs_path: "app:///inject-runtime.js",
                },
                {
                  filename: "app:///utils/wallets/install-keplr.ts",
                  abs_path: "app:///utils/wallets/install-keplr.ts",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter keplr read-only collisions with mixed app-owned and injected frame paths", () => {
    // Arrange
    const event = createInjectedKeplrWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "Cannot assign to read only property 'keplr' of object '#<Window>'",
            stacktrace: {
              frames: [
                {
                  filename: "app:///utils/wallets/install-keplr.ts",
                  abs_path: "app:///inject-runtime.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter unrelated app URI injected errors", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Cannot read properties of undefined (reading 'foo')",
            stacktrace: {
              frames: [
                {
                  filename: "app:///injected/injected.js",
                  abs_path: "app:///injected/injected.js",
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: {
        values: [
          {
            category: "console",
            message: "Random console error",
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(false);
  });

  it("filters exact Talisman onboarding errors from extension page.js frames", () => {
    // Arrange
    const event = createTalismanExtensionOnboardingEvent();

    // Act
    const result = shouldFilterTalismanExtensionOnboardingError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters exact Talisman onboarding errors from the original extension stack", () => {
    // Arrange
    const event = createTalismanExtensionOnboardingEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: `Error: ${talismanOnboardingMessage}`,
          },
        ],
      },
    });
    const error = new Error(talismanOnboardingMessage);
    error.stack = `Error: ${talismanOnboardingMessage}\n    at connect (chrome-extension://talisman-wallet/page.js:1:1)`;

    // Act
    const result = shouldFilterTalismanExtensionOnboardingError(event, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter Talisman onboarding errors when an app frame is present", () => {
    // Arrange
    const event = createTalismanExtensionOnboardingEvent({
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
    });

    // Act
    const result = shouldFilterTalismanExtensionOnboardingError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter Talisman onboarding errors when the original stack has app code", () => {
    // Arrange
    const event = createTalismanExtensionOnboardingEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: talismanOnboardingMessage,
          },
        ],
      },
    });
    const error = new Error(talismanOnboardingMessage);
    error.stack = [
      `Error: ${talismanOnboardingMessage}`,
      "    at connect (chrome-extension://talisman-wallet/page.js:1:1)",
      "    at initializeWalletProviders (webpack-internal:///(app-pages-browser)/./components/auth/WagmiSetup.tsx:10:5)",
    ].join("\n");

    // Act
    const result = shouldFilterTalismanExtensionOnboardingError(event, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter related Talisman errors without the exact onboarding message", () => {
    // Arrange
    const event = createTalismanExtensionOnboardingEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "Talisman extension failed to initialize.",
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
    });

    // Act
    const result = shouldFilterTalismanExtensionOnboardingError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("filters disconnected wallet-provider object rejections from extension stacks", () => {
    // Arrange
    const event = {
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
    };

    // Act
    const result = shouldFilterDisconnectedWalletProviderRejection(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters disconnected wallet-provider object rejections without serialized stacks", () => {
    // Arrange
    const event = {
      exception: {
        values: [
          {
            type: "UnhandledRejection",
            value: objectCapturedPromiseRejectionWithoutStackMessage,
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
          },
        ],
      },
      extra: {
        __serialized__: {
          code: 4900,
          message: "The provider is disconnected from all chains.",
        },
      },
    };

    // Act
    const result = shouldFilterDisconnectedWalletProviderRejection(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters RabbyMobile 4001 user-rejected object rejections without app frames", () => {
    // Arrange
    const event = createRabbyMobileUserRejectedRequestEvent();

    // Act
    const result = shouldFilterRabbyMobileUserRejectedRequest(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters production RabbyMobile Android user-rejected object rejections from user-agent context", () => {
    // Arrange
    const event = createRabbyMobileUserRejectedRequestEvent({
      request: {
        headers: {
          "User-Agent": rabbyMobileAndroidUserAgent,
        },
      },
      breadcrumbs: [
        {
          category: "console",
          level: "error",
          message: "Rabby - RPC Error: Not Allowed",
        },
      ],
      extra: {
        __serialized__: {
          code: 4001,
          message: "Not Allowed",
          stack: rabbyMobileAndroidUserRejectedStack,
        },
      },
    });

    // Act
    const result = shouldFilterRabbyMobileUserRejectedRequest(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters exact RabbyMobile RainbowKit lookup errors from the runtime user agent", () => {
    // Arrange
    setNavigatorUserAgent(rabbyMobileUserAgent);
    const event = createRabbyMobileRainbowKitNotFoundEvent();

    // Act
    const result = shouldFilterRabbyMobileRainbowKitNotFoundError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters injected WebAssembly CSP unsafe-eval errors", () => {
    // Arrange
    const event = createInjectedWasmCspUnsafeEvalEvent();

    // Act
    const result = shouldFilterInjectedWasmCspUnsafeEval(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters observed injected WebAssembly.Module CSP unsafe-eval errors", () => {
    // Arrange
    const event = createObservedInjectedWasmCspUnsafeEvalEvent();

    // Act
    const result = shouldFilterInjectedWasmCspUnsafeEval(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters observed anonymous EvalError CSP unsafe-eval errors", () => {
    // Arrange
    const event = createObservedAnonymousUnsafeEvalCspEvent();

    // Act
    const result = shouldFilterAnonymousUnsafeEvalCspError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters observed Sentry E7 WebAssembly CSP unsafe-eval errors from injected static chunks", () => {
    // Arrange
    const event = createObservedSentryE7WasmCspUnsafeEvalEvent();

    // Act
    const result = shouldFilterInjectedWasmCspUnsafeEval(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters injected provider proxy startsWith errors", () => {
    // Arrange
    const event = createInjectedProviderProxyStartsWithEvent();

    // Act
    const result = shouldFilterInjectedProviderProxyStartsWithError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters observed extension messaging failures from injected script frames", () => {
    // Arrange
    const event = createBrowserExtensionMessagingConnectionEvent();

    // Act
    const result = shouldFilterBrowserExtensionMessagingConnectionError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters the observed Sentry 6V content-script messaging failure", () => {
    // Arrange
    const event: TestSentryClientEvent = {
      transaction: "/waves/:wave",
      tags: {
        browser: "Chrome 147.0.0",
        environment: "production",
      },
      exception: {
        values: [
          {
            type: "Error",
            value: extensionMessagingConnectionFailureMessage,
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename: "app:///content-scripts/content.js",
                  function: "R",
                  in_app: true,
                  lineno: 1,
                  colno: 14440,
                },
              ],
            },
          },
        ],
      },
    };

    // Act
    const result = shouldFilterBrowserExtensionMessagingConnectionError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters extension messaging failures from browser extension frames", () => {
    // Arrange
    const event = createBrowserExtensionMessagingConnectionEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: extensionMessagingConnectionFailureMessage,
            stacktrace: {
              frames: [
                {
                  filename:
                    "chrome-extension://abcdefghijklmnop/contentScript.js",
                  abs_path:
                    "chrome-extension://abcdefghijklmnop/contentScript.js",
                  function: "sendMessage",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterBrowserExtensionMessagingConnectionError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter extension messaging failures with app-owned source frames", () => {
    // Arrange
    const event = createBrowserExtensionMessagingConnectionEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: extensionMessagingConnectionFailureMessage,
            stacktrace: {
              frames: [
                {
                  filename: "app:///content-scripts/content.js",
                  function: "R",
                  in_app: true,
                },
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./utils/browser-extension.ts",
                  abs_path:
                    "webpack-internal:///(app-pages-browser)/./utils/browser-extension.ts",
                  function: "sendBrowserExtensionMessage",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterBrowserExtensionMessagingConnectionError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter unobserved content-script-like app paths", () => {
    // Arrange
    const event = createBrowserExtensionMessagingConnectionEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: extensionMessagingConnectionFailureMessage,
            stacktrace: {
              frames: [
                {
                  filename: "app:///content-scripts/application.js",
                  function: "sendBrowserExtensionMessage",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterBrowserExtensionMessagingConnectionError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter extension messaging failures with app-owned original stacks", () => {
    // Arrange
    const event = createBrowserExtensionMessagingConnectionEvent();
    const error = new Error(extensionMessagingConnectionFailureMessage);
    error.stack = [
      `Error: ${extensionMessagingConnectionFailureMessage}`,
      "    at n (app:///injectedScript.bundle.js:2:99787)",
      "    at sendBrowserExtensionMessage (webpack-internal:///(app-pages-browser)/./utils/browser-extension.ts:10:1)",
    ].join("\n");

    // Act
    const result = shouldFilterBrowserExtensionMessagingConnectionError(event, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter extension messaging failures with app-owned serialized stacks", () => {
    // Arrange
    const event = createBrowserExtensionMessagingConnectionEvent({
      extra: {
        __serialized__: {
          message: extensionMessagingConnectionFailureMessage,
          stack: [
            `Error: ${extensionMessagingConnectionFailureMessage}`,
            "    at n (app:///injectedScript.bundle.js:2:99787)",
            "    at sendBrowserExtensionMessage (webpack-internal:///(app-pages-browser)/./utils/browser-extension.ts:10:1)",
          ].join("\n"),
        },
      },
    });

    // Act
    const result = shouldFilterBrowserExtensionMessagingConnectionError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter extension messaging failures without injected or extension frames", () => {
    // Arrange
    const event = createBrowserExtensionMessagingConnectionEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: extensionMessagingConnectionFailureMessage,
            stacktrace: {
              frames: [
                {
                  filename:
                    "https://6529.io/_next/static/chunks/app/waves/page.js",
                  abs_path:
                    "https://6529.io/_next/static/chunks/app/waves/page.js",
                  function: "sendBrowserExtensionMessage",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterBrowserExtensionMessagingConnectionError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter extension messaging failures from mixed frame paths", () => {
    // Arrange
    const event = createBrowserExtensionMessagingConnectionEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: extensionMessagingConnectionFailureMessage,
            stacktrace: {
              frames: [
                {
                  filename:
                    "chrome-extension://abcdefghijklmnop/contentScript.js",
                  abs_path:
                    "https://6529.io/_next/static/chunks/app/waves/page.js",
                  function: "sendBrowserExtensionMessage",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterBrowserExtensionMessagingConnectionError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter unrelated errors from injected script frames", () => {
    // Arrange
    const event = createBrowserExtensionMessagingConnectionEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "Extension message failed for a different reason.",
            stacktrace: {
              frames: [
                {
                  filename: "app:///injectedScript.bundle.js",
                  abs_path: "app:///injectedScript.bundle.js",
                  function: "n",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterBrowserExtensionMessagingConnectionError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter disconnected wallet-provider object rejections with app frames", () => {
    // Arrange
    const event = {
      exception: {
        values: [
          {
            type: "UnhandledRejection",
            value: objectCapturedPromiseRejectionMessage,
            stacktrace: {
              frames: [
                {
                  filename: "app:///components/providers/WagmiSetup.tsx",
                  abs_path: "app:///components/providers/WagmiSetup.tsx",
                },
              ],
            },
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
    };

    // Act
    const result = shouldFilterDisconnectedWalletProviderRejection(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter injected provider proxy errors with app frames", () => {
    // Arrange
    const event = createInjectedProviderProxyStartsWithEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: injectedProviderProxyStartsWithMessage,
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
                {
                  filename: "app:///js/injected/proxy-injected-providers.js",
                  abs_path: "app:///js/injected/proxy-injected-providers.js",
                  in_app: true,
                },
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./components/providers/WagmiSetup.tsx",
                  abs_path:
                    "webpack-internal:///(app-pages-browser)/./components/providers/WagmiSetup.tsx",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedProviderProxyStartsWithError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter no-stack disconnected wallet-provider rejections with app frames", () => {
    // Arrange
    const event = {
      exception: {
        values: [
          {
            type: "UnhandledRejection",
            value: objectCapturedPromiseRejectionWithoutStackMessage,
            stacktrace: {
              frames: [
                {
                  filename: "components/providers/WagmiSetup.tsx",
                  abs_path: "components/providers/WagmiSetup.tsx",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
      extra: {
        __serialized__: {
          code: 4900,
          message: "The provider is disconnected from all chains.",
        },
      },
    };

    // Act
    const result = shouldFilterDisconnectedWalletProviderRejection(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter RabbyMobile user-rejected object rejections with app-owned frames", () => {
    // Arrange
    const event = createRabbyMobileUserRejectedRequestEvent({
      exception: {
        values: [
          {
            type: "UnhandledRejection",
            value: objectCapturedPromiseRejectionMessage,
            stacktrace: {
              frames: [
                {
                  filename: "hooks/drops/useDropSignature.ts",
                  abs_path: "hooks/drops/useDropSignature.ts",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterRabbyMobileUserRejectedRequest(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter RabbyMobile user-rejected object rejections with app-owned serialized stacks", () => {
    // Arrange
    const event = createRabbyMobileUserRejectedRequestEvent({
      request: {
        headers: {
          "User-Agent": rabbyMobileAndroidUserAgent,
        },
      },
      extra: {
        __serialized__: {
          code: 4001,
          message: "Not Allowed",
          stack: [
            rabbyMobileAndroidUserRejectedStack,
            "    at signDrop (app:///hooks/drops/useDropSignature.ts:1:1)",
          ].join("\n"),
        },
      },
    });

    // Act
    const result = shouldFilterRabbyMobileUserRejectedRequest(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter RabbyMobile RainbowKit lookup errors with app-owned frames", () => {
    // Arrange
    setNavigatorUserAgent(rabbyMobileUserAgent);
    const event = createRabbyMobileRainbowKitNotFoundEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: rainbowKitNotFoundMessage,
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

    // Act
    const result = shouldFilterRabbyMobileRainbowKitNotFoundError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter RabbyMobile RainbowKit lookup errors with first-party frame paths", () => {
    // Arrange
    setNavigatorUserAgent(rabbyMobileUserAgent);
    const event = createRabbyMobileRainbowKitNotFoundEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: rainbowKitNotFoundMessage,
            stacktrace: {
              frames: [
                {
                  filename: "https://6529.io/_next/static/chunks/app-client.js",
                  function: "initializeWallet",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterRabbyMobileRainbowKitNotFoundError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter RainbowKit lookup errors without RabbyMobile context", () => {
    // Arrange
    setNavigatorUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile Safari/605.1.15"
    );
    const event = createRabbyMobileRainbowKitNotFoundEvent();

    // Act
    const result = shouldFilterRabbyMobileRainbowKitNotFoundError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter WebAssembly CSP unsafe-eval errors with first-party frames", () => {
    // Arrange
    const event = createInjectedWasmCspUnsafeEvalEvent({
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
                {
                  filename: "https://6529.io/_next/static/chunks/app.js",
                  abs_path: "https://6529.io/_next/static/chunks/app.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWasmCspUnsafeEval(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter observed WebAssembly.Module CSP unsafe-eval errors with app frames", () => {
    // Arrange
    const event = createObservedInjectedWasmCspUnsafeEvalEvent({
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
                {
                  filename: "app:///components/providers/WagmiSetup.tsx",
                  abs_path: "app:///components/providers/WagmiSetup.tsx",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWasmCspUnsafeEval(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter observed Sentry E7 WebAssembly CSP errors when the function differs", () => {
    // Arrange
    const event = createObservedSentryE7WasmCspUnsafeEvalEvent({
      exception: {
        values: [
          {
            type: "RuntimeError",
            value: wasmCspUnsafeEvalMessage,
            stacktrace: {
              frames: [
                {
                  filename: "app:///chunks/utils-DNoBWR8F.js",
                  abs_path: "app:///chunks/utils-DNoBWR8F.js",
                  function: "loadWasmModule",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWasmCspUnsafeEval(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter non-CSP errors with the observed Sentry E7 static chunk frame", () => {
    // Arrange
    const event = createObservedSentryE7WasmCspUnsafeEvalEvent({
      exception: {
        values: [
          {
            type: "RuntimeError",
            value: "Aborted(RuntimeError: unreachable)",
            stacktrace: {
              frames: [
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
    });

    // Act
    const result = shouldFilterInjectedWasmCspUnsafeEval(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter observed Sentry E7 WebAssembly CSP errors with app source frames", () => {
    // Arrange
    const event = createObservedSentryE7WasmCspUnsafeEvalEvent({
      exception: {
        values: [
          {
            type: "RuntimeError",
            value: wasmCspUnsafeEvalMessage,
            stacktrace: {
              frames: [
                {
                  filename: "app:///chunks/utils-DNoBWR8F.js",
                  abs_path: "app:///chunks/utils-DNoBWR8F.js",
                  function: "k",
                  in_app: true,
                },
                {
                  filename: "app:///components/providers/WagmiSetup.tsx",
                  abs_path: "app:///components/providers/WagmiSetup.tsx",
                  function: "initializeAppKit",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWasmCspUnsafeEval(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter WebAssembly CSP errors when one frame path is app-owned", () => {
    // Arrange
    const event = createInjectedWasmCspUnsafeEvalEvent({
      exception: {
        values: [
          {
            type: "RuntimeError",
            value: wasmCspUnsafeEvalMessage,
            stacktrace: {
              frames: [
                {
                  filename: "app:///inject.js",
                  abs_path: "app:///components/providers/WagmiSetup.tsx",
                  function: "k",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWasmCspUnsafeEval(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter anonymous EvalError CSP unsafe-eval errors with app frames", () => {
    // Arrange
    const event = createObservedAnonymousUnsafeEvalCspEvent({
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
                    "https://6529.io/_next/static/chunks/app/page-1234567890abcdef.js",
                  abs_path:
                    "https://6529.io/_next/static/chunks/app/page-1234567890abcdef.js",
                  function: "runTemplate",
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
    });

    // Act
    const result = shouldFilterAnonymousUnsafeEvalCspError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter anonymous EvalError CSP unsafe-eval errors with app source stacks", () => {
    // Arrange
    const event = createObservedAnonymousUnsafeEvalCspEvent();
    const error = new EvalError(anonymousUnsafeEvalCspMessage);
    error.stack = [
      `EvalError: ${anonymousUnsafeEvalCspMessage}`,
      "    at runTemplate (webpack-internal:///(app-pages-browser)/./utils/eval-template.ts:10:1)",
      "    at eval (<anonymous>)",
    ].join("\n");

    // Act
    const result = shouldFilterAnonymousUnsafeEvalCspError(event, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter anonymous EvalError CSP errors without eval frames", () => {
    // Arrange
    const event = createObservedAnonymousUnsafeEvalCspEvent({
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
                  filename: "<anonymous>:234:30",
                  abs_path: "<anonymous>:234:30",
                  function: "predicate",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterAnonymousUnsafeEvalCspError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter unrelated anonymous EvalError unsafe-eval errors", () => {
    // Arrange
    const event = createObservedAnonymousUnsafeEvalCspEvent({
      exception: {
        values: [
          {
            type: "EvalError",
            value: "Refused to evaluate a string as JavaScript.",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              handled: false,
            },
            stacktrace: {
              frames: [
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
    });

    // Act
    const result = shouldFilterAnonymousUnsafeEvalCspError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter disconnected wallet-provider object rejections with web stack URLs", () => {
    // Arrange
    const event = {
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
          stack: `${disconnectedProviderStack}\n    at app (https://6529.io/_next/static/chunks/app.js:1:1)`,
        },
      },
    };

    // Act
    const result = shouldFilterDisconnectedWalletProviderRejection(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter non-4001 RabbyMobile wallet object rejections", () => {
    // Arrange
    const event = createRabbyMobileUserRejectedRequestEvent({
      extra: {
        __serialized__: {
          code: 4100,
          message: "Not Allowed",
          stack: rabbyMobileUserRejectedStack,
        },
      },
    });

    // Act
    const result = shouldFilterRabbyMobileUserRejectedRequest(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter user-rejected object rejections without RabbyMobile context", () => {
    // Arrange
    const event = createRabbyMobileUserRejectedRequestEvent({
      extra: {
        __serialized__: {
          code: 4001,
          message: "Not Allowed",
          stack: rabbyMobileAndroidUserRejectedStack,
        },
      },
    });

    // Act
    const result = shouldFilterRabbyMobileUserRejectedRequest(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter unrelated injected WebAssembly runtime errors", () => {
    // Arrange
    const event = createInjectedWasmCspUnsafeEvalEvent({
      exception: {
        values: [
          {
            type: "RuntimeError",
            value: "Aborted(RuntimeError: unreachable)",
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
    });

    // Act
    const result = shouldFilterInjectedWasmCspUnsafeEval(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter non-reference errors from Twitter", () => {
    // Arrange
    const event = createTwitterConfigEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Can't find variable: CONFIG",
            stacktrace: {
              frames: [{ filename: "app:///", abs_path: "app:///" }],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterTwitterConfigReferenceError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter Twitter CONFIG errors when frames are not all app URIs", () => {
    // Arrange
    const event = createTwitterConfigEvent({
      exception: {
        values: [
          {
            type: "ReferenceError",
            value: "Can't find variable: CONFIG",
            stacktrace: {
              frames: [
                { filename: "app:///", abs_path: "app:///" },
                {
                  filename: "https://example.com/main.js",
                  abs_path: "https://example.com/main.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterTwitterConfigReferenceError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter unrelated app URI errors from Twitter", () => {
    // Arrange
    const event = createTwitterConfigEvent({
      exception: {
        values: [
          {
            type: "ReferenceError",
            value: "Can't find variable: SOMETHING_ELSE",
            stacktrace: {
              frames: [{ filename: "app:///", abs_path: "app:///" }],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterTwitterConfigReferenceError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("detects app URI-only frame stacks in testing helpers", () => {
    // Arrange
    const frames: SentryStackFrame[] = [
      { filename: "app:///" },
      { abs_path: "app:///" },
    ];

    // Act
    const result = __testing.hasOnlyAppUriFrames(frames);

    // Assert
    expect(result).toBe(true);
  });

  it("detects app URI-only frame stacks when only abs_path has the app URI", () => {
    // Arrange
    const frames: SentryStackFrame[] = [
      {
        filename: "https://example.com/main.js",
        abs_path: "app:///main.js",
      },
      {
        filename: "app:///bootstrap.js",
        abs_path: "https://example.com/bootstrap.js",
      },
    ];

    // Act
    const result = __testing.hasOnlyAppUriFrames(frames);

    // Assert
    expect(result).toBe(true);
  });
});
