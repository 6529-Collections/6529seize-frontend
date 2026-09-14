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
