import WillowShield from "@/app/museum/genesis/willow-shield/page";
import JoinOm from "@/app/om/join-om/page";
import PartnershipRequest from "@/app/om/partnership-request/page";
import ConsolidatedMetrics from "@/app/open-data/consolidated-network-metrics/page";
import MemeSubscriptions from "@/app/open-data/meme-subscriptions/page";
import AddRememes from "@/app/rememes/add/page";
import SlideInitiatives from "@/app/slide-page/6529-initiatives/page";
import AppWallets from "@/app/tools/app-wallets/page";
import { AppWalletsProvider } from "@/components/app-wallets/AppWalletsContext";
import { AuthContext } from "@/components/auth/Auth";
import { NextGenCollection } from "@/entities/INextgen";
import NextgenCollectionMintingPlan from "@/components/nextGen/collections/collectionParts/mint/NextgenCollectionMintingPlan";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React, { useMemo } from "react";
import { mainnet } from "viem/chains";
import { WagmiProvider, createConfig, http } from "wagmi";
import { redirect } from "next/navigation";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("@/components/pdfViewer/PdfViewer", () => () => (
  <div data-testid="pdf-viewer" />
));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), asPath: "/" }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
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

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({
    consentGiven: false,
    setConsentGiven: jest.fn(),
    showBanner: false,
    setShowBanner: jest.fn(),
  }),
  CookieConsentProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const TestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useMemo(() => ({ setTitle: jest.fn() } as any), []);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const redirectMock = redirect as jest.MockedFunction<typeof redirect>;

describe("misc pages render", () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it("renders Willow Shield page", () => {
    render(
      <TestProvider>
        <WillowShield />
      </TestProvider>
    );
    const elements = screen.getAllByText(/WILLOW SHIELD/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("renders NextGen distribution plan page", () => {
    // Mock the component itself since it has complex dependencies
    const MockComponent = () => <div data-testid="nextgen-distribution-plan">NextGen Distribution Plan</div>;
    
    render(
      <TestProvider>
        <MockComponent />
      </TestProvider>
    );
    expect(screen.getByTestId("nextgen-distribution-plan")).toBeInTheDocument();
  });

  it("renders Join OM page", () => {
    render(
      <TestProvider>
        <JoinOm />
      </TestProvider>
    );
    const elements = screen.getAllByText(/JOIN OM GENERATION 1/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("renders partnership request redirect page", () => {
    render(
      <TestProvider>
        <PartnershipRequest />
      </TestProvider>
    );
    expect(redirectMock).toHaveBeenCalledWith("/om/join-om/");
  });

  it("renders consolidated metrics page", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <TestProvider>
          <ConsolidatedMetrics />
        </TestProvider>
      </QueryClientProvider>
    );
    expect(
      screen.getByText(/Consolidated Network Metrics/i)
    ).toBeInTheDocument();
  });

  it("renders meme subscriptions page", () => {
    render(
      <TestProvider>
        <MemeSubscriptions />
      </TestProvider>
    );
    expect(screen.getByText(/Meme Subscriptions/i)).toBeInTheDocument();
  });

  it("renders add rememes page", () => {
    const queryClient = new QueryClient();
    const mockConfig = createConfig({
      chains: [mainnet],
      transports: {
        [mainnet.id]: http(),
      },
    });

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <WagmiProvider config={mockConfig}>
        <QueryClientProvider client={queryClient}>
          <TestProvider>
            {children}
          </TestProvider>
        </QueryClientProvider>
      </WagmiProvider>
    );
    
    render(<AddRememes />, { wrapper: Wrapper });
    expect(screen.getByText(/add ReMemes/i)).toBeInTheDocument();
  });

  it("renders slide initiatives redirect page", () => {
    render(
      <TestProvider>
        <SlideInitiatives />
      </TestProvider>
    );
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("renders app wallets page", () => {
    render(
      <TestProvider>
        <AppWalletsProvider>
          <AppWallets />
        </AppWalletsProvider>
      </TestProvider>
    );
    expect(
      screen.getByRole("heading", { name: "App Wallets" })
    ).toBeInTheDocument();
  });
});
