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
  const reactDomInsertBeforeMessage =
    "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.";
  const reactDomFrame = {
    filename:
      "node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js",
  };
  const sentryRouteParameterizationMessage =
    "JSON.stringify cannot serialize cyclic structures.";
  const sentryRouteParameterizationMechanismType =
    "auto.browser.browserapierrors.setTimeout";
  const nativeJsonStringifyFrame = {
    filename: "[native code]",
    function: "stringify",
    in_app: true,
  };

  type BeforeSendResult = {
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

  const createSentryRouteParameterizationEvent = (
    frames: Array<Record<string, unknown>> = [nativeJsonStringifyFrame]
  ) => ({
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
    breadcrumbs: [
      {
        category: "navigation",
        data: {
          from: "/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
          to: "/waves/fb539d2d-5efd-4cde-b6f0-b639a5659ff9",
        },
      },
    ],
  });

  beforeEach(() => {
    jest.resetModules();
    mockInit.mockReset();
    mockReplayIntegration.mockReset();
    mockReplayIntegration.mockImplementation(() => ({ name: "replay" }));
    mockCaptureRouterTransitionStart.mockReset();
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

  it("drops Sentry route parameterization cyclic JSON errors", () => {
    const beforeSend = loadBeforeSend();
    const event = createSentryRouteParameterizationEvent();

    const result = beforeSend(event);

    expect(result).toBeNull();
  });

  it("keeps cyclic JSON errors with app-owned frames", () => {
    const beforeSend = loadBeforeSend();
    const event = createSentryRouteParameterizationEvent([
      nativeJsonStringifyFrame,
      {
        filename: "https://6529.io/_next/static/chunks/app-client.js",
        function: "serializeWaveParams",
        in_app: true,
      },
    ]);

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
