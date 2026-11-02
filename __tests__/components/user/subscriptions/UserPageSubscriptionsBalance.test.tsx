import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageSubscriptionsBalance from "@/components/user/subscriptions/UserPageSubscriptionsBalance";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";

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
    expect(
      screen.getByText("Loading...", { selector: "div" })
    ).toBeInTheDocument();
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
    expect(screen.queryByText(/mints available/)).not.toBeInTheDocument();
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

    expect(screen.getByText("0.18 ETH")).toBeInTheDocument();
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

    expect(screen.getByText("0.2 ETH")).toBeInTheDocument();
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

    expect(screen.getByText("0.18 ETH")).toBeInTheDocument();
  });
});
