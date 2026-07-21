import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageActivityTab from "@/components/user/stats/activity/tabs/UserPageActivityTab";
import { USER_PAGE_ACTIVITY_TAB } from "@/components/user/stats/activity/activity.types";
import { t } from "@/i18n/messages";
import {
  getActivityPanelId,
  getActivityTabId,
} from "@/components/user/stats/activity/tabs/activity-tabs.helpers";

jest.mock("@/i18n/messages", () => {
  const actual =
    jest.requireActual<typeof import("@/i18n/messages")>("@/i18n/messages");
  return {
    ...actual,
    t: jest.fn(actual.t),
  };
});

const translateMock = t as jest.MockedFunction<typeof t>;

describe("UserPageActivityTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders label and handles click", async () => {
    const user = userEvent.setup();
    const setActive = jest.fn();
    render(
      <UserPageActivityTab
        tab={USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS}
        activeTab={USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY}
        setActiveTab={setActive}
        locale="de-DE"
        onKeyDown={jest.fn()}
      />
    );
    const btn = screen.getByRole("tab", {
      name: "Distributions",
    });
    expect(translateMock).toHaveBeenCalledWith(
      "de-DE",
      "user.collected.stats.activityTabs.distributions"
    );
    expect(btn).toHaveClass("tw-bg-transparent", { exact: false });
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
        locale="fr-FR"
        onKeyDown={jest.fn()}
      />
    );
    const btn = screen.getByRole("tab", {
      name: "Wallet Activity",
    });
    expect(translateMock).toHaveBeenCalledWith(
      "fr-FR",
      "user.collected.stats.activityTabs.walletActivity"
    );
    expect(btn.className).toContain("tw-bg-white/[0.08]");
    expect(btn).toHaveAttribute("aria-selected", "true");
    expect(btn).toHaveAttribute("tabIndex", "0");
  });
});
