import CollectPageView from "@/components/collect/CollectPageView";
import type { CollectPlanView } from "@/components/collect/collect.types";
import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/components/collect/CollectPlanPanel", () => ({
  __esModule: true,
  default: () => <div>Plan results</div>,
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const plan: CollectPlanView = {
  id: "plan",
  revision: "1",
  title: "Full set",
  profile: { id: "profile", displayName: "Collector" },
  coverageLabel: "1 of 2",
  snapshotLabel: "Current",
  requirements: [],
  totalLabel: "0.1 ETH",
  blockers: [],
  assumptions: [],
};
it("compacts ready setup without losing the edited draft and keeps focus reachable", () => {
  const props: ComponentProps<typeof CollectPageView> = {
    catalog: { status: "ready", items: [], hasMore: false },
    collection: "memes",
    intent: "full_set",
    profile: null,
    plan: null,
    goalContent: <input aria-label="Goal budget" defaultValue="2.5" />,
    onCollectionChange: jest.fn(),
    onIntentChange: jest.fn(),
    onConnect: jest.fn(),
    onRetry: jest.fn(),
    onLoadMore: jest.fn(),
    onTrade: jest.fn(),
    onReviewPlan: jest.fn(),
  };
  const { rerender } = render(<CollectPageView {...props} />);
  const input = screen.getByLabelText("Goal budget");
  fireEvent.change(input, { target: { value: "3.5" } });
  input.focus();
  rerender(<CollectPageView {...props} plan={plan} />);
  expect(input).not.toBeVisible();
  const edit = screen.getByRole("button", { name: "Edit goal" });
  expect(edit).toHaveFocus();
  fireEvent.click(edit);
  expect(screen.getByLabelText("Goal budget")).toBe(input);
  expect(input).toBeVisible();
  expect(input).toHaveValue("3.5");
  rerender(
    <CollectPageView
      {...props}
      plan={{ ...plan, reviewDisabledReason: "Still checking" }}
    />
  );
  expect(input).toBeVisible();
});
