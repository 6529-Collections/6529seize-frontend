import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageSubscriptionsBalance from "@/components/user/subscriptions/UserPageSubscriptionsBalance";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";

jest.mock("@/components/dotLoader/DotLoader", () => ({
  __esModule: true,
  default: () => <div>Loading...</div>,
  Spinner: () => <div>Spinner</div>,
}));

describe("UserPageSubscriptionsBalance", () => {
  it("shows loader when fetching", () => {
    render(
      <UserPageSubscriptionsBalance
        details={undefined}
        show_refresh={false}
        fetching={true}
        refresh={jest.fn()}
      />
    );
    expect(screen.getByText("Loading balance")).toBeInTheDocument();
    expect(screen.queryByText(/mints? available/)).not.toBeInTheDocument();
  });

  it("calls refresh when icon clicked", async () => {
    const user = userEvent.setup();
    const refresh = jest.fn();
    render(
      <UserPageSubscriptionsBalance
        details={{ balance: 2 } as any}
        show_refresh={true}
        fetching={false}
        refresh={refresh}
      />
    );
    await user.click(screen.getByLabelText("Refresh balance"));
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByText("30 mints available")).toBeVisible();
  });

  it("shows a genuine zero balance after a successful response", () => {
    render(
      <UserPageSubscriptionsBalance
        details={{ balance: 0 } as SubscriptionDetails}
        show_refresh={false}
        fetching={false}
        refresh={jest.fn()}
      />
    );
    expect(screen.getByText("0")).toHaveTextContent("0 ETH");
    expect(screen.getByText("0 mints available")).toBeVisible();
  });

  it("uses the exact coverage balance in the compact row", () => {
    render(
      <UserPageSubscriptionsBalance
        coverage={
          {
            balance_eth: "0.18",
            mint_capacity: 2,
          } as any
        }
        details={{ balance: 99 } as any}
        show_refresh={false}
        fetching={false}
        refresh={jest.fn()}
      />
    );

    expect(screen.getByText("0.18")).toHaveTextContent("0.18 ETH");
    expect(screen.getByText("ETH")).toHaveClass("tw-sr-only");
    expect(screen.getByText("2 mints available")).toBeVisible();
    expect(screen.queryByText("99")).not.toBeInTheDocument();
  });

  it("falls back to the legacy balance when coverage is unavailable", () => {
    render(
      <UserPageSubscriptionsBalance
        details={{ balance: 0.2 } as any}
        show_refresh={false}
        fetching={false}
        refresh={jest.fn()}
      />
    );

    expect(screen.getByText("0.2")).toHaveTextContent("0.2 ETH");
    expect(screen.getByText("3 mints available")).toBeVisible();
  });

  it("keeps the exact balance visible when capacity is unknown", () => {
    render(
      <UserPageSubscriptionsBalance
        coverage={
          {
            balance_eth: "0.18",
            mint_capacity: null,
          } as ApiSubscriptionCoverage
        }
        details={undefined}
        show_refresh={false}
        fetching={false}
        refresh={jest.fn()}
      />
    );

    expect(screen.getByText("0.18")).toHaveTextContent("0.18 ETH");
    expect(screen.getByText("mint capacity unavailable")).toBeVisible();
    expect(screen.queryByText(/0 mints available/)).not.toBeInTheDocument();
  });

  it.each([
    [0, "0 mints available"],
    [1, "1 mint available"],
    [1108, "1,108 mints available"],
  ])("keeps the original capacity wording for %i mints", (capacity, label) => {
    render(
      <UserPageSubscriptionsBalance
        coverage={
          {
            balance_eth: "0.18",
            mint_capacity: capacity,
          } as ApiSubscriptionCoverage
        }
        details={{ balance: 99 } as any}
        show_refresh={false}
        fetching={false}
        refresh={jest.fn()}
      />
    );
    expect(screen.getByText(label)).toBeVisible();
  });

  it.each([undefined, Number.NaN, Number.POSITIVE_INFINITY])(
    "does not invent a balance or capacity from missing or invalid data (%s)",
    (balance) => {
      render(
        <UserPageSubscriptionsBalance
          details={balance === undefined ? undefined : ({ balance } as any)}
          show_refresh={false}
          fetching={false}
          refresh={jest.fn()}
        />
      );
      expect(screen.getByText("Unavailable")).toBeVisible();
      expect(screen.queryByText("ETH")).not.toBeInTheDocument();
      expect(screen.queryByText(/mints? available/)).not.toBeInTheDocument();
    }
  );
});
