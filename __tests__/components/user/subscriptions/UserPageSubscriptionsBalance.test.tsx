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
    expect(
      screen.getByText((t) => t.includes("mints available"))
    ).toBeInTheDocument();
  });

  it("uses the exact coverage balance and raw mint capacity", () => {
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

    expect(screen.getByText("0.18")).toBeInTheDocument();
    expect(screen.getByText("(2 mints available)")).toBeInTheDocument();
    expect(screen.queryByText("99")).not.toBeInTheDocument();
  });

  it("does not infer capacity when the coverage service marks it unknown", () => {
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

    expect(
      screen.getByText("(mint capacity unavailable)")
    ).toBeInTheDocument();
  });
});
