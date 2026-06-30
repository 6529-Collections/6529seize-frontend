import {
  __testing,
  getLowValueNetworkErrorDecision,
  getLowValueNetworkErrorTargetUrl,
  getNetworkErrorMessageTargetUrl,
  shouldFilterByFilenameExceptions,
  shouldFilterCoinbaseWalletLinkWebSocket1006,
  shouldFilterDisconnectedWalletProviderRejection,
  shouldFilterInjectedWalletCollision,
  shouldFilterReactDomInsertBeforeNotFoundError,
  shouldFilterInjectedWasmCspUnsafeEval,
  shouldFilterRabbyMobileUserRejectedRequest,
  shouldFilterSentryRouteParameterizationError,
  shouldFilterTalismanExtensionOnboardingError,
  shouldFilterThirdPartyTelemetrySpan,
  shouldFilterTwitterConfigReferenceError,
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
  const talismanOnboardingMessage =
    "Talisman extension has not been configured yet. Please continue with onboarding.";
  const disconnectedProviderStack =
    "Error: The provider is disconnected from all chains.\n    at o (chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/background.js:2:7356292)";
  const rabbyMobileUserRejectedStack =
    "Error: Not Allowed\n    at userRejectedRequest (RabbyMobile://native-bundle/background.js:1:1)";
  const reactDomInsertBeforeMessage =
    __testing.REACT_DOM_INSERT_BEFORE_NOT_FOUND_ERROR_MESSAGE;
  const reactDomFrame = {
    filename:
      "node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js",
  };
  const metaMaskCircularMetaElementMessage =
    "Converting circular structure to JSON --> starting at object with constructor 'HTMLMetaElement' | property '__reactFiber$nkfb4ziusym' -> object with constructor 'ry' --- property 'stateNode' closes the circle";
  const wasmCspUnsafeEvalMessage = [
    "Aborted(CompileError: WebAssembly.instantiate(): Compiling or instantiating",
    "WebAssembly module violates the following Content Security policy directive",
    "because 'unsafe-eval' is not an allowed source of script in the following",
    "Content Security Policy directive: \"script-src 'self' 'unsafe-inline'\".).",
    "Build with -sASSERTIONS for more info.",
  ].join(" ");

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

  const createSentryRouteParameterizationEvent = (
    overrides: Record<string, unknown> = {}
  ) =>
    ({
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
    }) as any;

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

  it("does not filter cyclic JSON errors without navigation breadcrumbs", () => {
    // Arrange
    const event = createSentryRouteParameterizationEvent({
      breadcrumbs: [],
    });

    // Act
    const result = shouldFilterSentryRouteParameterizationError(event);

    // Assert
    expect(result).toBe(false);
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

  it("filters Coinbase WalletLink websocket 1006 close errors", () => {
    // Arrange
    const event = createCoinbaseWalletLinkWebSocketEvent();

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

  it("filters RabbyMobile 4001 user-rejected object rejections without app frames", () => {
    // Arrange
    const event = createRabbyMobileUserRejectedRequestEvent();

    // Act
    const result = shouldFilterRabbyMobileUserRejectedRequest(event);

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
