import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageStatsActivityWalletFilterItem from "@/components/user/stats/activity/wallet/filter/UserPageStatsActivityWalletFilterItem";
import { UserPageStatsActivityWalletFilterType } from "@/components/user/stats/activity/wallet/UserPageStatsActivityWallet.types";
import {
  getWalletActivityFilterLabel,
  getWalletActivityFilterOptionLabel,
} from "@/components/user/stats/activity/wallet/wallet-activity.messages";

describe("UserPageStatsActivityWalletFilterItem", () => {
  it("calls onFilter when clicked", async () => {
    const onFilter = jest.fn();
    const filter = UserPageStatsActivityWalletFilterType.ALL;
    render(
      <UserPageStatsActivityWalletFilterItem
        filter={filter}
        title={getWalletActivityFilterLabel(filter)}
        ariaLabel={getWalletActivityFilterOptionLabel(filter)}
        activeFilter={UserPageStatsActivityWalletFilterType.SALES}
        onFilter={onFilter}
      />
    );
    const button = screen.getByRole("button", {
      name: getWalletActivityFilterOptionLabel(filter),
    });

    expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    expect(onFilter).toHaveBeenCalledWith(filter);
  });

  it("shows check mark when active", () => {
    const filter = UserPageStatsActivityWalletFilterType.ALL;
    const { container } = render(
      <UserPageStatsActivityWalletFilterItem
        filter={filter}
        title={getWalletActivityFilterLabel(filter)}
        ariaLabel={getWalletActivityFilterOptionLabel(filter)}
        activeFilter={filter}
        onFilter={jest.fn()}
      />
    );
    expect(
      screen.getByRole("button", {
        name: getWalletActivityFilterOptionLabel(filter),
      })
    ).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
