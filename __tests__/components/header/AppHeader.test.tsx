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
  useParams: jest.fn(),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: jest.fn(),
}));
jest.mock("@/hooks/useWaveById", () => ({ useWaveById: jest.fn() }));
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
jest.mock("@/contexts/NavigationHistoryContext", () => ({
  useNavigationHistoryContext: jest.fn(),
}));

const {
  useSeizeConnectContext,
} = require("@/components/auth/SeizeConnectContext");
const {
  useNavigationHistoryContext,
} = require("@/contexts/NavigationHistoryContext");
const { useAuth } = require("@/components/auth/Auth");
const { useIdentity } = require("@/hooks/useIdentity");
const { useRouter, usePathname, useSearchParams, useParams } = require("next/navigation");
const { useMyStreamOptional } = require("@/contexts/wave/MyStreamContext");
const { useWaveById } = require("@/hooks/useWaveById");

function setup(opts: any) {
  (useSeizeConnectContext as jest.Mock).mockReturnValue({
    address: opts.address,
  });
  (useAuth as jest.Mock).mockReturnValue({ activeProfileProxy: opts.proxy });
  (useIdentity as jest.Mock).mockReturnValue({ profile: opts.profile });
  (useMyStreamOptional as jest.Mock).mockReturnValue(
    opts.wave
      ? { activeWave: { id: opts.wave.id } }
      : { activeWave: { id: null } }
  );
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
  (useParams as jest.Mock).mockReturnValue(opts.params ?? {});
  (useNavigationHistoryContext as jest.Mock).mockReturnValue({
    canGoBack: opts.canGoBack ?? false,
  });
  return render(<AppHeader />);
}

describe("AppHeader", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows menu icon on root page even with history", () => {
    setup({ address: null, asPath: "/notifications", canGoBack: true });
    expect(screen.queryByTestId("back")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("shows back button on profile page when canGoBack is true", () => {
    setup({
      address: "0xabc",
      asPath: "/johndoe",
      params: { user: "johndoe" },
      canGoBack: true,
    });
    expect(screen.getByTestId("back")).toBeInTheDocument();
  });

  it("shows menu icon on profile page when canGoBack is false", () => {
    setup({
      address: "0xabc",
      asPath: "/johndoe",
      params: { user: "johndoe" },
      canGoBack: false,
    });
    expect(screen.queryByTestId("back")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("shows back button inside wave regardless of canGoBack", () => {
    const wave = { id: "w1", name: "WaveOne" };
    setup({
      address: "0xabc",
      wave,
      query: { wave: "w1" },
      asPath: "/waves?wave=w1",
      canGoBack: false,
    });
    expect(screen.getByTestId("back")).toBeInTheDocument();
    expect(screen.getByText("WaveOne")).toBeInTheDocument();
  });

  it("shows profile image on waves root page", () => {
    setup({
      address: "0xabc",
      profile: { pfp: "/pfp.png" },
      asPath: "/waves",
      canGoBack: true,
    });
    const img = screen.getByRole("img", { name: "pfp" });
    expect(img).toBeInTheDocument();
  });

  it("formats meme titles from path", () => {
    setup({ address: "0x1", asPath: "/the-memes/123" });
    expect(screen.getByText("The Memes #123")).toBeInTheDocument();
  });

  it("shows Waves title on waves route without wave selected", () => {
    setup({ asPath: "/waves" });
    expect(screen.getByText("Waves")).toBeInTheDocument();
  });

  it("shows Messages title on messages route without wave selected", () => {
    setup({ asPath: "/messages" });
    expect(screen.getByText("Messages")).toBeInTheDocument();
  });
});
