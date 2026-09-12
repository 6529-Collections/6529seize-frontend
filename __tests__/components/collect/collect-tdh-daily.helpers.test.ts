import {
  collectDailyTdhEstimate,
  collectDailyTdhRequest,
  collectDailyTdhSelection,
  validateCollectDailyTdhPlan,
  validCollectDailyInput,
} from "@/components/collect/collect-tdh-daily.helpers";
import { ApiCollectDailyTdhRequestModeEnum } from "@/generated/models/ApiCollectDailyTdhRequest";
import { dailyPlan, dailyRequest } from "./collect-tdh-daily.fixture";
import {
  targetProfile,
  TARGET_CUSTODY,
  TARGET_FREN,
  TARGET_NOW,
} from "./collect-tdh-target.fixture";

it("builds exact hundredths and wei from the driving field only", () => {
  expect(
    collectDailyTdhRequest(
      { mode: "daily_tdh", value: "1.25" },
      targetProfile,
      TARGET_CUSTODY,
      "memes"
    )
  ).toEqual({
    ...dailyRequest(),
    recipient: TARGET_CUSTODY,
    target_base_tdh_per_day_hundredths: "125",
  });
  expect(
    collectDailyTdhRequest(
      { mode: "budget", value: "0.000000000000000001" },
      targetProfile,
      TARGET_CUSTODY,
      "memes"
    )
  ).toEqual({
    profile_id: targetProfile.id,
    recipient: TARGET_CUSTODY,
    families: ["memes"],
    mode: ApiCollectDailyTdhRequestModeEnum.EthBudget,
    budget_wei: "1",
  });
  expect(() =>
    collectDailyTdhRequest(
      { mode: "budget", value: "1" },
      targetProfile,
      TARGET_FREN,
      "memes"
    )
  ).toThrow();
});
it.each(["0", "-1", "1.001", "1e3", "01", "90071992547409.92"])(
  "rejects unsupported daily rate %s",
  (value) =>
    expect(validCollectDailyInput({ mode: "daily_tdh", value })).toBe(false)
);
it("validates current exact multi-edition acquisitions and preserves actual amounts", () => {
  const plan = dailyPlan();
  expect(() =>
    validateCollectDailyTdhPlan(plan, dailyRequest(), targetProfile, TARGET_NOW)
  ).not.toThrow();
  expect(collectDailyTdhSelection(plan, targetProfile, TARGET_NOW)).toEqual(
    plan.items.map(({ asset, order, quantity }) => ({ asset, order, quantity }))
  );
  expect(collectDailyTdhEstimate(plan)).toMatchObject({
    dailyTdh: "2",
    purchaseEth: "0.2",
  });
});

it("rounds the derived ETH input upward for display without changing the exact basket", () => {
  const plan = dailyPlan();
  plan.purchase_cost_wei = "200000000000000010";
  const estimate = collectDailyTdhEstimate(plan);
  expect(estimate.purchaseEth).toBe("0.2001");
  expect(estimate.payload.purchase_cost_wei).toBe("200000000000000010");
});
it.each([
  [
    "profile",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.request.profile_id = "other";
    },
  ],
  [
    "recipient",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.request.recipient = TARGET_CUSTODY;
    },
  ],
  [
    "family",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.request.families = [];
    },
  ],
  [
    "target",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.request.target_base_tdh_per_day_hundredths = "201";
    },
  ],
  [
    "price",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.purchase_cost_wei = "1";
    },
  ],
  [
    "fee",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.signed_fees_wei = "0";
    },
  ],
  [
    "net",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.items[0]!.order.net_wei = "1";
    },
  ],
  [
    "quantity",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.items[0]!.quantity = "4";
    },
  ],
  [
    "allocation",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.items[0]!.recipient = TARGET_CUSTODY;
    },
  ],
  [
    "own order",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.items[0]!.order.maker = TARGET_CUSTODY;
    },
  ],
  [
    "duplicate",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.items.push(plan.items[0]!);
    },
  ],
  [
    "expired",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.valid_until = new Date(TARGET_NOW - 1).toISOString();
    },
  ],
  [
    "shortfall",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.shortfall_base_tdh_per_day_hundredths = "1";
    },
  ],
  [
    "gas",
    (plan: ReturnType<typeof dailyPlan>) => {
      plan.gas_estimate_wei = "0";
      plan.funding_estimate_wei = "0";
    },
  ],
] as const)("rejects mismatched %s", (_label, mutate) => {
  const plan = dailyPlan();
  mutate(plan);
  expect(() =>
    validateCollectDailyTdhPlan(plan, dailyRequest(), targetProfile, TARGET_NOW)
  ).toThrow();
});
it("keeps the ETH purchase budget binding and verifies exact remainder", () => {
  const request = {
    ...dailyRequest(),
    mode: ApiCollectDailyTdhRequestModeEnum.EthBudget,
    budget_wei: "300000000000000000",
  };
  delete request.target_base_tdh_per_day_hundredths;
  const plan = {
    ...dailyPlan(request),
    shortfall_base_tdh_per_day_hundredths: null,
    remaining_budget_wei: "100000000000000000",
  };
  expect(() =>
    validateCollectDailyTdhPlan(plan, request, targetProfile, TARGET_NOW)
  ).not.toThrow();
  plan.remaining_budget_wei = "0";
  expect(() =>
    validateCollectDailyTdhPlan(plan, request, targetProfile, TARGET_NOW)
  ).toThrow();
});
it("allows a genuine negative personal daily-rate change and distinguishes it from stock", () => {
  const plan = dailyPlan();
  plan.personal_effects.proposed_boosted_tdh_per_day_ten_thousandths = "9000";
  plan.personal_effects.additional_boosted_tdh_per_day_ten_thousandths =
    "-1000";
  plan.personal_effects.changed_boost_on_existing_tdh = -300;
  expect(() =>
    validateCollectDailyTdhPlan(plan, dailyRequest(), targetProfile, TARGET_NOW)
  ).not.toThrow();
  plan.personal_effects.additional_boosted_tdh_per_day_ten_thousandths = "1000";
  expect(() =>
    validateCollectDailyTdhPlan(plan, dailyRequest(), targetProfile, TARGET_NOW)
  ).toThrow();
});
