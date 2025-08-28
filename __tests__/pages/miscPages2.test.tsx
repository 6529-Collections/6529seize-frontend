import WillowShield from "@/app/museum/genesis/willow-shield/page";
import JoinOm from "@/app/om/join-om/page";
import PartnershipRequest from "@/app/om/partnership-request/page";
import ConsolidatedMetrics from "@/app/open-data/consolidated-network-metrics/page";
import MemeSubscriptions from "@/app/open-data/meme-subscriptions/page";
import AddRememes from "@/app/rememes/add/page";
import SlideInitiatives from "@/app/slide-page/6529-initiatives/page";
import AppWalletsClient from "@/app/tools/app-wallets/page.client";
import { AppWalletsProvider } from "@/components/app-wallets/AppWalletsContext";
import { AuthContext } from "@/components/auth/Auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React, { useMemo } from "react";
import { mainnet } from "viem/chains";
import { WagmiProvider, createConfig, http } from "wagmi";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), asPath: "/" }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(() => Promise.resolve({ data: [] })),
}));
global.fetch = jest.fn(() =>
  Promise.resolve({ json: () => Promise.resolve({}) })
) as any;

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0x123",
    isConnected: true,
    seizeConnect: jest.fn(),
    seizeConnectOpen: false,
  }),
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    seizeSettings: {
      rememes_submission_tdh_threshold: 6942,
    },
  }),
}));

const TestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useMemo(() => ({ setTitle: jest.fn() } as any), []);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

describe("Miscellaneous Pages Rendering", () => {
  it("should render Willow Shield page with correct content", () => {
    render(<WillowShield />);
    expect(screen.getAllByText("WILLOW SHIELD")).toHaveLength(2);
    expect(screen.getAllByText(/Willow Shield/i)).toHaveLength(4); // Multiple instances in different elements
    expect(screen.getByText(/Mint Date: 08\/02\/2021/)).toBeInTheDocument();
  });


  it("should render Join OM page with form elements", () => {
    render(<JoinOm />);
    expect(screen.getAllByText("JOIN OM GENERATION 1")).toHaveLength(3);
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Twitter Handle/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit/i })).toBeInTheDocument();
  });

  it("should render partnership request redirect page with proper redirect message", () => {
    render(<PartnershipRequest />);
    expect(screen.getByText("You are being redirected to")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "/om/join-om/" })).toHaveAttribute("href", "/om/join-om/");
  });

  it("should render consolidated metrics page with proper title", () => {
    render(
      <TestProvider>
        <ConsolidatedMetrics />
      </TestProvider>
    );
    expect(screen.getByText("Consolidated Network Metrics")).toBeInTheDocument();
  });

  it("should render meme subscriptions page with proper title", () => {
    render(
      <TestProvider>
        <MemeSubscriptions />
      </TestProvider>
    );
    expect(screen.getByText("Meme Subscriptions")).toBeInTheDocument();
  });

  it("should render add rememes page with all required providers", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const mockConfig = createConfig({
      chains: [mainnet],
      transports: {
        [mainnet.id]: http(),
      },
    });

    render(
      <WagmiProvider config={mockConfig}>
        <QueryClientProvider client={queryClient}>
          <TestProvider>
            <AddRememes />
          </TestProvider>
        </QueryClientProvider>
      </WagmiProvider>
    );
    
    expect(screen.getByText("Add Rememe")).toBeInTheDocument();
  });

  it("should render slide initiatives redirect page with home redirect", () => {
    render(<SlideInitiatives />);
    expect(screen.getByText("You are being redirected to")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "/" })).toHaveAttribute("href", "/");
  });

  it("should render app wallets page with proper providers", () => {
    render(
      <TestProvider>
        <AppWalletsProvider>
          <AppWalletsClient />
        </AppWalletsProvider>
      </TestProvider>
    );
    // Text is split across spans, so check for both parts
    expect(screen.getByText("App")).toBeInTheDocument();
    expect(screen.getByText("Wallets")).toBeInTheDocument();
  });
});
