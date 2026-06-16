import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageActivityTabs from "@/components/user/stats/activity/tabs/UserPageActivityTabs";
import { USER_PAGE_ACTIVITY_TAB } from "@/components/user/stats/activity/activity.types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

describe("UserPageActivityTabs", () => {
  it("renders all tabs and handles click", async () => {
    const user = userEvent.setup();
    const setActive = jest.fn();
    render(
      <UserPageActivityTabs
        activeTab={USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS}
        setActiveTab={setActive}
      />
    );
    expect(
      screen.getByRole("tablist", {
        name: t(DEFAULT_LOCALE, "user.collected.stats.activityTabs.listLabel"),
      })
    ).toBeInTheDocument();
    const walletBtn = screen.getByRole("tab", {
      name: t(
        DEFAULT_LOCALE,
        "user.collected.stats.activityTabs.walletActivity"
      ),
    });
    expect(walletBtn).toBeInTheDocument();
    await user.click(walletBtn);
    expect(setActive).toHaveBeenCalledWith(
      USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY
    );
  });

  it("supports arrow-key tab switching", async () => {
    const user = userEvent.setup();
    const setActive = jest.fn();
    render(
      <UserPageActivityTabs
        activeTab={USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS}
        setActiveTab={setActive}
      />
    );
    screen
      .getByRole("tab", {
        name: t(
          DEFAULT_LOCALE,
          "user.collected.stats.activityTabs.distributions"
        ),
      })
      .focus();

    await user.keyboard("{ArrowRight}");

    expect(setActive).toHaveBeenCalledWith(USER_PAGE_ACTIVITY_TAB.TDH_HISTORY);
  });
});
