import { AuthContext } from "@/components/auth/Auth";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { ReviewDistributionPlanTableSubscriptionFooter } from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooter";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription",
  () => ({
    SubscriptionConfirm: (props: any) =>
      props.show ? (
        <div
          data-testid={props.title}
          onClick={() => props.onConfirm?.("c", "t")}
        />
      ) : null,
    download: jest.fn(async () => ({ success: true, message: "ok" })),
    isSubscriptionsAdmin: jest.fn(),
  })
);

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooterUploadPhotos",
  () => ({
    UploadDistributionPhotosModal: (props: any) =>
      props.show ? <div data-testid="Upload Distribution Photos" /> : null,
  })
);

const {
  isSubscriptionsAdmin,
} = require("@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription");

const distCtx = { distributionPlan: { id: "1", name: "Plan" } } as any;
const authCtx = {
  connectedProfile: { wallets: [{ wallet: "0x1" }] },
  setToast: jest.fn(),
} as any;

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
  expect(screen.getByText("Reset Subscriptions")).toBeInTheDocument();
  expect(screen.getByText("Upload Distribution Photos")).toBeInTheDocument();
  expect(screen.getByText("Finalize Distribution")).toBeInTheDocument();
});

test("shows confirm modals when buttons clicked", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(
    <DistributionPlanToolContext.Provider value={distCtx}>
      <AuthContext.Provider value={authCtx}>
        <ReviewDistributionPlanTableSubscriptionFooter />
      </AuthContext.Provider>
    </DistributionPlanToolContext.Provider>
  );
  await user.click(screen.getByText("Upload Distribution Photos"));
  await waitFor(() => {
    expect(
      screen.getByTestId("Upload Distribution Photos")
    ).toBeInTheDocument();
  });
  await user.click(screen.getByText("Reset Subscriptions"));
  await waitFor(() => {
    expect(screen.getByTestId("Reset Subscriptions")).toBeInTheDocument();
  });
  await user.click(screen.getByText("Finalize Distribution"));
  await waitFor(() => {
    expect(screen.getByTestId("Finalize Distribution")).toBeInTheDocument();
  });
});

test("resetSubscriptions posts data and shows toast", async () => {
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  const {
    SubscriptionConfirm,
    download,
  } = require("@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription");
  const commonApiPost = jest.fn().mockResolvedValue({});
  jest
    .spyOn(require("@/services/api/common-api"), "commonApiPost")
    .mockImplementation(commonApiPost);

  render(
    <DistributionPlanToolContext.Provider value={distCtx}>
      <AuthContext.Provider value={authCtx}>
        <ReviewDistributionPlanTableSubscriptionFooter />
      </AuthContext.Provider>
    </DistributionPlanToolContext.Provider>
  );

  // open modal and confirm
  screen.getByText("Reset Subscriptions").click();
  screen.getByTestId("Reset Subscriptions").click();
  await Promise.resolve();
  expect(commonApiPost).toHaveBeenCalled();
  expect(authCtx.setToast).toHaveBeenCalled();
});
