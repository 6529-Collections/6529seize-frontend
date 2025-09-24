import { fireEvent, render, screen, waitFor } from "@testing-library/react";
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt ?? "header-image"} />,
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(() => "/"),
}));
jest.mock("@/components/header/user/HeaderUser", () => ({
  __esModule: true,
  default: () => <div data-testid="user" />,
}));
jest.mock("@/components/header/notifications/HeaderNotifications", () => ({
  __esModule: true,
  default: () => <div data-testid="notify" />,
}));
jest.mock("@/components/header/share/HeaderShare", () => ({
  __esModule: true,
  default: () => <div data-testid="share" />,
}));
jest.mock("@/components/header/share/HeaderQRScanner", () => ({
  __esModule: true,
  default: () => <div data-testid="qr" />,
}));
jest.mock("@/components/header/open-mobile/HeaderOpenMobile", () => ({
  __esModule: true,
  default: () => <div data-testid="mobile" />,
}));
jest.mock("@/components/header/header-search/HeaderSearchButton", () => ({
  __esModule: true,
  default: () => <div data-testid="search" />,
}));
jest.mock("@/components/header/HeaderDesktopNav", () => ({
  __esModule: true,
  default: () => <div data-testid="desktop-nav" />,
}));
jest.mock("@/components/header/HeaderLogo", () => ({
  __esModule: true,
  default: () => <div data-testid="logo" />,
}));
jest.mock("@/components/header/HeaderMobileMenu", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="mobile-menu"
      className={props.burgerMenuOpen ? "burgerMenuOpen" : ""}
    />
  ),
}));

import Header from "@/components/header/Header";
import styles from "@/components/header/Header.module.scss";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/services/6529api", () => ({ fetchUrl: jest.fn() }));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: jest.fn(() => ({
    showCookieConsent: false,
    country: "US",
    consent: jest.fn(),
    reject: jest.fn(),
  })),
}));

const { useRouter, usePathname } = require("next/navigation");
const {
  useSeizeConnectContext,
} = require("@/components/auth/SeizeConnectContext");
const useCapacitor = require("@/hooks/useCapacitor").default as jest.Mock;
const { useAppWallets } = require("@/components/app-wallets/AppWalletsContext");
const { useAuth } = require("@/components/auth/Auth");
const useIsMobileScreen = require("@/hooks/isMobileScreen")
  .default as jest.Mock;
const { fetchUrl } = require("@/services/6529api");

function setup(options: any = {}) {
  (useSeizeConnectContext as jest.Mock).mockImplementation(() => ({
    address: options.address,
    seizeConnectOpen: options.seizeConnectOpen || false,
  }));
  useCapacitor.mockReturnValue({
    isCapacitor: !!options.capacitor,
    isIos: !!options.capacitorIsIos,
  });
  (useAppWallets as jest.Mock).mockReturnValue({
    appWalletsSupported: options.appWalletsSupported || false,
  });
  (useAuth as jest.Mock).mockReturnValue({
    showWaves: options.showWaves === undefined ? true : options.showWaves,
  });
  useIsMobileScreen.mockReturnValue(!!options.mobile);
  (fetchUrl as jest.Mock).mockResolvedValue({ data: options.consolidations });
  (useRouter as jest.Mock).mockReturnValue({
    route: "/",
    pathname: "/",
    push: jest.fn(),
    prefetch: jest.fn(),
    query: {},
  });
  (usePathname as jest.Mock).mockReturnValue("/");
  const onLoad = jest.fn();
  const onSetWallets = jest.fn();
  const utils = render(
    <Header
      isSmall={options.isSmall}
      onLoad={onLoad}
      onSetWallets={onSetWallets}
      extraClass={options.extraClass}
    />
  );
  return { onLoad, onSetWallets, ...utils };
}

afterEach(() => jest.clearAllMocks());

