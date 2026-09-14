import { fireEvent, render, screen, within } from "@testing-library/react";
import CollectPlanPanel from "@/components/collect/CollectPlanPanel";
import { collectCostPlanView } from "@/components/collect/collect-plan.adapters";
import {
  scenarioPlan,
  scenarioProfile,
} from "./collect-plan-scenarios.fixture";

test("leads with actionable missing NFTs and collapses owned holdings", () => {
  const plan = collectCostPlanView(
    scenarioPlan(),
    scenarioProfile,
    "Season 4",
    "en-US"
  )!;
  const onReview = jest.fn(),
    onPlanOffers = jest.fn(),
    onScenarioChange = jest.fn();
  const { container } = render(
    <CollectPlanPanel
      plan={plan}
      locale="en-US"
      onReview={onReview}
      onPlanOffers={onPlanOffers}
      onScenarioChange={onScenarioChange}
    />
  );
  expect(screen.getByText("BOOM")).toBeVisible();
  expect(screen.getByText("The OMen")).not.toBeVisible();
  expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  expect(screen.getByText("Collect 1")).toBeVisible();
  expect(
    screen.getByRole("group", { name: "Collection requirements" })
  ).toBeVisible();
  expect(container.querySelectorAll("[class*='overflow-y']")).toHaveLength(0);
  fireEvent.click(
    screen.getByRole("button", { name: /Available for your goal/ })
  );
  expect(onScenarioChange).toHaveBeenCalledWith("available");
  fireEvent.click(screen.getByRole("button", { name: "Collect now" }));
  expect(onReview).toHaveBeenCalledWith(plan.id, plan.revision);
  fireEvent.click(screen.getByRole("button", { name: "Make offers" }));
  expect(onPlanOffers).toHaveBeenCalledTimes(1);
});

test("puts purchasable NFTs first, then outside-budget listings, preserving canonical order within each group", () => {
  const base = collectCostPlanView(
    scenarioPlan(),
    scenarioProfile,
    "Gradients",
    "en-US"
  )!;
  const plan = {
    ...base,
    requirements: [
      {
        id: "zero",
        label: "Gradient 0",
        detail: "Missing",
        status: "missing" as const,
      },
      {
        id: "one",
        label: "Gradient 1",
        detail: "Missing",
        status: "missing" as const,
      },
      {
        id: "outside",
        label: "Outside budget",
        detail: "Missing",
        status: "missing" as const,
        priceLabel: "1 ETH",
      },
      {
        id: "available",
        label: "Available purchase",
        detail: "Missing",
        status: "selected" as const,
        priceLabel: "0.1 ETH",
      },
    ],
  };
  render(<CollectPlanPanel plan={plan} locale="en-US" onReview={jest.fn()} />);
  const rows = within(
    screen.getByRole("group", { name: "Collection requirements" })
  ).getAllByRole("listitem");
  expect(rows.map((item) => item.textContent)).toEqual([
    expect.stringContaining("Available purchase"),
    expect.stringContaining("Outside budget"),
    expect.stringContaining("Gradient 0"),
    expect.stringContaining("Gradient 1"),
  ]);
});
