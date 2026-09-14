import { marketExecutionError } from "@/components/collect/market-execution-errors";
import { t } from "@/i18n/messages";

it.each([
  ["MARKET_WALLET_NOT_READY", "collect.trade.walletNotReady"],
  ["MARKET_CONNECTION_CHANGED", "collect.error.prepareConnectionChanged"],
  ["MARKET_WRONG_CHAIN", "collect.trade.wrongChain"],
  ["MARKET_GAS_CAP_CHANGED", "collect.trade.gasChanged"],
  ["MARKET_SUBMISSION_PENDING", "collect.trade.submissionPending"],
  ["MARKET_BROADCAST_UNKNOWN", "collect.trade.broadcastUnknown"],
] as const)("classifies %s without displaying raw error text", (code, key) => {
  expect(marketExecutionError(new Error(code), "en-US")).toBe(t("en-US", key));
});

it("recognizes explicit nested wallet rejection while keeping generic transport failures unknown", () => {
  expect(
    marketExecutionError(
      { cause: { code: 4001, message: "private wallet text" } },
      "en-US"
    )
  ).toBe(t("en-US", "collect.trade.walletRejected"));
  expect(
    marketExecutionError(new Error("private RPC text"), "en-US")
  ).not.toContain("private");
});

it("uses allowlisted API errors without exposing raw response bodies", () => {
  const error = Object.assign(new Error("secret URL"), {
    status: 409,
    response: {
      status: 409,
      body: { code: "OPERATION_CHANGED", message: "secret payload" },
    },
  });
  const result = marketExecutionError(error, "en-US");
  expect(result).not.toContain("secret");
  expect(result).toBe(t("en-US", "collect.trade.refreshRequired"));
});

it.each([
  ["preparing", "collect.trade.preflightFailed"],
  ["wallet", "collect.trade.walletFailed"],
  ["signature", "collect.trade.walletFailed"],
  ["publishing", "collect.trade.publishFailed"],
  ["submitted", "collect.trade.recoveryFailed"],
  ["reconciling", "collect.trade.recoveryFailed"],
] as const)(
  "classifies an ordinary failure during %s by its actual phase",
  (stage, key) => {
    expect(
      marketExecutionError(new Error("private RPC URL"), "en-US", stage)
    ).toBe(t("en-US", key));
  }
);

it("preserves ambiguous-broadcast recovery regardless of the last displayed phase", () => {
  expect(
    marketExecutionError(
      new Error("MARKET_BROADCAST_UNKNOWN"),
      "en-US",
      "preparing"
    )
  ).toBe(t("en-US", "collect.trade.broadcastUnknown"));
});

it.each(["submitted", "reconciling"] as const)(
  "keeps payload mismatches during %s in recovery",
  (stage) => {
    expect(
      marketExecutionError(new Error("MARKET_REVIEW_MISMATCH"), "en-US", stage)
    ).toBe(t("en-US", "collect.trade.recoveryFailed"));
  }
);
it("does not describe a rejected published signature as an unsent wallet request", () => {
  const error = Object.assign(new Error("private details"), {
    status: 400,
    response: { status: 400, body: { code: "INVALID_SIGNATURE" } },
  });
  expect(marketExecutionError(error, "en-US", "publishing")).toBe(
    t("en-US", "collect.trade.publishFailed")
  );
});
