import { render, screen } from "@testing-library/react";
import React from "react";
import { ReviewDistributionPlanTableSubscriptionFooter } from "../../../components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooter";
import { DistributionPlanToolContext } from "../../../components/distribution-plan-tool/DistributionPlanToolContext";
import { AuthContext } from "../../../components/auth/Auth";

jest.mock("../../../components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription", () => ({
  SubscriptionConfirm: (props: any) => <div data-testid={props.title} />,
  download: jest.fn(async () => ({ success: true, message: "ok" })),
  isSubscriptionsAdmin: jest.fn(),
}));

const { isSubscriptionsAdmin } = require("../../../components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription");

const distCtx = { distributionPlan: { id: "1", name: "Plan" } } as any;
const authCtx = { connectedProfile: { wallets: [{ wallet: "0x1" }] }, setToast: jest.fn() } as any;

test("returns empty when not admin", () => {
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(false);
  const { container } = render(
    <DistributionPlanToolContext.Provider value={distCtx}>
      <AuthContext.Provider value={authCtx}>
        <ReviewDistributionPlanTableSubscriptionFooter />
      </AuthContext.Provider>
    </DistributionPlanToolContext.Provider>
  );
  expect(container.innerHTML).toBe("");
});

test("renders admin buttons", () => {
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(
    <DistributionPlanToolContext.Provider value={distCtx}>
      <AuthContext.Provider value={authCtx}>
        <ReviewDistributionPlanTableSubscriptionFooter />
      </AuthContext.Provider>
    </DistributionPlanToolContext.Provider>
  );
  expect(screen.getByText("Public Subscriptions")).toBeInTheDocument();
  expect(screen.getByText("Reset Subscriptions")).toBeInTheDocument();
});

test('shows confirm modals when buttons clicked', () => {
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(
    <DistributionPlanToolContext.Provider value={distCtx}>
      <AuthContext.Provider value={authCtx}>
        <ReviewDistributionPlanTableSubscriptionFooter />
      </AuthContext.Provider>
    </DistributionPlanToolContext.Provider>
  );
  screen.getByText('Public Subscriptions').click();
  expect(screen.getByTestId('Download Public Subscriptions')).toBeInTheDocument();
  screen.getByText('Reset Subscriptions').click();
  expect(screen.getByTestId('Reset Subscriptions')).toBeInTheDocument();
});
