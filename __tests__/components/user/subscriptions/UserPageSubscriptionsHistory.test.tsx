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

function mockHistoryScroll() {
  const root = screen.getByRole("tablist").parentElement;
  if (!root) throw new Error("History root is missing");
  const scroll = jest.fn();
  root.scrollIntoView = scroll;
  return scroll;
}

describe("UserPageSubscriptionsHistory", () => {
  it("keeps full original entries and independent pagination in all three tabs", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    const { rerender } = render(<HistoryTestView {...props} />);
    mockHistoryScroll();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Redeemed",
      "Log History",
      "Top Up History",
    ]);
    expect(screen.getByRole("tab", { name: "Redeemed" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tabpanel", { name: "Redeemed" })).toBeVisible();
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "Redeemed Subscription for Meme #568 x2"
    );
    expect(screen.getByText("x2", { exact: true })).toBeVisible();
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "Airdrop Address: 0xfb47...ebd4 - Balance after redemption: 9.20589 ETH"
    );
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
    const logDetails = screen
      .getByText(address, { exact: true })
      .closest("div");
    expect(logDetails).toBeVisible();
    expect(logDetails?.textContent).toBe(props.logs.data[0]!.additional_info);
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(props.setLogsPage).toHaveBeenCalledWith(2);
    await user.click(screen.getByRole("tab", { name: "Top Up History" }));
    expect(
      screen.getByRole("tabpanel", { name: "Top Up History" })
    ).toBeVisible();
    expect(screen.getByRole("tabpanel")).toHaveTextContent(`from: ${address}`);
    expect(screen.getByText(address, { exact: true })).toBeVisible();
    expect(screen.getByRole("tabpanel")).not.toHaveTextContent("—");
    expect(
      screen.getByRole("link", { name: "View transaction on Etherscan" })
    ).toHaveAttribute("href", expect.stringContaining("0x456"));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(props.setTopUpPage).toHaveBeenCalledWith(2);
    await user.click(screen.getByRole("tab", { name: "Redeemed" }));
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

  it("scrolls once and focuses the new page only after its rows finish loading", async () => {
    const props = makeProps();
    const { rerender } = render(<HistoryTestView {...props} />);
    const scroll = mockHistoryScroll();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Next page" }));
    expect(props.setRedeemedPage).toHaveBeenCalledWith(2);
    expect(scroll).not.toHaveBeenCalled();

    const nextPage = { ...props.redeemed, page: 2 };
    rerender(
      <HistoryTestView {...props} redeemed={nextPage} redeemedLoading />
    );
    expect(scroll).not.toHaveBeenCalled();
    rerender(
      <HistoryTestView {...props} redeemed={nextPage} redeemedLoading={false} />
    );
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll).toHaveBeenCalledWith({
      block: "start",
      behavior: "instant",
    });
    expect(screen.getByRole("tabpanel", { name: "Redeemed" })).toHaveFocus();

    rerender(
      <HistoryTestView {...props} redeemed={nextPage} redeemedLoading />
    );
    rerender(
      <HistoryTestView {...props} redeemed={nextPage} redeemedLoading={false} />
    );
    expect(scroll).toHaveBeenCalledTimes(1);
  });

  it("also returns to the top when the requested page is already cached", async () => {
    const props = makeProps();
    const { rerender } = render(<HistoryTestView {...props} />);
    const scroll = mockHistoryScroll();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Go to last page" }));
    expect(props.setRedeemedPage).toHaveBeenCalledWith(34);
    rerender(
      <HistoryTestView {...props} redeemed={{ ...props.redeemed, page: 34 }} />
    );
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("tabpanel", { name: "Redeemed" })).toHaveFocus();
  });

  it("cancels the pending scroll if the viewer switches history tabs", async () => {
    const props = makeProps();
    const { rerender } = render(<HistoryTestView {...props} />);
    const scroll = mockHistoryScroll();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("tab", { name: "Log History" }));
    rerender(
      <HistoryTestView {...props} redeemed={{ ...props.redeemed, page: 2 }} />
    );
    expect(scroll).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "Log History" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await user.click(screen.getByRole("tab", { name: "Redeemed" }));
    expect(scroll).not.toHaveBeenCalled();
  });

  it("does not scroll for background refreshes or tab selection", async () => {
    const props = makeProps();
    const { rerender } = render(<HistoryTestView {...props} />);
    const scroll = mockHistoryScroll();
    rerender(<HistoryTestView {...props} redeemedLoading />);
    rerender(<HistoryTestView {...props} redeemedLoading={false} />);
    await userEvent
      .setup()
      .click(screen.getByRole("tab", { name: "Log History" }));
    expect(scroll).not.toHaveBeenCalled();
  });

  it("cancels an old scroll request when the current page is resubmitted", async () => {
    const props = makeProps();
    const { rerender } = render(<HistoryTestView {...props} />);
    const scroll = mockHistoryScroll();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("textbox", { name: "Page number" }));
    await user.keyboard("{Enter}");
    expect(props.setRedeemedPage).toHaveBeenLastCalledWith(1);
    rerender(
      <HistoryTestView {...props} redeemed={{ ...props.redeemed, page: 2 }} />
    );
    expect(scroll).not.toHaveBeenCalled();
  });

  it("supports arrow-key tab navigation", async () => {
    render(<HistoryTestView {...makeProps()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Redeemed" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Log History" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Log History" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("reveals a keyboard-selected tab again at its wider selected weight", async () => {
    render(<HistoryTestView {...makeProps()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Redeemed" }));
    const reveals: { tab: string; selected: string | null }[] = [];
    const scroll = jest
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(function (this: Element) {
        reveals.push({
          tab: this.textContent ?? "",
          selected: this.getAttribute("aria-selected"),
        });
      });
    try {
      await user.keyboard("{ArrowRight}");
      const logs = screen.getByRole("tab", { name: "Log History" });
      expect(logs).toHaveFocus();
      expect(logs).toHaveAttribute("aria-selected", "true");
      // Focus lands first; the selected pill grows, so it is revealed again.
      expect(reveals).toEqual([
        { tab: "Log History", selected: "false" },
        { tab: "Log History", selected: "true" },
      ]);
      expect(scroll).toHaveBeenLastCalledWith({
        behavior: "instant",
        block: "nearest",
        inline: "nearest",
      });
    } finally {
      scroll.mockRestore();
    }
  });

  it("does not scroll to the selected tab while focus is elsewhere", () => {
    const scroll = jest.spyOn(Element.prototype, "scrollIntoView");
    try {
      const props = makeProps();
      const { rerender } = render(
        <UserPageSubscriptionsHistory
          {...props}
          selectedIndex={0}
          onSelectionChange={jest.fn()}
        />
      );
      rerender(
        <UserPageSubscriptionsHistory
          {...props}
          selectedIndex={2}
          onSelectionChange={jest.fn()}
        />
      );
      expect(
        screen.getByRole("tab", { name: "Top Up History" })
      ).toHaveAttribute("aria-selected", "true");
      expect(scroll).not.toHaveBeenCalled();
    } finally {
      scroll.mockRestore();
    }
  });

  it.each([
    "No additional allocation details",
    "Mode: Manual - Note: keep exact text: 1 - 2",
  ])(
    "preserves log detail text exactly while styling its values: %s",
    async (text) => {
      const props = makeProps();
      props.logs.data[0]!.additional_info = text;
      render(<HistoryTestView {...props} />);
      await userEvent
        .setup()
        .click(screen.getByRole("tab", { name: "Log History" }));
      expect(
        screen.getByText((_content, element) => element?.textContent === text)
      ).toBeVisible();
    }
  );

  it("shows the shared transaction tooltip on keyboard focus without changing the link", async () => {
    render(<HistoryTestView {...makeProps()} />);
    const user = userEvent.setup();
    await user.tab();
    await user.tab();
    expect(screen.getByRole("tabpanel")).toHaveFocus();
    await user.tab();
    const link = screen.getByRole("link", {
      name: "View transaction on Etherscan",
    });
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("href", expect.stringContaining("0x123"));
    expect(
      await screen.findByRole("tooltip", {
        name: "View transaction on Etherscan",
      })
    ).toBeVisible();
  });
});
