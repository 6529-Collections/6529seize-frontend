import { AuthContext } from "@/components/auth/Auth";
import { fireEvent, render, screen } from "@testing-library/react";
import React, { useMemo } from "react";
/* eslint-disable react/display-name */
import AboutPage from "@/app/about/[section]/page";
import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import { AboutSection } from "@/types/enums";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
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
      screen.getByRole("menuitem", { name: "Go to page: Subscriptions" })
    ).toHaveAttribute("href", "/about/subscriptions");
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
