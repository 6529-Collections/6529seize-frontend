import { AuthContext } from "@/components/auth/Auth";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React, { useMemo } from "react";
/* eslint-disable react/display-name */
import AboutPage from "@/app/about/[section]/page";
import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import AboutSubscriptionsProfileButton from "@/components/about/AboutSubscriptionsProfileButton";
import { AboutSection } from "@/types/enums";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (...args: Parameters<typeof mockRouterPush>) =>
      mockRouterPush(...args),
  }),
}));

const mockRouterPush = jest.fn();
const mockSeizeConnectFresh = jest.fn();
const PROFILE_SUBSCRIPTIONS_PENDING_NAVIGATION_KEY =
  "6529:profile-subscriptions-pending-navigation";
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    seizeConnectFresh: mockSeizeConnectFresh,
  }),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: true }),
}));

jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({ appWalletsSupported: false }),
}));

let country = "DE";
let optionalCookieConsentCountry: string | undefined = "DE";
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country }),
  useOptionalCookieConsent: () =>
    optionalCookieConsentCountry === undefined
      ? undefined
      : { country: optionalCookieConsentCountry },
}));

const setTitle = jest.fn();
const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contextValue = useMemo(() => ({ setTitle }) as any, [setTitle]);
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const openContentsMenu = () => {
  fireEvent.click(
    screen.getByRole("button", {
      name: /open about contents navigation/i,
    })
  );
};

const renderAboutSection = async (section: AboutSection) => {
  const props: Parameters<typeof AboutPage>[0] = {
    params: Promise.resolve({ section }),
  };
  const element = await AboutPage(props);

  render(element, { wrapper: Wrapper });
};

