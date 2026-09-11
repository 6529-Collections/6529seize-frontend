import {
  collectRuleRemaining,
  collectRuleDeadlineFromPlan,
  collectRuleTargetsFromPlan,
  collectRuleTrade,
  ruleUnitPrice,
} from "@/components/collect/collect-rules.helpers";
import { MARKET_ZERO } from "@/components/collect/market-validation";
import type { ApiCollectRule } from "@/generated/models/ApiCollectRule";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";

const observedAt = 1800000000000;
const target = {
  asset_key: "1:nft:1",
  target_quantity: "3",
  maximum_unit_price_wei: "100",
};
const rule = {
  state: "ACTIVE",
  pending_review: null,
  definition: {
    profile_id: "profile",
    funding_wallet: "funding",
    recipient: "recipient",
    expires_at: observedAt + 86400000,
  },
  acquired: [{ asset_key: target.asset_key, quantity: "1" }],
} as ApiCollectRule;
function listing(
  quantity: string,
  total: string,
  hash = "order"
): ApiMarketTradeOrder {
  return {
    quantity,
    total_wei: total,
    currency: MARKET_ZERO,
    identity: { protocol_address: "protocol", order_hash: hash },
  } as ApiMarketTradeOrder;
}
it("freezes saved bounds directly from a large plan without one provider call per asset", () => {
  const legs = Array.from({ length: 600 }, (_, index) => ({
    asset_key: `1:nft:${index + 1}`,
    quantity: "1",
    unit_price_wei: "100",
  }));
  const plan = { result: { legs } } as ApiCollectPlan;
  const targets = collectRuleTargetsFromPlan(plan);
  expect(targets).toHaveLength(600);
  expect(targets[0]).toEqual({
    asset_key: "1:nft:1",
    target_quantity: "1",
    maximum_unit_price_wei: "100",
  });
});
it("requires a refreshed plan when an older response has no verified unit price", () => {
  const plan = {
    result: { legs: [{ asset_key: "1:nft:1", quantity: "1" }] },
  } as ApiCollectPlan;
  expect(() => collectRuleTargetsFromPlan(plan)).toThrow("RULE_PLAN_REFRESH");
});
it("uses monotonic rule acquisitions rather than refilling after a transfer", () => {
  expect(collectRuleRemaining(rule, target)).toBe(2n);
});
it("selects an affordable exact listing and caps quantity to the unacquired target", () => {
  const request = collectRuleTrade(
    rule,
    target,
    [listing("5", "450", "affordable"), listing("1", "101", "expensive")],
    true,
    observedAt
  );
  expect(request).toMatchObject({
    profile_id: "profile",
    wallet: "funding",
    recipient: "recipient",
    quantity: "2",
    amount_wei: "180",
    acknowledge_external_recipient: true,
    order: { order_hash: "affordable" },
  });
});
it("refuses another prepare while an operation is pending", () => {
  expect(() =>
    collectRuleTrade(
      { ...rule, pending_review: { operation_id: "one" } } as ApiCollectRule,
      target,
      [listing("1", "100")],
      false,
      observedAt
    )
  ).toThrow("RULE_INACTIVE");
});
it("refuses paused rules and listings above the saved unit limit", () => {
  expect(() =>
    collectRuleTrade(
      { ...rule, state: "PAUSED" } as ApiCollectRule,
      target,
      [listing("1", "100")],
      false,
      observedAt
    )
  ).toThrow("RULE_INACTIVE");
  expect(() =>
    collectRuleTrade(rule, target, [listing("1", "101")], false, observedAt)
  ).toThrow("RULE_NO_MATCH");
});
it("uses the plan and order server timestamps despite a device clock change", () => {
  const clock = jest
    .spyOn(Date, "now")
    .mockReturnValue(observedAt + 400 * 86400000);
  try {
    expect(collectRuleDeadlineFromPlan({ updated_at: observedAt })).toBe(
      observedAt + 7 * 86400000
    );
    expect(
      collectRuleTrade(rule, target, [listing("1", "100")], false, observedAt)
        .quantity
    ).toBe("1");
    clock.mockReturnValue(0);
    expect(() =>
      collectRuleTrade(
        rule,
        target,
        [listing("1", "100")],
        false,
        rule.definition.expires_at
      )
    ).toThrow("RULE_INACTIVE");
  } finally {
    clock.mockRestore();
  }
});
it.each([NaN, Infinity, 0, -1, 1.5, 8640000000000000])(
  "requires a valid server plan timestamp (%s)",
  (updated_at) => {
    expect(() => collectRuleDeadlineFromPlan({ updated_at })).toThrow(
      "RULE_PLAN_REFRESH"
    );
  }
);
it.each([NaN, Infinity, 0, -1, 1.5])(
  "rejects a missing or invalid server order observation (%s)",
  (at) => {
    expect(() =>
      collectRuleTrade(rule, target, [listing("1", "100")], false, at)
    ).toThrow("RULE_INACTIVE");
  }
);
it("preserves exact integer arithmetic and rejects fractional unit rounding", () => {
  expect(ruleUnitPrice(listing("1", "9007199254740993123456"))).toBe(
    9007199254740993123456n
  );
  expect(() => ruleUnitPrice(listing("3", "100"))).toThrow(
    "RULE_UNSUPPORTED_ORDER"
  );
});
