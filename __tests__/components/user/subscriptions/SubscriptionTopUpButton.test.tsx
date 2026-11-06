import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubscriptionTopUpButton from "@/components/user/subscriptions/coverage/SubscriptionTopUpButton";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";

it.each(Object.values(Status))(
  "keeps the Top up action and uses the requested emphasis in %s",
  async (status) => {
    const open = jest.fn();
    render(
      <SubscriptionTopUpButton
        status={status}
        expanded={false}
        onClick={open}
      />
    );
    const button = screen.getByRole("button", { name: "Top up" });
    const primary = [
      Status.ActionRequired,
      Status.RunningLow,
      Status.NotSetUp,
    ].includes(status);
    expect(button).toHaveClass(
      primary ? "tw-bg-iron-200" : "!tw-bg-transparent"
    );
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    await userEvent.setup().click(button);
    expect(open).toHaveBeenCalledTimes(1);
  }
);
