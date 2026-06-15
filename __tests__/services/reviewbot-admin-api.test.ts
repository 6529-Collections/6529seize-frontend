/**
 * @jest-environment node
 */

import {
  getReviewbotAdminDashboard,
  normalizeReviewbotUsageAuthCheckUrl,
} from "@/services/reviewbot-admin-api";
import { createHmac } from "node:crypto";

const futureDate = new Date("2026-06-12T12:00:00.000Z");
const allowedWallet = "0x0000000000000000000000000000000000065290";
const testHmacKey = ["reviewbot", "admin", "hmac", "fixture"].join("-");

function createJwt(wallet: string, exp = 1781269200): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ exp, sub: wallet })).toString(
    "base64url"
  );
  return `${header}.${payload}.`;
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    json: async () => body,
    ok: status >= 200 && status < 300,
    status,
  } as Response;
}

function baseEnv() {
  return {
    REVIEWBOT_USAGE_ADMIN_ALLOWED_WALLETS: allowedWallet,
    REVIEWBOT_USAGE_ADMIN_AUTH_CHECK_URL:
      "https://api.6529.io/api/v2/notifications?limit=1",
    REVIEWBOT_USAGE_API_ADMIN_HMAC_SECRET: testHmacKey,
    REVIEWBOT_USAGE_API_BASE_URL: "https://reviewbot.6529.io",
  };
}

