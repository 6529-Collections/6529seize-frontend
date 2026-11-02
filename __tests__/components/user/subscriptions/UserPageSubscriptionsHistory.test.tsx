import { fireEvent, render, screen } from "@testing-library/react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import UserPageSubscriptionsHistory from "@/components/user/subscriptions/UserPageSubscriptionsHistory";
import type { Page } from "@/helpers/Types";

jest.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: jest.fn() }));
const mockUseMediaQuery = jest.mocked(useMediaQuery);

const page = <T,>(data: T[]): Page<T> => ({
  count: data.length,
  page: 1,
  next: false,
  data,
});

describe("UserPageSubscriptionsHistory", () => {
  beforeEach(() => mockUseMediaQuery.mockReturnValue(true));

  it("keeps the mobile user choice across data updates and breakpoint changes", () => {
    mockUseMediaQuery.mockReturnValue(false);
    const props = {
      topups: page([]),
      redeemed: page([]),
      logs: page([]),
      setRedeemedPage: jest.fn(),
      setTopUpPage: jest.fn(),
      setLogsPage: jest.fn(),
    };
    const { container, rerender } = render(
      <UserPageSubscriptionsHistory {...props} />
    );
    expect(container.querySelectorAll("details[open]")).toHaveLength(0);
    const summary = screen.getByText("Log History").closest("summary")!;
    const disclosure = summary.closest("details")!;
    fireEvent.click(summary);
    expect(disclosure).toHaveAttribute("open");
    rerender(<UserPageSubscriptionsHistory {...props} logsLoading />);
    expect(disclosure).toHaveAttribute("open");
    mockUseMediaQuery.mockReturnValue(true);
    rerender(<UserPageSubscriptionsHistory {...props} />);
    fireEvent.click(summary);
    expect(disclosure).not.toHaveAttribute("open");
    mockUseMediaQuery.mockReturnValue(false);
    rerender(<UserPageSubscriptionsHistory {...props} />);
    mockUseMediaQuery.mockReturnValue(true);
    rerender(<UserPageSubscriptionsHistory {...props} />);
    expect(disclosure).not.toHaveAttribute("open");
  });
  it("renders accordions with entries", () => {
    render(
      <UserPageSubscriptionsHistory
        topups={page([
          {
            hash: "h",
            amount: 1,
            from_wallet: "a",
            transaction_date: "2020-01-01",
          } as any,
        ])}
        redeemed={page([
          {
            transaction: "tx",
            token_id: 1,
            contract: "0x1",
            address: "b",
            balance_after: 1,
            created_at: "2020-01-01",
          } as any,
        ])}
        logs={page([{ id: 1, log: "log", created_at: "2020-01-01" } as any])}
        setRedeemedPage={() => {}}
        setTopUpPage={() => {}}
        setLogsPage={() => {}}
      />
    );
    expect(screen.getByText("Subscription History")).toBeInTheDocument();
    expect(screen.getByText("Redeemed Subscriptions")).toBeInTheDocument();
    expect(screen.getByText("Log History")).toBeInTheDocument();
    expect(screen.getByText("Top Up History")).toBeInTheDocument();
    for (const title of [
      "Redeemed Subscriptions",
      "Log History",
      "Top Up History",
    ]) {
      expect(screen.getByText(title).closest("details")).toHaveAttribute(
        "open"
      );
    }
  });
});
