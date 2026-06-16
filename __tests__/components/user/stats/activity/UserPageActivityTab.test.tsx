import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageActivityTab from "@/components/user/stats/activity/tabs/UserPageActivityTab";
import { USER_PAGE_ACTIVITY_TAB } from "@/components/user/stats/activity/activity.types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getActivityPanelId,
  getActivityTabId,
} from "@/components/user/stats/activity/tabs/activity-tabs.helpers";

const activityTabText = (key: Parameters<typeof t>[1]) =>
  t(DEFAULT_LOCALE, key);

describe("UserPageActivityTab", () => {
  it("renders label and handles click", async () => {
    const user = userEvent.setup();
    const setActive = jest.fn();
    render(
      <UserPageActivityTab
        tab={USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS}
        activeTab={USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY}
        setActiveTab={setActive}
        onKeyDown={jest.fn()}
      />
    );
    const btn = screen.getByRole("tab", {
      name: activityTabText("user.collected.stats.activityTabs.distributions"),
    });
    expect(btn).toHaveClass("tw-bg-iron-950", { exact: false });
    expect(btn).toHaveAttribute("aria-selected", "false");
    expect(btn).toHaveAttribute(
      "aria-controls",
      getActivityPanelId(USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS)
    );
    expect(btn).toHaveAttribute(
      "id",
      getActivityTabId(USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS)
    );
    expect(btn).toHaveAttribute("tabIndex", "-1");
    await user.click(btn);
    expect(setActive).toHaveBeenCalledWith(
      USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS
    );
  });

  it("highlights when active", () => {
    render(
      <UserPageActivityTab
        tab={USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY}
        activeTab={USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY}
        setActiveTab={jest.fn()}
        onKeyDown={jest.fn()}
      />
    );
    const btn = screen.getByRole("tab", {
      name: activityTabText("user.collected.stats.activityTabs.walletActivity"),
    });
    expect(btn.className).toContain("tw-bg-iron-800");
    expect(btn).toHaveAttribute("aria-selected", "true");
    expect(btn).toHaveAttribute("tabIndex", "0");
  });
});
