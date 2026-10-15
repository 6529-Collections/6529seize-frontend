import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageActivityTabs from "@/components/user/stats/activity/tabs/UserPageActivityTabs";
import { USER_PAGE_ACTIVITY_TAB } from "@/components/user/stats/activity/activity.types";
import { t } from "@/i18n/messages";

jest.mock("@/i18n/messages", () => {
  const actual =
    jest.requireActual<typeof import("@/i18n/messages")>("@/i18n/messages");
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

  it("reveals the selected tab after late content sizing and stops observing on unmount", () => {
    const originalObserver = globalThis.ResizeObserver;
    let resize: ResizeObserverCallback | undefined;
    const observe = jest.fn();
    const disconnect = jest.fn();
    const observer = { observe, disconnect, unobserve: jest.fn() };
    globalThis.ResizeObserver = jest.fn().mockImplementation((callback) => {
      resize = callback;
      return observer;
    });
    try {
      const view = render(
        <UserPageActivityTabs
          activeTab={USER_PAGE_ACTIVITY_TAB.TDH_HISTORY}
          setActiveTab={jest.fn()}
          locale="en-US"
        />
      );
      const list = screen.getByRole("tablist");
      const selected = screen.getByRole("tab", { name: "TDH History" });
      const scrollTo = jest.fn();
      Object.defineProperties(list, {
        clientWidth: { configurable: true, value: 200 },
        scrollLeft: { configurable: true, value: 0 },
        scrollTo: { configurable: true, value: scrollTo },
      });
      Object.defineProperties(selected, {
        offsetLeft: { configurable: true, value: 220 },
        offsetWidth: { configurable: true, value: 100 },
      });
      expect(observe).toHaveBeenCalledWith(list);
      expect(observe).toHaveBeenCalledWith(list.firstElementChild);
      expect(resize).toBeDefined();
      resize!([], observer);
      expect(scrollTo).toHaveBeenCalledWith({ left: 120 });
      // A narrower panel must reveal the tab again without a window resize.
      Object.defineProperty(list, "clientWidth", { value: 150 });
      resize!([], observer);
      expect(scrollTo).toHaveBeenLastCalledWith({ left: 170 });
      view.unmount();
      expect(disconnect).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.ResizeObserver = originalObserver;
    }
  });
});
