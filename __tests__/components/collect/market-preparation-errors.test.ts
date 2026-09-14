import { marketPreparationError } from "@/components/collect/market-preparation-errors";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: () => null,
  getStagingAuth: () => null,
}));

const PRIVATE_DETAIL = "private-provider-payload-and-url";
const apiError = (status: number, code?: string, bodyAsObject = false) => {
  const body = { code, message: PRIVATE_DETAIL };
  return Object.assign(new Error(PRIVATE_DETAIL), {
    status,
    response: { body: bodyAsObject ? body : JSON.stringify(body) },
  });
};
const cases: readonly [unknown, MessageKey][] = [
  [apiError(401), "collect.error.prepareAuth"],
  [apiError(403, "ORDER_MISMATCH"), "collect.error.prepareAuth"],
  [apiError(429), "collect.error.prepareRateLimited"],
  [apiError(503, "PROVIDER_UNAVAILABLE"), "collect.error.prepareService"],
  [apiError(502, "UNKNOWN_CODE"), "collect.error.prepareService"],
  [apiError(400), "collect.error.prepareDetails"],
  [apiError(409, "AMOUNT_MISMATCH"), "collect.error.prepareTerms"],
  [apiError(409, "UNSUPPORTED_ZONE", true), "collect.error.prepareUnsupported"],
  [
    apiError(409, "RECIPIENT_SCOPE_CHANGED"),
    "collect.error.prepareRecipientChanged",
  ],
  [new Error("MARKET_REVIEW_MISMATCH"), "collect.trade.checkFailed"],
  [
    new Error("MARKET_CONNECTION_CHANGED"),
    "collect.error.prepareConnectionChanged",
  ],
  [
    new Error("MARKET_RECOVERY_STORAGE_UNAVAILABLE"),
    "collect.trade.storageUnavailable",
  ],
  [new Error("MARKET_EXECUTION_ALREADY_ACTIVE"), "collect.trade.lockActive"],
  [new Error("MARKET_BROADCAST_UNKNOWN"), "collect.trade.broadcastUnknown"],
  [new Error("MARKET_OFFER_LIMIT_EXCEEDED"), "collect.error.offerLimit"],
  [new TypeError("Failed to fetch"), "collect.error.prepareNetwork"],
  [new TypeError("Load failed"), "collect.error.prepareNetwork"],
  [
    new TypeError("NetworkError when attempting to fetch resource."),
    "collect.error.prepareNetwork",
  ],
  [new Error(PRIVATE_DETAIL), "collect.error.prepare"],
  [new TypeError(PRIVATE_DETAIL), "collect.error.prepare"],
  [PRIVATE_DETAIL, "collect.error.prepare"],
  [new Error("toString"), "collect.error.prepare"],
  [null, "collect.error.prepare"],
];

it.each(cases)("classifies %p without exposing response text", (error, key) => {
  const message = marketPreparationError(error, "en-US");
  expect(message).toBe(t("en-US", key));
  expect(message).not.toContain(PRIVATE_DETAIL);
});

it("does not let a server error message impersonate a local validation failure", () => {
  const error = Object.assign(new Error("MARKET_REVIEW_MISMATCH"), {
    status: 503,
    response: { body: "not-json" },
  });
  expect(marketPreparationError(error, "en-US")).toBe(
    t("en-US", "collect.error.prepareService")
  );
});

it.each(SUPPORTED_LOCALES)(
  "keeps preparation messages available in %s",
  (locale) => {
    for (const [error, key] of cases) {
      const message = marketPreparationError(error, locale);
      expect(message).toBe(t(locale, key));
      expect(message).not.toBe(key);
      expect(message.length).toBeGreaterThan(0);
    }
  }
);

describe("actual common-api failure handling", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("classifies normalized fetch/CORS failure without exposing the request URL", async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));
    const failure = await commonApiPost({
      endpoint: `market/operations/${PRIVATE_DETAIL}`,
      body: {},
      errorMode: "structured",
    }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    expect(marketPreparationError(failure, "en-US")).toBe(
      t("en-US", "collect.error.prepareNetwork")
    );
    expect(marketPreparationError(failure, "en-US")).not.toContain(
      PRIVATE_DETAIL
    );
  });

  it("uses the structured status and code returned by common-api", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      statusText: "Conflict",
      headers: new Headers(),
      text: async () =>
        JSON.stringify({
          code: "RECIPIENT_SCOPE_CHANGED",
          message: PRIVATE_DETAIL,
        }),
    });
    const failure = await commonApiPost({
      endpoint: "market/operations",
      body: {},
      errorMode: "structured",
    }).catch((error: unknown) => error);
    expect(marketPreparationError(failure, "en-US")).toBe(
      t("en-US", "collect.error.prepareRecipientChanged")
    );
  });
});
