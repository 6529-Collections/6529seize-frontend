import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageStatsActivityWalletFilter from "@/components/user/stats/activity/wallet/filter/UserPageStatsActivityWalletFilter";
import { UserPageStatsActivityWalletFilterType } from "@/components/user/stats/activity/wallet/UserPageStatsActivityWallet.types";
import {
  getWalletActivityFilterLabel,
  getWalletActivityFilterOptionLabel,
  getWalletActivityMessage,
} from "@/components/user/stats/activity/wallet/wallet-activity.messages";

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  LazyMotion: ({ children }: any) => <>{children}</>,
  domAnimation: {},
  m: { div: ({ children }: any) => <div>{children}</div> },
  useAnimate: () => [{ current: null }, jest.fn()],
}));

jest.mock("react-use", () => ({
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn(),
  useCss: jest.fn(() => ["", jest.fn()]),
}));

describe("UserPageStatsActivityWalletFilter", () => {
  it("opens list and selects filter", async () => {
    const user = userEvent.setup();
    const setActive = jest.fn();
    const locale = "de-DE";
    render(
      <UserPageStatsActivityWalletFilter
        activeFilter={UserPageStatsActivityWalletFilterType.ALL}
        setActiveFilter={setActive}
        locale={locale}
      />
    );
    const trigger = screen.getByRole("button", {
      name: getWalletActivityMessage(
        "user.collected.stats.walletActivity.filterButtonLabel",
        {
          filter: getWalletActivityFilterLabel(
            UserPageStatsActivityWalletFilterType.ALL,
            locale
          ),
        },
        locale
      ),
    });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("list", {
        name: getWalletActivityMessage(
          "user.collected.stats.walletActivity.filterOptionsLabel",
          undefined,
          locale
        ),
      })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: getWalletActivityFilterOptionLabel(
          UserPageStatsActivityWalletFilterType.AIRDROPS,
          locale
        ),
      })
    );

    expect(setActive).toHaveBeenCalledWith(
      UserPageStatsActivityWalletFilterType.AIRDROPS
    );
  });
});
