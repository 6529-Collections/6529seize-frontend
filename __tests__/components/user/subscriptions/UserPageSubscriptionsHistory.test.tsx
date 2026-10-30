import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageSubscriptionsHistory from "@/components/user/subscriptions/UserPageSubscriptionsHistory";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { Page } from "@/helpers/Types";
import type { SubscriptionLog } from "@/generated/models/SubscriptionLog";
import type { SubscriptionTopUp } from "@/generated/models/SubscriptionTopUp";
import type { RedeemedSubscription } from "@/generated/models/RedeemedSubscription";

const address = "0xfb47b2ca7df248d36cf0e4f63bfd0503c25debd4";
const date = new Date("2026-10-30T14:00:00Z");
const page = <T,>(data: T[], count = data.length): Page<T> => ({
  count,
  page: 1,
  next: count > 10,
  data,
});
function makeProps() {
  return {
    redeemed: page<RedeemedSubscription>(
      [
        {
          transaction: "0x123",
          token_id: 568,
          contract: MEMES_CONTRACT,
          address,
          balance_after: 9.20589,
          count: 2,
          created_at: date,
          consolidation_key: "test",
          value: 0.13058,
        },
      ],
      340
    ),
    logs: page<SubscriptionLog>(
      [
        {
          id: 1,
          consolidation_key: "test",
          log: "Added to Final Subscription for Meme #568 on 2026-10-30",
          additional_info: `Airdrop Address: ${address} - Subscription Count: x2 - Balance: 9.20589 ETH`,
          created_at: date,
        },
      ],
      1260
    ),
    topups: page<SubscriptionTopUp>(
      [
        {
          hash: "0x456",
          amount: 1,
          block: 1,
          from_wallet: address,
          transaction_date: date,
        },
      ],
      20
    ),
    setRedeemedPage: jest.fn(),
    setLogsPage: jest.fn(),
    setTopUpPage: jest.fn(),
  };
}

describe("UserPageSubscriptionsHistory", () => {
  it("keeps full original entries and independent pagination in all three tabs", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    const { rerender } = render(<UserPageSubscriptionsHistory {...props} />);
    expect(screen.getByRole("tab", { name: "Redeemed" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(
      screen.getByRole("heading", { name: "Redeemed Subscriptions" })
    ).toBeVisible();
    expect(
      screen.getByText("Redeemed Subscription for Meme #568 x2")
    ).toBeVisible();
    expect(
      screen.getByText(
        `Airdrop Address: ${address} - Balance after redemption: 9.20589 ETH`
      )
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "View transaction on Etherscan" })
    ).toHaveAttribute("href", expect.stringContaining("0x123"));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(props.setRedeemedPage).toHaveBeenCalledWith(2);
    rerender(
      <UserPageSubscriptionsHistory
        {...props}
        redeemed={{ ...props.redeemed, page: 2 }}
      />
    );
    await user.click(screen.getByRole("tab", { name: "Log", exact: true }));
    expect(screen.getByRole("heading", { name: "Log History" })).toBeVisible();
    expect(screen.getByText(props.logs.data[0].log)).toBeVisible();
    expect(screen.getByText(props.logs.data[0].additional_info!)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(props.setLogsPage).toHaveBeenCalledWith(2);
    await user.click(screen.getByRole("tab", { name: "Top Ups" }));
    expect(
      screen.getByRole("heading", { name: "Top Up History" })
    ).toBeVisible();
    expect(screen.getByText(`from: ${address}`)).toBeVisible();
    expect(screen.getByRole("tabpanel")).not.toHaveTextContent("—");
    expect(
      screen.getByRole("link", { name: "View transaction on Etherscan" })
    ).toHaveAttribute("href", expect.stringContaining("0x456"));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(props.setTopUpPage).toHaveBeenCalledWith(2);
    await user.click(screen.getByRole("tab", { name: "Redeemed" }));
    expect(
      within(screen.getByRole("tabpanel")).getByRole("textbox", {name: "Page number"})
    ).toHaveValue("2");
  });

  it("preserves the selected tab while loading and shows its original empty state", async () => {
    const props = makeProps();
    const { rerender } = render(<UserPageSubscriptionsHistory {...props} />);
    await userEvent
      .setup()
      .click(screen.getByRole("tab", { name: "Log", exact: true }));
    rerender(<UserPageSubscriptionsHistory {...props} logsLoading />);
    expect(
      screen.getByRole("tab", { name: "Log", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Loading Log History")).toBeInTheDocument();
    rerender(<UserPageSubscriptionsHistory {...props} logs={page([])} />);
    expect(screen.getByText("No logs found")).toBeVisible();
  });

  it("supports arrow-key tab navigation", async () => {
    render(<UserPageSubscriptionsHistory {...makeProps()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Redeemed" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Log", exact: true })).toHaveFocus();
    expect(
      screen.getByRole("tab", { name: "Log", exact: true })
    ).toHaveAttribute("aria-selected", "true");
  });
});