describe("About contents dropdown", () => {
  const setCookieCountry = (nextCountry: string) => {
    country = nextCountry;
    optionalCookieConsentCountry = nextCountry;
  };

  const clearOptionalCookieConsent = () => {
    optionalCookieConsentCountry = undefined;
  };

  beforeEach(() => {
    setCookieCountry("DE");
    mockRouterPush.mockClear();
    mockSeizeConnectFresh.mockClear();
    mockSeizeConnectFresh.mockResolvedValue(undefined);
    globalThis.sessionStorage?.clear();
    jest.useRealTimers();
  });

  afterEach(() => {
    globalThis.sessionStorage?.clear();
    jest.useRealTimers();
  });

  it("hides subscriptions row when iOS users are not in the US", async () => {
    await renderAboutSection(AboutSection.MEMES);

    openContentsMenu();

    expect(screen.queryByText("Subscription Minting")).toBeNull();
  });

  it("shows subscriptions row for iOS users in the US", async () => {
    setCookieCountry("US");
    await renderAboutSection(AboutSection.MEMES);

    openContentsMenu();

    expect(screen.getAllByText("Subscription Minting").length).toBeGreaterThan(
      0
    );
  });

  it("shows only the current page in the sticky trigger", async () => {
    await renderAboutSection(AboutSection.PRIMARY_ADDRESS);

    const trigger = screen.getByRole("button", {
      name: /open about contents navigation/i,
    });

    expect(trigger).toHaveTextContent("Primary Address");
    expect(trigger).not.toHaveTextContent("Contents");
  });

  it("separates dropdown items by category", async () => {
    setCookieCountry("US");
    await renderAboutSection(AboutSection.MEMES);

    openContentsMenu();

    expect(screen.getByText("About 6529")).toBeInTheDocument();
    expect(screen.getByText("Collections & Minting")).toBeInTheDocument();
    expect(screen.getByText("Network & Reputation")).toBeInTheDocument();
    expect(screen.getByText("Delegation & Wallets")).toBeInTheDocument();
    expect(screen.getByText("Data & Developer Tools")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
    expect(screen.queryByText("Mission")).toBeNull();
  });

  it("shows the menu heading without its own divider", async () => {
    setCookieCountry("US");
    await renderAboutSection(AboutSection.MEMES);

    openContentsMenu();

    const heading = screen.getByText("About");

    expect(heading.parentElement).not.toHaveClass("tw-border-b");
  });

  it("does not link to retired release notes page", async () => {
    setCookieCountry("US");
    await renderAboutSection(AboutSection.MEMES);

    openContentsMenu();

    expect(screen.queryByText("Release Notes")).toBeNull();
  });

  it("keeps cookie policy reachable from the contents menu", async () => {
    setCookieCountry("US");
    await renderAboutSection(AboutSection.MEMES);
    openContentsMenu();

    expect(
      screen.getByRole("menuitem", { name: /go to page: cookie policy/i })
    ).toHaveAttribute("href", "/about/cookie-policy");
  });

  it("links to network resource pages without moving their paths", async () => {
    setCookieCountry("US");
    await renderAboutSection(AboutSection.MEMES);
    openContentsMenu();

    expect(
      screen.getByRole("menuitem", { name: "Go to page: TDH" })
    ).toHaveAttribute("href", "/network/tdh");
    expect(
      screen.getByRole("menuitem", { name: /go to page: xtdh overview/i })
    ).toHaveAttribute("href", "/network/xtdh");
    expect(
      screen.getByRole("menuitem", {
        name: /go to page: xtdh allocations dashboard/i,
      })
    ).toHaveAttribute("href", "/xtdh");
    expect(
      screen.getByRole("menuitem", { name: /go to page: network health/i })
    ).toHaveAttribute("href", "/network/health");
    expect(
      screen.getByRole("menuitem", {
        name: /go to page: network definitions/i,
      })
    ).toHaveAttribute("href", "/network/definitions");
    expect(
      screen.getByRole("menuitem", { name: /go to page: levels/i })
    ).toHaveAttribute("href", "/network/levels");
    expect(
      screen.getByRole("menuitem", { name: /go to page: network tdh stats/i })
    ).toHaveAttribute("href", "/network/health/network-tdh");
    expect(
      screen.getByRole("menuitem", { name: /go to page: network nerd/i })
    ).toHaveAttribute("href", "/network/nerd");
    expect(
      screen.getByRole("menuitem", { name: /go to page: prenodes/i })
    ).toHaveAttribute("href", "/network/prenodes");
    expect(
      screen.getByRole("menuitem", {
        name: /go to page: tdh historic boosts/i,
      })
    ).toHaveAttribute("href", "/network/tdh/historic-boosts");
  });

  it("marks a network resource as current when rendered on that route", () => {
    setCookieCountry("US");
    render(
      <AboutContentsDropdown currentHref="/network/health/network-tdh/?tab=tdh" />
    );

    const trigger = screen.getByRole("button", {
      name: /open about contents navigation/i,
    });
    expect(trigger).toHaveTextContent("Network TDH Stats");

    openContentsMenu();

    expect(
      screen.getByRole("menuitem", {
        name: /network tdh stats, current page/i,
      })
    ).toHaveAttribute("data-active", "true");
  });

  it("does not hide subscriptions when a network page has no cookie provider", () => {
    clearOptionalCookieConsent();
    render(<AboutContentsDropdown currentHref="/network/tdh" />);

    openContentsMenu();

    expect(
      screen.getByRole("menuitem", { name: "Go to page: Subscription Minting" })
    ).toHaveAttribute("href", "/about/subscriptions");
  });

  it("keeps mobile focus order aligned with the subscriptions dropdown layout", () => {
    setCookieCountry("US");
    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: {
              handle: "test-handle",
              normalised_handle: "test-handle",
              primary_wallet: "0x123",
              wallets: [],
            },
            isAuthenticated: true,
          } as any
        }
      >
        <AboutContentsDropdown
          currentSection={AboutSection.SUBSCRIPTIONS}
          leadingAction={<AboutSubscriptionsProfileButton />}
        />
      </AuthContext.Provider>
    );

    const profileLink = screen.getByRole("link", {
      name: /manage/i,
    });
    const trigger = screen.getByRole("button", {
      name: /open about contents navigation/i,
    });
    const menuTrigger = screen.getByTestId("about-contents-menu-trigger");
    const leadingAction = screen.getByTestId("about-contents-leading-action");

    expect(profileLink).toHaveAttribute("href", "/test-handle/subscriptions");
    expect(
      trigger.compareDocumentPosition(profileLink) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(menuTrigger).toHaveClass("tw-order-1", "sm:tw-order-2");
    expect(leadingAction).toHaveClass("tw-order-2", "sm:tw-order-1");
  });

  it("opens wallet connection from disconnected subscriptions action", () => {
    setCookieCountry("US");
    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: null,
            setToast: jest.fn(),
          } as any
        }
      >
        <AboutContentsDropdown
          currentSection={AboutSection.SUBSCRIPTIONS}
          leadingAction={<AboutSubscriptionsProfileButton />}
        />
      </AuthContext.Provider>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /connect to subscribe/i,
      })
    );

    expect(mockSeizeConnectFresh).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("disables disconnected subscriptions action during wallet connection", async () => {
    setCookieCountry("US");
    let resolveConnect!: () => void;
    mockSeizeConnectFresh.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveConnect = resolve;
        })
    );
    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: null,
            setToast: jest.fn(),
          } as any
        }
      >
        <AboutContentsDropdown
          currentSection={AboutSection.SUBSCRIPTIONS}
          leadingAction={<AboutSubscriptionsProfileButton />}
        />
      </AuthContext.Provider>
    );

    const connectButton = screen.getByRole("button", {
      name: /connect to subscribe/i,
    });

    fireEvent.click(connectButton);
    expect(connectButton).toBeDisabled();
    fireEvent.click(connectButton);
    expect(mockSeizeConnectFresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveConnect();
    });

    await waitFor(() => {
      expect(connectButton).not.toBeDisabled();
    });
  });

  it("routes to profile subscriptions after connecting from subscriptions action", async () => {
    setCookieCountry("US");
    const requestAuth = jest.fn(async () => ({ success: true }));
    const setToast = jest.fn();
    const renderButton = (
      connectedProfile: unknown,
      isAuthenticated = false
    ) => (
      <AuthContext.Provider
        value={
          {
            connectedProfile,
            isAuthenticated,
            requestAuth,
            setToast,
          } as any
        }
      >
        <AboutContentsDropdown
          currentSection={AboutSection.SUBSCRIPTIONS}
          leadingAction={<AboutSubscriptionsProfileButton />}
        />
      </AuthContext.Provider>
    );
    const { rerender } = render(renderButton(null));

    fireEvent.click(
      screen.getByRole("button", {
        name: /connect to subscribe/i,
      })
    );
    rerender(
      renderButton(
        {
          handle: "test-handle",
          normalised_handle: "test-handle",
          primary_wallet: "0x123",
          wallets: [],
        },
        false
      )
    );

    await waitFor(() => {
      expect(requestAuth).toHaveBeenCalledTimes(1);
      expect(mockRouterPush).toHaveBeenCalledWith("/test-handle/subscriptions");
    });
    expect(
      globalThis.sessionStorage.getItem(
        PROFILE_SUBSCRIPTIONS_PENDING_NAVIGATION_KEY
      )
    ).toBeNull();
  });

  it("preserves subscriptions redirect through connect/auth remounts", async () => {
    setCookieCountry("US");
    const requestAuth = jest.fn(async () => ({ success: true }));
    const setToast = jest.fn();
    const connectedProfile = {
      handle: "test-handle",
      normalised_handle: "test-handle",
      primary_wallet: "0x123",
      wallets: [],
    };
    const renderButton = (
      connectedProfileValue: unknown,
      isAuthenticated = false
    ) => (
      <AuthContext.Provider
        value={
          {
            connectedProfile: connectedProfileValue,
            isAuthenticated,
            requestAuth,
            setToast,
          } as any
        }
      >
        <AboutContentsDropdown
          currentSection={AboutSection.SUBSCRIPTIONS}
          leadingAction={<AboutSubscriptionsProfileButton />}
        />
      </AuthContext.Provider>
    );
    const firstRender = render(renderButton(null));

    fireEvent.click(
      screen.getByRole("button", {
        name: /connect to subscribe/i,
      })
    );
    firstRender.unmount();

    render(renderButton(connectedProfile, false));

    await waitFor(() => {
      expect(requestAuth).toHaveBeenCalledTimes(1);
      expect(mockRouterPush).toHaveBeenCalledWith("/test-handle/subscriptions");
    });
  });

  it("waits for successful auth before routing to profile subscriptions", async () => {
    setCookieCountry("US");
    const requestAuth = jest.fn(async () => ({ success: false }));
    const connectedProfile = {
      handle: "test-handle",
      normalised_handle: "test-handle",
      primary_wallet: "0x123",
      wallets: [],
    };

    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile,
            isAuthenticated: false,
            requestAuth,
            setToast: jest.fn(),
          } as any
        }
      >
        <AboutContentsDropdown
          currentSection={AboutSection.SUBSCRIPTIONS}
          leadingAction={<AboutSubscriptionsProfileButton />}
        />
      </AuthContext.Provider>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /connect to subscribe/i,
      })
    );

    await waitFor(() => {
      expect(requestAuth).toHaveBeenCalledTimes(1);
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("does not route to a stale profile if the connected profile changes during auth", async () => {
    setCookieCountry("US");
    let resolveAuth!: (value: { success: boolean }) => void;
    const requestAuth = jest.fn(
      () =>
        new Promise<{ success: boolean }>((resolve) => {
          resolveAuth = resolve;
        })
    );
    const renderButton = (handle: string) => (
      <AuthContext.Provider
        value={
          {
            connectedProfile: {
              handle,
              normalised_handle: handle,
              primary_wallet: "0x123",
              wallets: [],
            },
            isAuthenticated: false,
            requestAuth,
            setToast: jest.fn(),
          } as any
        }
      >
        <AboutContentsDropdown
          currentSection={AboutSection.SUBSCRIPTIONS}
          leadingAction={<AboutSubscriptionsProfileButton />}
        />
      </AuthContext.Provider>
    );
    const { rerender } = render(renderButton("test-handle"));

    fireEvent.click(
      screen.getByRole("button", { name: /connect to subscribe/i })
    );
    await waitFor(() => {
      expect(requestAuth).toHaveBeenCalledTimes(1);
    });

    rerender(renderButton("other-handle"));
    await act(async () => {
      resolveAuth({ success: true });
    });

    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("does not keep a stale subscriptions redirect after an abandoned connection", () => {
    jest.useFakeTimers();
    setCookieCountry("US");
    const renderButton = (connectedProfile: unknown) => (
      <AuthContext.Provider
        value={
          {
            connectedProfile,
            setToast: jest.fn(),
          } as any
        }
      >
        <AboutContentsDropdown
          currentSection={AboutSection.SUBSCRIPTIONS}
          leadingAction={<AboutSubscriptionsProfileButton />}
        />
      </AuthContext.Provider>
    );
    const { rerender } = render(renderButton(null));

    fireEvent.click(
      screen.getByRole("button", {
        name: /connect to subscribe/i,
      })
    );
    act(() => {
      jest.advanceTimersByTime(5 * 60_000);
    });
    expect(
      globalThis.sessionStorage.getItem(
        PROFILE_SUBSCRIPTIONS_PENDING_NAVIGATION_KEY
      )
    ).toBeNull();

    rerender(
      renderButton({
        handle: "test-handle",
        normalised_handle: "test-handle",
        primary_wallet: "0x123",
        wallets: [],
      })
    );

    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("does not resume a remounted subscriptions redirect after the timeout expires", () => {
    jest.useFakeTimers();
    setCookieCountry("US");
    const requestAuth = jest.fn(async () => ({ success: true }));
    const renderButton = (connectedProfile: unknown) => (
      <AuthContext.Provider
        value={
          {
            connectedProfile,
            requestAuth,
            setToast: jest.fn(),
          } as any
        }
      >
        <AboutContentsDropdown
          currentSection={AboutSection.SUBSCRIPTIONS}
          leadingAction={<AboutSubscriptionsProfileButton />}
        />
      </AuthContext.Provider>
    );
    const firstRender = render(renderButton(null));

    fireEvent.click(
      screen.getByRole("button", {
        name: /connect to subscribe/i,
      })
    );
    firstRender.unmount();

    const remounted = render(renderButton(null));
    act(() => {
      jest.advanceTimersByTime(5 * 60_000);
    });
    expect(
      globalThis.sessionStorage.getItem(
        PROFILE_SUBSCRIPTIONS_PENDING_NAVIGATION_KEY
      )
    ).toBeNull();

    remounted.rerender(
      renderButton({
        handle: "test-handle",
        normalised_handle: "test-handle",
        primary_wallet: "0x123",
        wallets: [],
      })
    );

    expect(requestAuth).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("uses dropdown item styling without link underlines", async () => {
    setCookieCountry("US");
    await renderAboutSection(AboutSection.MEMES);
    openContentsMenu();

    expect(
      screen.getByRole("menuitem", { name: /go to page: cookie policy/i })
    ).toHaveClass("!tw-no-underline");
  });

  it("keeps the active dropdown item to a checkmark and blue text", async () => {
    setCookieCountry("US");
    await renderAboutSection(AboutSection.MEMES);
    openContentsMenu();

    const currentItem = screen.getByRole("menuitem", {
      name: /the memes, current page/i,
    });

    expect(currentItem).toHaveClass("tw-text-primary-300");
    expect(currentItem).not.toHaveClass("tw-bg-primary-500/10");
    expect(currentItem).not.toHaveClass("tw-ring-1");
    expect(currentItem.querySelector("svg")).toBeInTheDocument();
  });

  it("marks tech as current on deeper tech routes", async () => {
    setCookieCountry("US");
    await renderAboutSection(AboutSection.TECH);
    openContentsMenu();

    expect(
      screen.getByRole("menuitem", { name: /tech, current page/i })
    ).toHaveAttribute("data-active", "true");
  });
});