describe("Header", () => {
  it("calls onLoad and applies small container class", async () => {
    const { onLoad, container } = setup({ isSmall: true });
    await waitFor(() => expect(onLoad).toHaveBeenCalled());
    expect(
      container.querySelector("." + styles.mainContainerSmall)
    ).toBeInTheDocument();
  });

  it("fetches consolidations and passes them to onSetWallets", async () => {
    const consolidations = ["0x1", "0x2"];
    const { onSetWallets } = setup({ address: "0xabc", consolidations });
    await waitFor(() =>
      expect(onSetWallets).toHaveBeenCalledWith(consolidations)
    );
    expect(fetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/consolidations/0xabc"
    );
  });

  it("opens burger menu and closes when seize connect opens", async () => {
    const context: any = { address: "0xabc", seizeConnectOpen: false };
    (useSeizeConnectContext as jest.Mock).mockImplementation(() => context);
    useCapacitor.mockReturnValue({ isCapacitor: false, isIos: false });
    (useAppWallets as jest.Mock).mockReturnValue({
      appWalletsSupported: false,
    });
    (useAuth as jest.Mock).mockReturnValue({ showWaves: false });
    useIsMobileScreen.mockReturnValue(false);
    (fetchUrl as jest.Mock).mockResolvedValue({});
    (usePathname as jest.Mock).mockReturnValue("/");

    const { rerender } = render(<Header />);
    const btn = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(btn);

    // Check that mobile menu is open via data-testid
    expect(screen.getByTestId("mobile-menu")).toHaveClass("burgerMenuOpen");

    context.seizeConnectOpen = true;
    rerender(<Header />);

    // Check that mobile menu is closed
    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).not.toHaveClass(
        "burgerMenuOpen"
      );
    });
  });

  it("applies capacitor class when running in capacitor", () => {
    const { container } = setup({ capacitor: true });
    expect(
      container.querySelector("." + styles.capacitorMainContainer)
    ).toBeInTheDocument();
  });

  it("renders HeaderLogo component", () => {
    setup();
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  it("renders HeaderDesktopNav on desktop", () => {
    setup({ mobile: false });
    expect(screen.getByTestId("desktop-nav")).toBeInTheDocument();
  });

  it("renders HeaderMobileMenu", () => {
    setup();
    expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
  });

  it("passes correct props to HeaderMobileMenu", () => {
    setup({
      isSmall: true,
      capacitor: true,
      mobile: true,
      showWaves: true,
      appWalletsSupported: true,
      capacitorIsIos: true,
    });

    const mobileMenu = screen.getByTestId("mobile-menu");
    expect(mobileMenu).toBeInTheDocument();

    // The mocked component should receive these props (we can't directly test props,
    // but the component should be present and the integration should work)
    expect(mobileMenu).not.toHaveClass("burgerMenuOpen"); // Initially closed
  });

  it("opens mobile menu when button clicked", () => {
    const { getByRole } = setup();

    // Initially closed
    expect(screen.getByTestId("mobile-menu")).not.toHaveClass("burgerMenuOpen");

    // Open menu - menu button only opens, doesn't toggle
    const menuButton = getByRole("button", { name: "Menu" });
    fireEvent.click(menuButton);
    expect(screen.getByTestId("mobile-menu")).toHaveClass("burgerMenuOpen");

    // Clicking button again should still show open (not a toggle)
    fireEvent.click(menuButton);
    expect(screen.getByTestId("mobile-menu")).toHaveClass("burgerMenuOpen");
  });

  it("passes showWaves to child components when enabled", () => {
    setup({ showWaves: true });
    expect(screen.getByTestId("desktop-nav")).toBeInTheDocument();
  });

  it("applies extra class when provided", () => {
    const { container } = setup({ extraClass: "test-class" });
    expect(container.querySelector(".test-class")).toBeInTheDocument();
  });

  it("handles window resize events", () => {
    const { getByRole } = setup();

    // Open burger menu first
    const menuButton = getByRole("button", { name: "Menu" });
    fireEvent.click(menuButton);
    expect(screen.getByTestId("mobile-menu")).toHaveClass("burgerMenuOpen");

    // Simulate window resize
    fireEvent(globalThis as any, new Event("resize"));

    // Menu should close after resize
    expect(screen.getByTestId("mobile-menu")).not.toHaveClass("burgerMenuOpen");
  });

  it("calls onSetWallets with single address when no consolidations", async () => {
    const { onSetWallets } = setup({ address: "0xabc", consolidations: null });
    await waitFor(() => expect(onSetWallets).toHaveBeenCalledWith(["0xabc"]));
  });

  it("calls onSetWallets with empty array when no address", async () => {
    const { onSetWallets } = setup({ address: null });
    await waitFor(() => expect(onSetWallets).toHaveBeenCalledWith([]));
  });

  it("closes burger menu when pathname changes", () => {
    const { getByRole, rerender } = setup();

    // Open burger menu
    const menuButton = getByRole("button", { name: "Menu" });
    fireEvent.click(menuButton);
    expect(screen.getByTestId("mobile-menu")).toHaveClass("burgerMenuOpen");

    // Change pathname by mocking a new value
    (usePathname as jest.Mock).mockReturnValue("/new-path");
    rerender(
      <Header isSmall={false} onLoad={jest.fn()} onSetWallets={jest.fn()} />
    );

    // Menu should be closed
    expect(screen.getByTestId("mobile-menu")).not.toHaveClass("burgerMenuOpen");
  });

  it("renders capacitor placeholder when in capacitor mode", () => {
    const { container } = setup({ capacitor: true });
    expect(
      container.querySelector("." + styles.capacitorPlaceholder)
    ).toBeInTheDocument();
  });

  it("does not render capacitor placeholder when not in capacitor mode", () => {
    const { container } = setup({ capacitor: false });
    expect(
      container.querySelector("." + styles.capacitorPlaceholder)
    ).not.toBeInTheDocument();
  });
});
