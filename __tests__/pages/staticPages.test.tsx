import AboutRules from "@/app/about/rules/page";
import AuthorNft6529 from "@/app/author/nft6529/page";
import BlogArtists from "@/app/blog/a-tale-of-two-artists/page";
import CapitalFund from "@/app/capital/fund/page";
import CasaBatllo from "@/app/casabatllo/page";
import ElementColumns from "@/app/element_category/columns/page";
import ElementSections from "@/app/element_category/sections/page";
import EmmaPlan from "@/app/emma/plans/[id]/page";
import Museum from "@/app/museum/page";
import { render, screen } from "@testing-library/react";
import React from "react";
import { redirect } from "next/navigation";

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
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({ get: () => "1" }),
  redirect: jest.fn(),
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
  const redirectMock = redirect as jest.MockedFunction<typeof redirect>;

  beforeEach(() => {
    redirectMock.mockClear();
  });

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
    expect(redirectMock).toHaveBeenCalledWith("/");
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
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("emma plan page renders", async () => {
    // Await the server component to get the JSX
    const jsx = await EmmaPlan({ params: Promise.resolve({ id: "1" }) });

    // Now render the resolved JSX
    render(jsx);

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });
});
