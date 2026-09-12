import {
  collectPlanReviewFingerprint,
  collectPlanReviewLegs,
} from "@/components/collect/collect-plan-review.helpers";
import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";
import { scenarioPlan } from "./collect-plan-scenarios.fixture";

it("returns original authoritative legs for an exact subset, without mutating the full plan", () => {
  const plan = scenarioPlan();
  const first = plan.result.legs[0]!;
  const second = {
    ...first,
    candidate_id: "second",
    order_id: `0x${"2".repeat(64)}`,
    asset_key: first.asset_key.replace(/:1$/, ":2"),
  };
  plan.result.legs.push(second);
  const before = JSON.stringify(plan);
  const result = collectPlanReviewLegs(plan, [{ ...second }]);
  expect(result).toEqual([second]);
  expect(result[0]).toBe(second);
  expect(JSON.stringify(plan)).toBe(before);
});

it.each<Partial<ApiCollectPlanLeg>>([
  { candidate_id: "other" },
  { order_id: `0x${"3".repeat(64)}` },
  { asset_key: "1:other:1" },
  { quantity: "2" },
  { unit_price_wei: "1" },
])("rejects a forged subset leg %j", (change) => {
  const plan = scenarioPlan();
  expect(
    collectPlanReviewLegs(plan, [{ ...plan.result.legs[0]!, ...change }])
  ).toEqual([]);
});

it("rejects a repeated listing or a missing previously quoted price without silently keeping other rows", () => {
  const plan = scenarioPlan();
  const leg = plan.result.legs[0]!;
  expect(collectPlanReviewLegs(plan, [leg, { ...leg }])).toEqual([]);
  const unpriced = { ...leg };
  delete unpriced.unit_price_wei;
  expect(collectPlanReviewLegs(plan, [unpriced])).toEqual([]);
});

it.each([
  "id",
  "revision",
  "profile",
  "membership",
  "recipient",
  "price",
  "quantity",
  "order",
  "asset",
] as const)("changes the review binding when %s changes", (field) => {
  const plan = scenarioPlan();
  const before = collectPlanReviewFingerprint(plan);
  const leg = plan.result.legs[0]!;
  switch (field) {
    case "id":
      plan.id = "other";
      break;
    case "revision":
      plan.revision = "other";
      break;
    case "profile":
      plan.profile_id = "other";
      break;
    case "membership":
      plan.analysis.account.membership_hash = "other";
      break;
    case "recipient":
      plan.result.recipient = `0x${"3".repeat(40)}`;
      break;
    case "price":
      leg.unit_price_wei = "1";
      break;
    case "quantity":
      leg.quantity = "2";
      break;
    case "order":
      leg.order_id = `0x${"3".repeat(64)}`;
      break;
    case "asset":
      leg.asset_key = leg.asset_key.replace(/:1$/, ":2");
      break;
  }
  expect(collectPlanReviewFingerprint(plan)).not.toBe(before);
});
