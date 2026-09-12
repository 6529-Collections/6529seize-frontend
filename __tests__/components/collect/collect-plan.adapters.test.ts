import {
  collectCostPlanView,
  collectPlanForScenario,
} from "@/components/collect/collect-plan.adapters";
import { ApiCollectPlanStateEnum } from "@/generated/models/ApiCollectPlan";
import {
  scenarioPlan,
  scenarioProfile,
} from "./collect-plan-scenarios.fixture";

test("keeps capped purchases as the default while showing the full-goal option", () => {
  const source = scenarioPlan();
  const view = collectCostPlanView(
    source,
    scenarioProfile,
    "Season 4",
    "en-US"
  )!;
  expect(view.totalLabel).toBe("0.11 ETH");
  expect(view.purchaseTotalLabel).toBe("0.1 ETH");
  expect(view.gasReserveLabel).toBe("0.01 ETH");
  expect(view.requirements[0]).toMatchObject({
    availabilityLabel: "2 priced for your goal",
    purchaseLabel: "Collect 1",
    priceLabel: "0.1 ETH",
  });
  expect(view.scenarios?.map((option) => option.priceLabel)).toEqual([
    "0.11 ETH",
    "0.21 ETH",
  ]);
  expect(collectPlanForScenario(source, "budget")).toBe(source);
});

test("switches both displayed and reviewable quantities only on explicit scenario selection", () => {
  const source = scenarioPlan();
  const selected = collectPlanForScenario(source, "available");
  expect(selected.result).toBe(source.available_result);
  expect(selected.id).toBe(source.id);
  expect(selected.revision).toBe(source.revision);
  const view = collectCostPlanView(
    source,
    scenarioProfile,
    "Season 4",
    "en-US",
    "available"
  )!;
  expect(view.totalLabel).toBe("0.21 ETH");
  expect(view.requirements[0]?.purchaseLabel).toBe("Collect 2");
  expect(view.outcomeLabel).toBe(
    "After this purchase: 2 of 2 requirements complete"
  );
  expect(source.result.legs[0]?.quantity).toBe("1");
});

test("distinguishes purchases outside the budget from missing price evidence", () => {
  const source = scenarioPlan();
  source.result = { ...source.result, legs: [], total_cost_wei: "0" };
  let view = collectCostPlanView(source, scenarioProfile, "Season", "en-US")!;
  expect(view.requirements[0]).toMatchObject({
    purchaseLabel: "Outside this budget",
    priceLabel: "0.2 ETH",
  });
  source.available_result = {
    ...source.available_result!,
    legs: [],
    total_cost_wei: "0",
  };
  view = collectCostPlanView(source, scenarioProfile, "Season", "en-US")!;
  expect(view.requirements[0]?.availabilityLabel).toBe("No purchase priced");
  expect(view.requirements[0]?.priceLabel).toBeUndefined();
});

test("keeps different trait alternatives in each scenario's exact portfolio", () => {
  const source = scenarioPlan();
  const budgetLeg = source.result.legs[0]!;
  const availableLeg = {
    ...source.available_result!.legs[0]!,
    candidate_id: "other-trait-alternative",
    order_id: `0x${"b".repeat(64)}`,
    asset_key: "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:999",
  };
  source.analysis.requirements[0]!.asset_keys.push(availableLeg.asset_key);
  source.available_result!.legs = [availableLeg];

  expect(collectPlanForScenario(source, "budget").result.legs).toEqual([
    budgetLeg,
  ]);
  expect(collectPlanForScenario(source, "available").result.legs).toEqual([
    availableLeg,
  ]);
  expect(
    collectCostPlanView(source, scenarioProfile, "Trait goal", "en-US")
      ?.requirements[0]?.priceLabel
  ).toBe("0.1 ETH");
  expect(
    collectCostPlanView(
      source,
      scenarioProfile,
      "Trait goal",
      "en-US",
      "available"
    )?.requirements[0]?.priceLabel
  ).toBe("0.2 ETH");
});

test("supports older API responses and never invents a missing price", () => {
  const source = scenarioPlan();
  delete source.available_result;
  delete source.budget_wei;
  delete source.result.legs[0]!.unit_price_wei;
  const view = collectCostPlanView(source, scenarioProfile, "Season", "en-US")!;
  expect(view.scenarios).toBeUndefined();
  expect(view.requirements[0]?.priceLabel).toBeUndefined();
  expect(view.purchaseTotalLabel).toBeUndefined();
  expect(collectPlanForScenario(source, "available")).toBe(source);
});

test("retains profile, stale and external-delivery safety boundaries", () => {
  const source = scenarioPlan();
  expect(
    collectCostPlanView(
      source,
      { ...scenarioProfile, id: "other" },
      "Season",
      "en-US"
    )
  ).toBeNull();
  source.state = ApiCollectPlanStateEnum.Stale;
  expect(
    collectCostPlanView(source, scenarioProfile, "Season", "en-US", "available")
      ?.reviewDisabledReason
  ).toBeTruthy();
  source.analysis.counts_toward_profile = false;
  expect(
    collectCostPlanView(source, scenarioProfile, "Season", "en-US")
      ?.outcomeLabel
  ).toBe(
    "Delivery outside this profile does not complete its collecting goal."
  );
});
