import { render, screen } from "@testing-library/react";
import React from "react";
import AppHeader from "@/components/header/AppHeader";

jest.mock("@/components/header/AppSidebar", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="sidebar" {...props} />,
}));
jest.mock("@/components/header/header-search/HeaderSearchButton", () => ({
  __esModule: true,
  default: () => <div data-testid="search" />,
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/useIdentity", () => ({ useIdentity: jest.fn() }));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("@/components/navigation/ViewContext", () => ({
  useViewContext: jest.fn(),
}));
jest.mock("@/hooks/useWaveById", () => ({ useWaveById: jest.fn() }));
jest.mock("@/contexts/NavigationHistoryContext", () => ({
  useNavigationHistoryContext: jest.fn(),
}));
jest.mock("@/components/navigation/BackButton", () => ({
  __esModule: true,
  default: () => <div data-testid="back" />,
}));
jest.mock("@/components/utils/Spinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}));
jest.mock("@/components/header/HeaderActionButtons", () => ({
  __esModule: true,
  default: () => <div data-testid="actions" />,
}));

const {
  useSeizeConnectContext,
} = require("@/components/auth/SeizeConnectContext");
const { useAuth } = require("@/components/auth/Auth");
const { useIdentity } = require("@/hooks/useIdentity");
const { useRouter, usePathname, useSearchParams } = require("next/navigation");
const { useViewContext } = require("@/components/navigation/ViewContext");
const { useWaveById } = require("@/hooks/useWaveById");
const {
  useNavigationHistoryContext,
} = require("@/contexts/NavigationHistoryContext");

function setup(opts: any) {
  (useSeizeConnectContext as jest.Mock).mockReturnValue({
    address: opts.address,
  });
  (useAuth as jest.Mock).mockReturnValue({ activeProfileProxy: opts.proxy });
  (useIdentity as jest.Mock).mockReturnValue({ profile: opts.profile });
  (useViewContext as jest.Mock).mockReturnValue({
    activeView: opts.activeView ?? null,
    homeActiveTab: opts.homeActiveTab ?? "latest",
  });
  (useNavigationHistoryContext as jest.Mock).mockReturnValue({
    canGoBack: opts.canGoBack ?? false,
  });
  (useWaveById as jest.Mock).mockReturnValue({
    wave: opts.wave,
    isLoading: false,
    isFetching: false,
  });
  (useRouter as jest.Mock).mockReturnValue({
    push: jest.fn(),
  });
  (usePathname as jest.Mock).mockReturnValue(opts.asPath);
  (useSearchParams as jest.Mock).mockReturnValue({
    get: (param: string) => opts.query?.[param],
  });
  return render(<AppHeader />);
}

describe("AppHeader", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows menu icon when not connected", () => {
    setup({ address: null, asPath: "/home" });
    expect(
      screen.getByRole("button", { name: "Open menu" }).querySelector("svg")
    ).toBeInTheDocument();
  });

  it("shows back button and wave title when wave id is present", () => {
    const wave = { id: "w1", name: "WaveOne" };
    setup({
      address: "0xabc",
      wave,
      query: { wave: "w1" },
      asPath: "/waves?wave=w1",
    });
    expect(screen.getByTestId("back")).toBeInTheDocument();
    expect(screen.getByText("WaveOne")).toBeInTheDocument();
  });

  it("shows profile image when connected without back button", () => {
    setup({
      address: "0xabc",
      profile: { pfp: "pfp.png" },
      asPath: "/home",
      activeView: "messages",
    });
    const img = screen.getByRole("img", { name: "pfp" });
    expect(img).toHaveAttribute("src", "pfp.png");
  });

  it("formats meme titles from path", () => {
    setup({ address: "0x1", asPath: "/the-memes/123" });
    expect(screen.getByText("The Memes #123")).toBeInTheDocument();
  });

  it("shows My Stream title on home feed tab", () => {
    setup({ asPath: "/", homeActiveTab: "feed" });
    expect(screen.getByText("My Stream")).toBeInTheDocument();
  });
});
