import { fireEvent, render, screen } from "@testing-library/react";
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
