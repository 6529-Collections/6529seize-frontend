import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubscriptionTopUpButton from "@/components/user/subscriptions/coverage/SubscriptionTopUpButton";

it.each([true, false])(
  "keeps the Top up action with primary emphasis: %s",
  async (primary) => {
    const open = jest.fn();
    render(
      <SubscriptionTopUpButton
        primary={primary}
        expanded={false}
        onClick={open}
      />
    );
    const button = screen.getByRole("button", { name: "Top up" });
    expect(button).toHaveClass(
      primary ? "tw-bg-iron-200" : "!tw-bg-transparent"
    );
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    expect(button).toHaveAttribute("aria-expanded", "false");
    await userEvent.setup().click(button);
    expect(open).toHaveBeenCalledTimes(1);
  }
);
