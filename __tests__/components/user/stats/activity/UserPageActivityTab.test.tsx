import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageActivityTab from "@/components/user/stats/activity/tabs/UserPageActivityTab";
import { USER_PAGE_ACTIVITY_TAB } from "@/components/user/stats/activity/UserPageActivityWrapper";

describe("UserPageActivityTab", () => {
  it("renders label and handles click", async () => {
    const user = userEvent.setup();
    const setActive = jest.fn();
    render(
      <UserPageActivityTab
        tab={USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS}
        activeTab={USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY}
        setActiveTab={setActive}
      />
    );
    const btn = screen.getByRole("button", { name: "Distributions" });
    expect(btn).toHaveClass("tw-bg-iron-950", { exact: false });
    await user.click(btn);
    expect(setActive).toHaveBeenCalledWith(USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS);
  });

  it("highlights when active", () => {
    render(
      <UserPageActivityTab
        tab={USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY}
        activeTab={USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY}
        setActiveTab={jest.fn()}
      />
    );
    const btn = screen.getByRole("button", { name: "Wallet Activity" });
    expect(btn.className).toContain("tw-bg-iron-800");
  });
});
