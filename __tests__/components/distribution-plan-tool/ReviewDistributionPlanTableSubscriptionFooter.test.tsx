import { AuthContext } from "@/components/auth/Auth";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { ReviewDistributionPlanTableSubscriptionFooter } from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooter";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMemo, useState } from "react";

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription",
  () => ({
    SubscriptionConfirm: (props: any) =>
      props.show ? (
        <button
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

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooterConfirmTokenId",
  () => ({
    ConfirmTokenIdModal: (props: any) =>
      props.show ? (
        <div data-testid="Confirm Token ID">
          <button
            data-testid="confirm-token-id-button"
            onClick={() => props.onConfirm("contract", "123")}>
            Confirm
          </button>
        </div>
      ) : null,
  })
);

const {
  isSubscriptionsAdmin,
} = require("@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription");

const authCtx = {
  connectedProfile: { wallets: [{ wallet: "0x1" }] },
  setToast: jest.fn(),
} as any;

function TestWrapper({
  initialTokenId = null,
}: {
  readonly initialTokenId?: string | null;
}) {
  const [confirmedTokenId, setConfirmedTokenId] = useState<string | null>(
    initialTokenId
  );
  const distCtx = useMemo(
    () => ({
      distributionPlan: { id: "1", name: "Plan" },
      confirmedTokenId,
      setConfirmedTokenId,
    }),
    [confirmedTokenId]
  ) as any;

  return (
    <DistributionPlanToolContext.Provider value={distCtx}>
      <AuthContext.Provider value={authCtx}>
        <ReviewDistributionPlanTableSubscriptionFooter />
      </AuthContext.Provider>
    </DistributionPlanToolContext.Provider>
  );
}

test("returns empty when not admin", () => {
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(false);
  const { container } = render(<TestWrapper />);
  expect(container.innerHTML).toBe("");
});

test("shows confirm token id modal on mount for admin", () => {
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(<TestWrapper />);
  expect(screen.getByTestId("Confirm Token ID")).toBeInTheDocument();
});

test("renders admin buttons after token id is confirmed", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(<TestWrapper />);

  await user.click(screen.getByTestId("confirm-token-id-button"));

  await waitFor(() => {
    expect(screen.getByText("Change Token ID")).toBeInTheDocument();
    expect(screen.getByText("Reset Subscriptions")).toBeInTheDocument();
    expect(screen.getByText("Upload Distribution Photos")).toBeInTheDocument();
    expect(screen.getByText("Finalize Distribution")).toBeInTheDocument();
  });
});

test("displays contract and token id after confirmation", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(<TestWrapper />);

  await user.click(screen.getByTestId("confirm-token-id-button"));

  await waitFor(() => {
    expect(screen.getByText(/Contract: The Memes/)).toBeInTheDocument();
    expect(screen.getByText(/Token ID: 123/)).toBeInTheDocument();
  });
});

test("shows confirm modals when buttons clicked", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(<TestWrapper />);

  await user.click(screen.getByTestId("confirm-token-id-button"));

  await waitFor(() => {
    expect(screen.getByText("Upload Distribution Photos")).toBeInTheDocument();
  });

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

test("change token id button opens confirm modal", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(<TestWrapper />);

  await user.click(screen.getByTestId("confirm-token-id-button"));

  await waitFor(() => {
    expect(screen.getByText("Change Token ID")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Change Token ID"));

  await waitFor(() => {
    expect(screen.getByTestId("Confirm Token ID")).toBeInTheDocument();
  });
});

test("resetSubscriptions posts data and shows toast", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  const commonApiPost = jest.fn().mockResolvedValue({});
  jest
    .spyOn(require("@/services/api/common-api"), "commonApiPost")
    .mockImplementation(commonApiPost);

  jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue({ photos_count: 0, is_normalized: false });

  render(<TestWrapper />);

  await user.click(screen.getByTestId("confirm-token-id-button"));

  await waitFor(() => {
    expect(screen.getByText("Reset Subscriptions")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Reset Subscriptions"));
  await waitFor(() => {
    expect(screen.getByTestId("Reset Subscriptions")).toBeInTheDocument();
  });
  await user.click(screen.getByTestId("Reset Subscriptions"));
  await waitFor(() => {
    expect(commonApiPost).toHaveBeenCalled();
    expect(authCtx.setToast).toHaveBeenCalled();
  });
});
