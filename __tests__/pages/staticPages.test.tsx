import { render, screen } from "@testing-library/react";
import React from "react";
import AboutRules from "@/app/about/rules/page";
import CasaBatllo from "@/pages/casabatllo";
import Museum from "@/pages/museum";
import ElementColumns from "@/pages/element_category/columns";
import MemeLabDistribution from "@/pages/meme-lab/[id]/distribution";
import AuthorNft6529 from "@/pages/author/nft6529";
import BlogArtists from "@/pages/blog/a-tale-of-two-artists";
import CapitalFund from "@/app/capital/fund/page";
import ElementSections from "@/pages/element_category/sections";
import EmmaPlan from "@/pages/emma/plans/[id]";

jest.mock("next/font/google", () => ({
  Poppins: () => ({ className: "poppins" }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0x0",
    seizeConnect: jest.fn(),
    seizeDisconnect: jest.fn(),
    seizeDisconnectAndLogout: jest.fn(),
    seizeAcceptConnection: jest.fn(),
    seizeConnectOpen: false,
    isConnected: false,
    isAuthenticated: false,
  }),
}));
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    query: { id: "1" },
  }),
}));
jest.mock("react-use", () => ({ useInterval: jest.fn() }));

jest.mock(
  "@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanToolSidebar",
  () => () => <div data-testid="sidebar" />
);

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);

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

describe("static pages render", () => {
  it("renders about rules page", () => {
    render(<AboutRules />);
    expect(screen.getAllByText(/6529 FAM RULES/i).length).toBeGreaterThan(0);
  });

  it("renders casa batllo page", () => {
    render(<CasaBatllo />);
    expect(screen.getAllByText(/CASA BATLLO/i).length).toBeGreaterThan(0);
  });

  it("renders museum page", () => {
    render(<Museum />);
    expect(screen.getAllByText(/MUSEUM OF ART/i).length).toBeGreaterThan(0);
  });

  it("element columns page redirects", () => {
    render(<ElementColumns />);
    expect(screen.getByText(/You are being redirected/i)).toBeInTheDocument();
  });

  it("meme lab distribution page loads", () => {
    render(<MemeLabDistribution />);
    expect(screen.getByTestId("dynamic")).toBeInTheDocument();
  });

  it("renders author page", () => {
    const { container } = render(<AuthorNft6529 />);
    expect(container).toBeInTheDocument();
  });

  it("renders blog page", () => {
    render(<BlogArtists />);
    expect(screen.getAllByText(/Tale of Two Artists/i)[0]).toBeInTheDocument();
  });

  it("renders capital fund page", () => {
    render(<CapitalFund />);
    expect(screen.getByText(/6529 FUND/i)).toBeInTheDocument();
  });

  it("sections page redirects", () => {
    render(<ElementSections />);
    expect(screen.getByText(/redirected/i)).toBeInTheDocument();
  });

  it("emma plan page renders", () => {
    render(<EmmaPlan />);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });
});
