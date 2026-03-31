const mockInit = jest.fn();
const mockReplayIntegration = jest.fn(() => ({ name: "replay" }));
const mockCaptureRouterTransitionStart = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  init: mockInit,
  replayIntegration: mockReplayIntegration,
  captureRouterTransitionStart: mockCaptureRouterTransitionStart,
}));

describe("instrumentation-client beforeSendTransaction", () => {
  const loadBeforeSendTransaction = () => {
    jest.isolateModules(() => {
      require("@/instrumentation-client");
    });

    const config = mockInit.mock.calls[0]?.[0];
    expect(config).toBeDefined();
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

  beforeEach(() => {
    jest.resetModules();
    mockInit.mockReset();
    mockReplayIntegration.mockReset();
    mockReplayIntegration.mockImplementation(() => ({ name: "replay" }));
    mockCaptureRouterTransitionStart.mockReset();
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
