import {
  getReviewbotPublicUsageSummary,
  normalizeReviewbotUsageApiBaseUrl,
  normalizeReviewbotUsageSummaryPath,
} from "@/services/reviewbot-usage-api";

describe("reviewbot usage api", () => {
  it("normalizes supported base URLs", () => {
    const localHttpBaseUrl = "http" + "://localhost:42929/";
    const localIpv6HttpBaseUrl = "http" + "://[::1]:42929/";
    const externalHttpBaseUrl = "http" + "://reviewbot.6529.io";

    expect(
      normalizeReviewbotUsageApiBaseUrl("https://reviewbot.6529.io/")
    ).toBe("https://reviewbot.6529.io");
    expect(normalizeReviewbotUsageApiBaseUrl(localHttpBaseUrl)).toBe(
      "http" + "://localhost:42929"
    );
    expect(normalizeReviewbotUsageApiBaseUrl(localIpv6HttpBaseUrl)).toBe(
      "http" + "://[::1]:42929"
    );
    expect(normalizeReviewbotUsageApiBaseUrl(externalHttpBaseUrl)).toBe(null);
    expect(normalizeReviewbotUsageApiBaseUrl("mailto:reviewbot@6529.io")).toBe(
      null
    );
    expect(normalizeReviewbotUsageApiBaseUrl("not a url")).toBe(null);
  });

  it("keeps configured summary paths on the usage API origin", () => {
    expect(normalizeReviewbotUsageSummaryPath("/custom/summary")).toBe(
      "/custom/summary"
    );
    expect(
      normalizeReviewbotUsageSummaryPath("/custom/summary?scope=public")
    ).toBe("/custom/summary?scope=public");
    expect(
      normalizeReviewbotUsageSummaryPath("https://example.com/summary")
    ).toBe("/api/public/usage/summary");
    expect(normalizeReviewbotUsageSummaryPath("//example.com/summary")).toBe(
      "/api/public/usage/summary"
    );
  });

  it("returns an unconfigured result without a base URL", async () => {
    await expect(
      getReviewbotPublicUsageSummary({ env: {} })
    ).resolves.toMatchObject({
      status: "unconfigured",
    });
  });

  it("loads and parses public usage summaries", async () => {
    const fetchImpl = jest.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            range: {
              days: 30,
              from: "2026-05-12T00:00:00.000Z",
              to: "2026-06-11T00:00:00.000Z",
            },
            totals: {
              reviewRuns: 2,
              costUsd: 1.25,
              totalTokens: 1000,
              budgetSkippedRuns: 1,
              uniquePrs: 2,
              averageCostPerReviewRunUsd: 0.625,
              averageCostPerPrUsd: 0.625,
            },
            analysis: {
              budgetSkipRate: 50,
              averageTokensPerReviewRun: 500,
              averageTokensPerPr: 500,
              topCostRepo: {
                key: "6529-Collections/example",
                reviewRuns: 2,
                costUsd: 1.25,
                averageCostUsd: 0.625,
                totalTokens: 1000,
                budgetSkippedRuns: 1,
                costSharePercent: 100,
              },
              topCostProviderModel: null,
              topCostReviewKind: null,
            },
            byDay: [
              {
                key: "2026-06-11",
                reviewRuns: 2,
                costUsd: 1.25,
                averageCostUsd: 0.625,
                totalTokens: 1000,
                budgetSkippedRuns: 1,
              },
            ],
            byProviderModel: [],
            byRepo: [],
            byReviewKind: [],
          }),
        }) as Response
    );

    const result = await getReviewbotPublicUsageSummary({
      days: 7,
      env: {
        REVIEWBOT_USAGE_API_BASE_URL: "https://reviewbot.6529.io",
      },
      fetchImpl,
    });

    expect(result).toMatchObject({
      status: "ok",
      summary: {
        totals: {
          reviewRuns: 2,
          costUsd: 1.25,
          totalTokens: 1000,
          budgetSkippedRuns: 1,
          uniquePrs: 2,
          averageCostPerReviewRunUsd: 0.625,
          averageCostPerPrUsd: 0.625,
        },
        analysis: {
          budgetSkipRate: 50,
          topCostRepo: {
            costSharePercent: 100,
          },
        },
      },
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      new URL("https://reviewbot.6529.io/api/public/usage/summary?days=7"),
      expect.objectContaining({
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      })
    );
  });

  it("preserves base URL subpaths when loading summaries", async () => {
    const fetchImpl = jest.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
          }),
        }) as Response
    );

    await getReviewbotPublicUsageSummary({
      env: {
        REVIEWBOT_USAGE_API_BASE_URL: "https://reviewbot.6529.io/v1",
        REVIEWBOT_USAGE_API_PUBLIC_SUMMARY_PATH: "/api/public/usage/summary",
      },
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      new URL("https://reviewbot.6529.io/v1/api/public/usage/summary?days=30"),
      expect.any(Object)
    );
  });

  it("returns unavailable when the API errors", async () => {
    const fetchImpl = jest.fn(
      async () =>
        ({
          ok: false,
          status: 503,
          json: async () => ({
            error: "unavailable",
          }),
        }) as Response
    );

    await expect(
      getReviewbotPublicUsageSummary({
        env: {
          REVIEWBOT_USAGE_API_BASE_URL: "https://reviewbot.6529.io",
        },
        fetchImpl,
      })
    ).resolves.toMatchObject({
      status: "unavailable",
    });
  });
});
