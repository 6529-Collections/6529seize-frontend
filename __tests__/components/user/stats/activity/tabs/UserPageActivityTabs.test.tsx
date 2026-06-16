import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageActivityTabs from "@/components/user/stats/activity/tabs/UserPageActivityTabs";
import { USER_PAGE_ACTIVITY_TAB } from "@/components/user/stats/activity/activity.types";
import { t } from "@/i18n/messages";

jest.mock("@/i18n/messages", () => {
  const actual = jest.requireActual<typeof import("@/i18n/messages")>(
    "@/i18n/messages"
  );
  return {
    ...actual,
    t: jest.fn(actual.t),
  };
});

const translateMock = t as jest.MockedFunction<typeof t>;

describe("UserPageActivityTabs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all tabs and handles click", async () => {
    const user = userEvent.setup();
    const setActive = jest.fn();
    render(
      <UserPageActivityTabs
        activeTab={USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS}
        setActiveTab={setActive}
        locale="fr-FR"
      />
    );
    expect(
      screen.getByRole("tablist", {
        name: "Activity details sections",
      })
    ).toBeInTheDocument();
    const walletBtn = screen.getByRole("tab", {
      name: "Wallet Activity",
    });
    expect(walletBtn).toBeInTheDocument();
    expect(translateMock).toHaveBeenCalledWith(
      "fr-FR",
      "user.collected.stats.activityTabs.listLabel"
    );
    expect(translateMock).toHaveBeenCalledWith(
      "fr-FR",
      "user.collected.stats.activityTabs.walletActivity"
    );
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
        locale="de-DE"
      />
    );
    screen
      .getByRole("tab", {
        name: "Distributions",
      })
      .focus();
    expect(translateMock).toHaveBeenCalledWith(
      "de-DE",
      "user.collected.stats.activityTabs.distributions"
    );

    await user.keyboard("{ArrowRight}");

    expect(setActive).toHaveBeenCalledWith(USER_PAGE_ACTIVITY_TAB.TDH_HISTORY);
  });
});
