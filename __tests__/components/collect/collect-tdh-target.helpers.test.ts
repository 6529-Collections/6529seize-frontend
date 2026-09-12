import {
  collectTdhTargetRequest,
  collectTdhTargetSelection,
  validateCollectTdhTargetPlan,
} from "@/components/collect/collect-tdh-target.helpers";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import { GRADIENT_CONTRACT } from "@/constants/constants";
import { ApiCollectTdhTargetRequestTargetModeEnum } from "@/generated/models/ApiCollectTdhTargetRequest";
import {
  ApiCollectTdhTargetPlanStatusEnum,
  type ApiCollectTdhTargetPlan,
} from "@/generated/models/ApiCollectTdhTargetPlan";
import {
  TARGET_NOW,
  TARGET_FREN,
  TARGET_PRIMARY,
  targetPlan,
  targetProfile,
  targetRequest,
} from "./collect-tdh-target.fixture";

it("builds total-target Memes request with an optional exact purchase budget", () => {
  const draft = {
    targetTdh: "00150",
    horizonDays: 30 as const,
    family: ApiCollectFamily.Memes,
    mode: "total" as const,
    budgetEth: "",
  };
  expect(collectTdhTargetRequest(draft, targetProfile, TARGET_PRIMARY)).toEqual(
    targetRequest()
  );
  expect(
    collectTdhTargetRequest(
      { ...draft, mode: "additional", budgetEth: "0.000000000000000001" },
      targetProfile,
      TARGET_PRIMARY
    )
  ).toMatchObject({ target_mode: "ADDITIONAL_OVER_BASELINE", budget_wei: "1" });
  expect(() =>
    collectTdhTargetRequest(draft, targetProfile, TARGET_FREN)
  ).toThrow();
});
it("keeps exact selected orders, quantity and included fees without adding fees twice", () => {
  const plan = targetPlan();
  expect(() =>
    validateCollectTdhTargetPlan(plan, targetRequest(), targetProfile)
  ).not.toThrow();
  expect(collectTdhTargetSelection(plan, targetProfile, TARGET_NOW)).toEqual([
    { asset: plan.items[0]!.asset, order: plan.items[0]!.order, quantity: "2" },
  ]);
});
it("compares additional target to future baseline and supports no purchase needed", () => {
  const plan = targetPlan({
    ...targetRequest(),
    target_mode:
      ApiCollectTdhTargetRequestTargetModeEnum.AdditionalOverBaseline,
    target_tdh: "50",
  });
  plan.target_total_tdh = "150";
  expect(() =>
    validateCollectTdhTargetPlan(plan, plan.request, targetProfile)
  ).not.toThrow();
  plan.request.target_tdh = "0";
  plan.target_total_tdh = "100";
  plan.status = ApiCollectTdhTargetPlanStatusEnum.NoPurchaseNeeded;
  plan.items = [];
  plan.projection.recipient_allocations = [];
  plan.projection.proposed = plan.projection.baseline;
  plan.purchase_cost_wei =
    plan.signed_fees_wei =
    plan.gas_estimate_wei =
    plan.funding_estimate_wei =
      "0";
  expect(() =>
    validateCollectTdhTargetPlan(plan, plan.request, targetProfile)
  ).not.toThrow();
  expect(() =>
    collectTdhTargetSelection(plan, targetProfile, TARGET_NOW)
  ).toThrow();
});
it("accepts a partial plan without pretending it meets the target", () => {
  const plan = targetPlan({ ...targetRequest(), target_tdh: "200" });
  plan.status = ApiCollectTdhTargetPlanStatusEnum.NotFoundWithinSearch;
  plan.shortfall_tdh = "40";
  expect(() =>
    validateCollectTdhTargetPlan(plan, plan.request, targetProfile)
  ).not.toThrow();
});
const changedPlans: [string, (plan: ApiCollectTdhTargetPlan) => void][] = [
  [
    "request target",
    (plan) => {
      plan.request.target_tdh = "999";
    },
  ],
  [
    "wallet scope",
    (plan) => {
      plan.projection.account.wallets = [TARGET_PRIMARY];
    },
  ],
  [
    "projection horizon",
    (plan) => {
      plan.projection.horizon_days = 1;
    },
  ],
  [
    "string projection horizon",
    (plan) => {
      Object.assign(plan.projection, { horizon_days: "30" });
    },
  ],
  [
    "gift recipient",
    (plan) => {
      plan.items[0]!.recipient = TARGET_FREN;
    },
  ],
  [
    "NFT substitution",
    (plan) => {
      plan.items[0]!.asset.token_id = "2";
    },
  ],
  [
    "overstated projected acquisition",
    (plan) => {
      plan.projection.recipient_allocations[0]!.quantity = "3";
    },
  ],
  [
    "fees added twice",
    (plan) => {
      plan.purchase_cost_wei = "202000000000000000";
    },
  ],
  [
    "fee mismatch",
    (plan) => {
      plan.signed_fees_wei = "1";
    },
  ],
  [
    "fee-indivisible quantity",
    (plan) => {
      plan.items[0]!.order.quantity = "3";
      plan.items[0]!.order.fees[0]!.amount_wei = "1";
    },
  ],
  [
    "duplicate order",
    (plan) => {
      plan.items.push(plan.items[0]!);
    },
  ],
  [
    "gas included without gas quote",
    (plan) => {
      plan.funding_estimate_wei = plan.purchase_cost_wei;
    },
  ],
];
it.each(changedPlans)(
  "rejects %s before displaying or forwarding the plan",
  (_name, mutate) => {
    const plan = targetPlan();
    mutate(plan);
    expect(() =>
      validateCollectTdhTargetPlan(plan, targetRequest(), targetProfile)
    ).toThrow();
  }
);
it("does not advance expired or profile-owned listings to purchase review", () => {
  const plan = targetPlan();
  expect(() =>
    collectTdhTargetSelection(plan, targetProfile, TARGET_NOW + 60_000)
  ).toThrow();
  plan.items[0]!.order.maker = TARGET_PRIMARY;
  expect(() =>
    collectTdhTargetSelection(plan, targetProfile, TARGET_NOW)
  ).toThrow();
});

it("aggregates multiple exact Memes orders into one projected acquisition", () => {
  const plan = targetPlan();
  const first = plan.items[0]!;
  first.quantity = "1";
  plan.items.push({
    ...first,
    order: {
      ...first.order,
      identity: { ...first.order.identity, order_hash: `0x${"b".repeat(64)}` },
    },
  });
  expect(() =>
    validateCollectTdhTargetPlan(plan, plan.request, targetProfile)
  ).not.toThrow();
  expect(
    collectTdhTargetSelection(plan, targetProfile, TARGET_NOW)
  ).toHaveLength(2);
});

it("rejects two purchase orders for the same ERC721 even when prices and projected quantities sum", () => {
  const plan = targetPlan();
  const first = plan.items[0]!;
  first.quantity = "1";
  first.asset.family = ApiCollectFamily.Gradients;
  first.asset.contract = GRADIENT_CONTRACT;
  first.asset.asset_key = `1:${GRADIENT_CONTRACT.toLowerCase()}:1`;
  first.order.asset_key = first.asset.asset_key;
  plan.request.families = [ApiCollectFamily.Gradients];
  plan.projection.recipient_allocations[0]!.asset_key = first.asset.asset_key;
  plan.items.push({
    ...first,
    order: {
      ...first.order,
      identity: { ...first.order.identity, order_hash: `0x${"b".repeat(64)}` },
    },
  });
  expect(() =>
    validateCollectTdhTargetPlan(plan, plan.request, targetProfile)
  ).toThrow();
});
