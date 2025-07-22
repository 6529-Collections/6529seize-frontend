import { render, screen } from "@testing-library/react";
import React, { useMemo } from "react";
import WillowShield from "@/app/museum/genesis/willow-shield/page";
import NextGenDistributionPlan from "@/pages/nextgen/collection/[collection]/distribution-plan";
import JoinOm from "@/app/om/join-om/page";
import PartnershipRequest from "@/app/om/partnership-request/page";
import ConsolidatedMetrics from "@/app/open-data/consolidated-network-metrics/page";
import MemeSubscriptions from "@/app/open-data/meme-subscriptions/page";
import AddRememes from "@/pages/rememes/add";
import SlideInitiatives from "@/app/slide-page/6529-initiatives/page";
import AppWallets from "@/pages/tools/app-wallets";
import { AuthContext } from "@/components/auth/Auth";
import { NextGenCollection } from "@/entities/INextgen";

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

const TestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useMemo(() => ({ setTitle: jest.fn() } as any), []);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

describe("misc pages render", () => {
  it("renders Willow Shield page", () => {
    render(<WillowShield />);
    expect(screen.getAllByText(/WILLOW SHIELD/i).length).toBeGreaterThan(0);
  });

  it("renders NextGen distribution plan page", () => {
    render(
      <NextGenDistributionPlan
        collection={{ name: "name" } as NextGenCollection}
      />
    );
    expect(screen.getByTestId("dynamic")).toBeInTheDocument();
  });

  it("renders Join OM page", () => {
    render(<JoinOm />);
    expect(screen.getAllByText(/JOIN OM GENERATION 1/i).length).toBeGreaterThan(
      0
    );
  });

  it("renders partnership request redirect page", () => {
    render(<PartnershipRequest />);
    expect(screen.getByText(/You are being redirected/i)).toBeInTheDocument();
  });

  it("renders consolidated metrics page", () => {
    render(
      <TestProvider>
        <ConsolidatedMetrics />
      </TestProvider>
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
    render(
      <TestProvider>
        <AddRememes />
      </TestProvider>
    );
    expect(screen.getByTestId("dynamic")).toBeInTheDocument();
  });

  it("renders slide initiatives redirect page", () => {
    render(<SlideInitiatives />);
    expect(screen.getByText(/You are being redirected/i)).toBeInTheDocument();
  });

  it("renders app wallets page", () => {
    render(
      <TestProvider>
        <AppWallets />
      </TestProvider>
    );
    expect(screen.getByTestId("dynamic")).toBeInTheDocument();
  });
});