describe("reviewbot admin api", () => {
  it("normalizes auth check URLs", () => {
    const localHttpUrl = ["http", "://localhost:3000/api/me"].join("");
    const externalHttpUrl = ["http", "://api.6529.io/api/me"].join("");

    expect(
      normalizeReviewbotUsageAuthCheckUrl(
        "https://api.6529.io/api/v2/notifications?limit=1#fragment"
      )
    ).toBe("https://api.6529.io/api/v2/notifications?limit=1");
    expect(normalizeReviewbotUsageAuthCheckUrl(localHttpUrl)).toBe(
      localHttpUrl
    );
    expect(normalizeReviewbotUsageAuthCheckUrl(externalHttpUrl)).toBe(null);
    expect(
      normalizeReviewbotUsageAuthCheckUrl("https://user:pass@example.com/me")
    ).toBe(null);
  });

  it("fails closed when admin configuration is missing", async () => {
    await expect(
      getReviewbotAdminDashboard({ env: {} })
    ).resolves.toMatchObject({
      status: "unconfigured",
    });
  });

  it("requires a wallet auth token", async () => {
    await expect(
      getReviewbotAdminDashboard({
        env: baseEnv(),
        walletAuthJwt: null,
      })
    ).resolves.toMatchObject({
      status: "unauthenticated",
    });
  });

  it("rejects wallets outside the server-side allowlist before bot calls", async () => {
    const fetchImpl = jest.fn();

    await expect(
      getReviewbotAdminDashboard({
        env: baseEnv(),
        fetchImpl,
        now: futureDate,
        walletAuthJwt: createJwt("0x0000000000000000000000000000000000000001"),
      })
    ).resolves.toMatchObject({
      status: "forbidden",
    });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects malformed wallet subjects before external calls", async () => {
    const fetchImpl = jest.fn();

    await expect(
      getReviewbotAdminDashboard({
        env: baseEnv(),
        fetchImpl,
        now: futureDate,
        walletAuthJwt: createJwt("6529"),
      })
    ).resolves.toMatchObject({
      status: "unauthenticated",
    });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("verifies the wallet JWT before signing bot admin requests", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValue(jsonResponse({ ok: true }));

    const result = await getReviewbotAdminDashboard({
      env: baseEnv(),
      fetchImpl,
      now: futureDate,
      walletAuthJwt: createJwt(allowedWallet),
    });

    expect(result).toMatchObject({
      status: "ok",
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      new URL("https://api.6529.io/api/v2/notifications?limit=1"),
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: expect.stringMatching(/^Bearer /),
        }),
      })
    );

    const summaryCall = fetchImpl.mock.calls.find(([input]) =>
      String(input).includes("/api/admin/usage/summary")
    );
    expect(summaryCall).toBeDefined();

    const summaryUrl = summaryCall?.[0] as URL;
    const summaryHeaders = summaryCall?.[1]?.headers as Record<string, string>;
    const expiresAt = String(Math.floor(futureDate.getTime() / 1000) + 300);
    const expectedSignature = createHmac("sha256", testHmacKey)
      .update(
        [
          "GET",
          `${summaryUrl.pathname}${summaryUrl.search}`,
          allowedWallet,
          "reviewbot-admin",
          expiresAt,
        ].join("\n")
      )
      .digest("hex");

    expect(summaryHeaders["x-6529-admin-user"]).toBe(allowedWallet);
    expect(summaryHeaders["x-6529-admin-roles"]).toBe("reviewbot-admin");
    expect(summaryHeaders["x-6529-admin-expires-at"]).toBe(expiresAt);
    expect(summaryHeaders["x-6529-admin-signature"]).toBe(
      `sha256=${expectedSignature}`
    );
  });

  it("does not sign bot admin requests when 6529 auth verification fails", async () => {
    const fetchImpl = jest.fn().mockResolvedValueOnce(jsonResponse({}, 401));

    await expect(
      getReviewbotAdminDashboard({
        env: baseEnv(),
        fetchImpl,
        now: futureDate,
        walletAuthJwt: createJwt(allowedWallet),
      })
    ).resolves.toMatchObject({
      status: "unauthenticated",
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("parses enriched admin usage analysis and PR author rows", async () => {
    const fetchImpl = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v2/notifications")) {
        return jsonResponse({ ok: true });
      }
      if (url.includes("/api/admin/usage/summary")) {
        return jsonResponse({
          ok: true,
          visibility: "admin",
          kind: "usage_summary",
          range: { days: 30 },
          totals: {
            reviewRuns: 4,
            costUsd: 12,
            totalTokens: 6000,
            budgetSkippedRuns: 1,
            uniquePrs: 3,
            averageCostPerReviewRunUsd: 3,
            averageCostPerPrUsd: 4,
          },
          analysis: {
            budgetSkipRate: 25,
            averageTokensPerReviewRun: 1500,
            averageTokensPerPr: 2000,
            topCostRepo: null,
            topCostProviderModel: null,
            topCostReviewKind: null,
            topCostRequestor: {
              key: "punk6529",
              reviewRuns: 3,
              costUsd: 9,
              averageCostUsd: 3,
              totalTokens: 4500,
              budgetSkippedRuns: 0,
              costSharePercent: 75,
            },
            topCostPrAuthor: {
              key: "ragnep",
              reviewRuns: 2,
              costUsd: 8,
              averageCostUsd: 4,
              totalTokens: 4000,
              budgetSkippedRuns: 0,
              costSharePercent: 66.67,
            },
            topCostPr: {
              key: "6529-Collections/6529seize-frontend#2700",
              repoFullName: "6529-Collections/6529seize-frontend",
              prNumber: 2700,
              prAuthor: "ragnep",
              latestHeadSha: "abcdef1234567890",
              lastReviewAt: "2026-06-15T08:00:00.000Z",
              reviewRuns: 2,
              costUsd: 8,
              averageCostUsd: 4,
              totalTokens: 4000,
              budgetSkippedRuns: 0,
              costSharePercent: 66.67,
            },
          },
          byDay: [],
          byRepo: [],
          byProviderModel: [],
          byReviewKind: [],
          byRequestor: [],
          byPrAuthor: [
            {
              key: "ragnep",
              reviewRuns: 2,
              costUsd: 8,
              averageCostUsd: 4,
              totalTokens: 4000,
              budgetSkippedRuns: 0,
            },
          ],
          byPr: [
            {
              key: "6529-Collections/6529seize-frontend#2700",
              repoFullName: "6529-Collections/6529seize-frontend",
              prNumber: 2700,
              prAuthor: "ragnep",
              latestHeadSha: "abcdef1234567890",
              lastReviewAt: "2026-06-15T08:00:00.000Z",
              reviewRuns: 2,
              costUsd: 8,
              averageCostUsd: 4,
              totalTokens: 4000,
              budgetSkippedRuns: 0,
            },
          ],
        });
      }
      return jsonResponse({ ok: true });
    });

    const result = await getReviewbotAdminDashboard({
      env: baseEnv(),
      fetchImpl,
      now: futureDate,
      walletAuthJwt: createJwt(allowedWallet),
    });

    expect(result).toMatchObject({
      status: "ok",
      dashboard: {
        totals: {
          uniquePrs: 3,
          averageCostPerPrUsd: 4,
        },
        summary: {
          status: "ok",
          data: {
            analysis: {
              budgetSkipRate: 25,
              topCostPr: {
                prAuthor: "ragnep",
                costSharePercent: 66.67,
              },
            },
            byPrAuthor: [{ key: "ragnep" }],
            byPr: [
              {
                latestHeadSha: "abcdef1234567890",
              },
            ],
          },
        },
      },
    });
  });
});
