import { ReviewDistributionPlanTableSubscriptionFooterModal } from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooterModal";
import { fireEvent, render, screen } from "@testing-library/react";

describe("ReviewDistributionPlanTableSubscriptionFooterModal", () => {
  it("locks and restores background content while open", () => {
    const onClose = jest.fn();
    const { container, unmount } = render(
      <ReviewDistributionPlanTableSubscriptionFooterModal
        title="Distribution modal"
        onClose={onClose}
      >
        Modal body
      </ReviewDistributionPlanTableSubscriptionFooterModal>
    );

    expect(container).toHaveAttribute("aria-hidden", "true");
    expect(container.inert).toBe(true);

    unmount();

    expect(container).not.toHaveAttribute("aria-hidden");
    expect(container.inert).toBe(false);
  });

  it("keeps dismissable and non-dismissable outside-close behavior separate", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <ReviewDistributionPlanTableSubscriptionFooterModal
        title="Distribution modal"
        onClose={onClose}
      >
        Modal body
      </ReviewDistributionPlanTableSubscriptionFooterModal>
    );

    const dialog = screen.getByRole("dialog", { name: "Distribution modal" });
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Close modal backdrop" })
    );
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    rerender(
      <ReviewDistributionPlanTableSubscriptionFooterModal
        title="Distribution modal"
        onClose={onClose}
        isDismissable={false}
      >
        Modal body
      </ReviewDistributionPlanTableSubscriptionFooterModal>
    );

    expect(
      screen.queryByRole("button", { name: "Close modal backdrop" })
    ).not.toBeInTheDocument();

    expect(onClose).not.toHaveBeenCalled();
  });
});
