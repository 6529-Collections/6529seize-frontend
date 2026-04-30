import {
  __testing,
  getLowValueNetworkErrorDecision,
  shouldFilterByFilenameExceptions,
  shouldFilterInjectedWalletCollision,
  shouldFilterThirdPartyTelemetrySpan,
  shouldFilterTwitterConfigReferenceError,
  tagSampledLowValueNetworkError,
} from "@/utils/sentry-client-filters";

describe("sentry-client-filters", () => {
  const wrappedNetworkMessage =
    "Network request failed. Please check your connection and try again. (/api/waves-overview)";

  const buildSpan = (overrides: Record<string, unknown> = {}) =>
    ({
      op: "http.client",
      data: {
        "http.url": "https://region1.google-analytics.com/g/collect",
        "http.response.status_code": 0,
        "url.same_origin": false,
      },
      ...overrides,
    }) as any;

  const createTwitterConfigEvent = (overrides: Record<string, unknown> = {}) =>
    ({
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
    }) as any;

  const createInjectedWalletCollisionEvent = (
    overrides: Record<string, unknown> = {}
  ) =>
    ({
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
    }) as any;

  const createLowValueNetworkEvent = (
    overrides: Record<string, unknown> = {}
  ) =>
    ({
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
          },
        },
      ],
      ...overrides,
    }) as any;

  it("filters events when a stack frame matches a filename exception", () => {
    // Arrange
    const frames = [{ filename: "app:///extensionServiceWorker.js" } as any];

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
    const frames = [{ filename: "app:///extensionPageScript.js" } as any];

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
    const frames = [
      {
        filename: "https://example.com/main.js",
        abs_path: "chrome-extension://wallet/extensionServiceWorker.js",
      },
    ] as any;

    // Act
    const result = shouldFilterByFilenameExceptions(frames);

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter when frames do not match any filename exception", () => {
    // Arrange
    const frames = [{ filename: "app:///main.js" } as any];

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
            data: {
              url: "/api/waves-overview",
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("not_applicable");
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
            },
          },
        ],
      }),
      0
    );

    expect(result).toBe("not_applicable");
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
    const frames = [{ filename: "app:///" }, { abs_path: "app:///" }] as any;

    // Act
    const result = __testing.hasOnlyAppUriFrames(frames);

    // Assert
    expect(result).toBe(true);
  });

  it("detects app URI-only frame stacks when only abs_path has the app URI", () => {
    // Arrange
    const frames = [
      {
        filename: "https://example.com/main.js",
        abs_path: "app:///main.js",
      },
      {
        filename: "app:///bootstrap.js",
        abs_path: "https://example.com/bootstrap.js",
      },
    ] as any;

    // Act
    const result = __testing.hasOnlyAppUriFrames(frames);

    // Assert
    expect(result).toBe(true);
  });
});
