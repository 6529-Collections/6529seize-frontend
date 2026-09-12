import CollectTdhDailyResults from "@/components/collect/CollectTdhDailyResults";
import { render, screen, within } from "@testing-library/react";
import { dailyPlan } from "./collect-tdh-daily.fixture";

it("represents an unsupported line amount as unavailable, never as free", () => {
  const plan = dailyPlan();
  plan.items[0]!.quantity = "0";
  render(<CollectTdhDailyResults plan={plan} onReview={jest.fn()} />);
  const row = screen
    .getByRole("link", { name: "Target artwork", exact: true })
    .closest("li")!;
  expect(within(row).getByText("—")).toBeVisible();
  expect(within(row).queryByText("0 ETH")).not.toBeInTheDocument();
});
