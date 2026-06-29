import { AuthContext } from "@/components/auth/Auth";
import { fireEvent, render, screen } from "@testing-library/react";
import React, { useMemo } from "react";
/* eslint-disable react/display-name */
import AboutPage from "@/app/about/[section]/page";
import { AboutSection } from "@/types/enums";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: true }),
}));

let country = "DE";
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country }),
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
  beforeEach(() => {
    country = "DE";
  });

  it("hides subscriptions row when iOS users are not in the US", async () => {
    await renderAboutSection(AboutSection.MEMES);

    openContentsMenu();

    expect(screen.queryByText("Subscriptions")).toBeNull();
  });

  it("shows subscriptions row for iOS users in the US", async () => {
    country = "US";
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
    country = "US";
    await renderAboutSection(AboutSection.MEMES);

    openContentsMenu();

    expect(screen.getByText("Collections")).toBeInTheDocument();
    expect(screen.getByText("Delegation")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
  });

  it("does not link to retired release notes page", async () => {
    country = "US";
    await renderAboutSection(AboutSection.MEMES);

    openContentsMenu();

    expect(screen.queryByText("Release Notes")).toBeNull();
  });

  it("keeps cookie policy reachable from the contents menu", async () => {
    country = "US";
    await renderAboutSection(AboutSection.MEMES);
    openContentsMenu();

    expect(
      screen.getByRole("menuitem", { name: /go to page: cookie policy/i })
    ).toHaveAttribute("href", "/about/cookie-policy");
  });

  it("links to TDH and xTDH resource pages without moving their paths", async () => {
    country = "US";
    await renderAboutSection(AboutSection.MEMES);
    openContentsMenu();

    expect(
      screen.getByRole("menuitem", { name: /go to page: tdh/i })
    ).toHaveAttribute("href", "/network/tdh");
    expect(
      screen.getByRole("menuitem", { name: /go to page: xtdh/i })
    ).toHaveAttribute("href", "/network/xtdh");
  });

  it("uses dropdown item styling without link underlines", async () => {
    country = "US";
    await renderAboutSection(AboutSection.MEMES);
    openContentsMenu();

    expect(
      screen.getByRole("menuitem", { name: /go to page: cookie policy/i })
    ).toHaveClass("!tw-no-underline");
  });

  it("marks tech as current on deeper tech routes", async () => {
    country = "US";
    await renderAboutSection(AboutSection.TECH);
    openContentsMenu();

    expect(
      screen.getByRole("menuitem", { name: /tech, current about page/i })
    ).toHaveAttribute("data-active", "true");
  });
});
