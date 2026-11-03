import { useState, type ComponentProps } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageSubscriptionsHistory from "@/components/user/subscriptions/UserPageSubscriptionsHistory";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { Page } from "@/helpers/Types";
import type { SubscriptionLog } from "@/generated/models/SubscriptionLog";
import type { SubscriptionTopUp } from "@/generated/models/SubscriptionTopUp";
import type { RedeemedSubscription } from "@/generated/models/RedeemedSubscription";

function HistoryTestView(
  props: Omit<
    ComponentProps<typeof UserPageSubscriptionsHistory>,
    "selectedIndex" | "onSelectionChange"
  >
) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  return (
    <UserPageSubscriptionsHistory
      {...props}
      selectedIndex={selectedIndex}
      onSelectionChange={setSelectedIndex}
    />
  );
}

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
    const { rerender } = render(<HistoryTestView {...props} />);
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Redeemed Subscriptions",
      "Log History",
      "Top Up History",
    ]);
    expect(
      screen.getByRole("tab", { name: "Redeemed Subscriptions" })
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("tabpanel", { name: "Redeemed Subscriptions" })
    ).toBeVisible();
    expect(
      screen.getByText("Redeemed Subscription for Meme #568 x2")
    ).toBeVisible();
    expect(
      screen.getByText(
        "Airdrop Address: 0xfb47...ebd4 - Balance after redemption: 9.20589 ETH"
      )
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "View transaction on Etherscan" })
    ).toHaveAttribute("href", expect.stringContaining("0x123"));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(props.setRedeemedPage).toHaveBeenCalledWith(2);
    rerender(
      <HistoryTestView {...props} redeemed={{ ...props.redeemed, page: 2 }} />
    );
    await user.click(screen.getByRole("tab", { name: "Log History" }));
    expect(screen.getByRole("tabpanel", { name: "Log History" })).toBeVisible();
    expect(screen.getByText(props.logs.data[0]!.log)).toBeVisible();
    expect(
      screen.getByText(props.logs.data[0]!.additional_info!)
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(props.setLogsPage).toHaveBeenCalledWith(2);
    await user.click(screen.getByRole("tab", { name: "Top Up History" }));
    expect(
      screen.getByRole("tabpanel", { name: "Top Up History" })
    ).toBeVisible();
    expect(screen.getByText(`from: ${address}`)).toBeVisible();
    expect(screen.getByRole("tabpanel")).not.toHaveTextContent("—");
    expect(
      screen.getByRole("link", { name: "View transaction on Etherscan" })
    ).toHaveAttribute("href", expect.stringContaining("0x456"));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(props.setTopUpPage).toHaveBeenCalledWith(2);
    await user.click(
      screen.getByRole("tab", { name: "Redeemed Subscriptions" })
    );
    expect(
      within(screen.getByRole("tabpanel")).getByRole("textbox", {
        name: "Page number",
      })
    ).toHaveValue("2");
  });

  it("preserves the selected tab while loading and shows its original empty state", async () => {
    const props = makeProps();
    const { rerender } = render(<HistoryTestView {...props} />);
    await userEvent
      .setup()
      .click(screen.getByRole("tab", { name: "Log History" }));
    rerender(<HistoryTestView {...props} logsLoading />);
    expect(screen.getByRole("tab", { name: "Log History" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText("Loading Log History")).toBeInTheDocument();
    rerender(<HistoryTestView {...props} logs={page([])} />);
    expect(screen.getByText("No logs found")).toBeVisible();
  });

  it("supports arrow-key tab navigation", async () => {
    render(<HistoryTestView {...makeProps()} />);
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("tab", { name: "Redeemed Subscriptions" })
    );
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Log History" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Log History" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});
