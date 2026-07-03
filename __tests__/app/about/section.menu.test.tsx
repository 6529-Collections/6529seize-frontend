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
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    seizeConnectFresh: mockSeizeConnectFresh,
  }),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: true }),
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

    expect(screen.queryByText("Subscriptions")).toBeNull();
  });

  it("shows subscriptions row for iOS users in the US", async () => {
    setCookieCountry("US");
    await renderAboutSection(AboutSection.MEMES);

    openContentsMenu();

    expect(screen.getAllByText("Subscriptions").length).toBeGreaterThan(0);
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

    expect(screen.getByText("Collections")).toBeInTheDocument();
    expect(screen.getByText("Delegation")).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
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

  it("links to TDH and xTDH resource pages without moving their paths", async () => {
    setCookieCountry("US");
    await renderAboutSection(AboutSection.MEMES);
    openContentsMenu();

    expect(
      screen.getByRole("menuitem", { name: /go to page: tdh/i })
    ).toHaveAttribute("href", "/network/tdh");
    expect(
      screen.getByRole("menuitem", { name: /go to page: xtdh/i })
    ).toHaveAttribute("href", "/network/xtdh");
    expect(
      screen.getByRole("menuitem", { name: /go to page: health/i })
    ).toHaveAttribute("href", "/network/health");
    expect(
      screen.getByRole("menuitem", { name: /go to page: definitions/i })
    ).toHaveAttribute("href", "/network/definitions");
    expect(
      screen.getByRole("menuitem", { name: /go to page: levels/i })
    ).toHaveAttribute("href", "/network/levels");
    expect(
      screen.getByRole("menuitem", { name: /go to page: network stats/i })
    ).toHaveAttribute("href", "/network/health/network-tdh");
  });

  it("marks a network resource as current when rendered on that route", () => {
    setCookieCountry("US");
    render(
      <AboutContentsDropdown currentHref="/network/health/network-tdh/?tab=tdh" />
    );

    const trigger = screen.getByRole("button", {
      name: /open about contents navigation/i,
    });
    expect(trigger).toHaveTextContent("Network Stats");

    openContentsMenu();

    expect(
      screen.getByRole("menuitem", { name: /network stats, current page/i })
    ).toHaveAttribute("data-active", "true");
  });

  it("does not hide subscriptions when a network page has no cookie provider", () => {
    clearOptionalCookieConsent();
    render(<AboutContentsDropdown currentHref="/network/tdh" />);

    openContentsMenu();

    expect(
      screen.getByRole("menuitem", { name: /go to page: subscriptions/i })
    ).toHaveAttribute("href", "/about/subscriptions");
  });

  it("shows connected subscriptions action before the subscriptions dropdown", () => {
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
      name: /manage subscriptions/i,
    });
    const trigger = screen.getByRole("button", {
      name: /open about contents navigation/i,
    });

    expect(profileLink).toHaveAttribute("href", "/test-handle/subscriptions");
    expect(
      profileLink.compareDocumentPosition(trigger) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
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

    expect(mockRouterPush).not.toHaveBeenCalled();

    rerender(
      renderButton(
        {
          handle: "test-handle",
          normalised_handle: "test-handle",
          primary_wallet: "0x123",
          wallets: [],
        },
        true
      )
    );

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/test-handle/subscriptions");
    });
  });

  it("preserves subscriptions redirect through connect/auth remounts", async () => {
    setCookieCountry("US");
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

    const { rerender } = render(renderButton(connectedProfile, false));
    expect(mockRouterPush).not.toHaveBeenCalled();

    rerender(renderButton(connectedProfile, true));

    await waitFor(() => {
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
        name: /manage subscriptions/i,
      })
    );

    await waitFor(() => {
      expect(requestAuth).toHaveBeenCalledTimes(1);
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
