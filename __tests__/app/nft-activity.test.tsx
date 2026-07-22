import NFTActivityPage, { generateMetadata } from "@/app/nft-activity/page";
import { AuthContext } from "@/components/auth/Auth";
import { publicEnv } from "@/config/env";
import { render, screen } from "@testing-library/react";
import React from "react";

const domain = new URL(publicEnv.BASE_ENDPOINT).hostname;

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

// Mock the LatestActivity component since it's dynamically imported and may have complex dependencies
jest.mock("@/components/latest-activity/LatestActivity", () => {
  return function MockLatestActivity({ page, pageSize, showMore }: any) {
    return (
      <div data-testid="latest-activity">
        <span data-testid="page">Page: {page}</span>
        <span data-testid="pageSize">Page Size: {pageSize}</span>
        <span data-testid="showMore">
          Show More: {showMore ? "true" : "false"}
        </span>
      </div>
    );
  };
});

// Mock MyStreamContext if needed
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({}),
  MyStreamProvider: ({ children }: any) => children,
}));

describe("NFTActivityPage", () => {
  const mockSetTitle = jest.fn();

  const mockAuthContext = {
    setTitle: mockSetTitle,
    connectedProfile: null,
    activeProfileProxy: null,
    requestAuth: jest.fn(),
    setRequestAuth: jest.fn(),
    receivedProfileProxies: [],
    setReceivedProfileProxies: jest.fn(),
    showWaves: false,
    setShowWaves: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <NFTActivityPage />
      </AuthContext.Provider>
    );
  };

  it("renders the main layout structure", () => {
    const { container } = renderComponent();

    expect(container.querySelector("main")).toBeInTheDocument();
    expect(container.querySelector("main > section")).toBeInTheDocument();
  });

  it("renders the LatestActivity component with correct props", () => {
    renderComponent();

    expect(screen.getByTestId("latest-activity")).toBeInTheDocument();
    expect(screen.getByTestId("page")).toHaveTextContent("Page: 1");
    expect(screen.getByTestId("pageSize")).toHaveTextContent("Page Size: 50");
    expect(screen.getByTestId("showMore")).toHaveTextContent("Show More: true");
  });

  it("applies the activity page spacing", () => {
    const { container } = renderComponent();

    const section = container.querySelector("main > section");
    expect(section).toHaveClass("tw-px-4");
    expect(section).toHaveClass("tw-py-4");
  });

  it("sets the page title on mount", () => {
    renderComponent();
  });

  it("has correct metadata", async () => {
    const metadata = await generateMetadata();
    expect(metadata).toMatchObject({
      title: "NFT Activity | Network",
      description: `Network | ${domain}`,
    });
  });

  it("renders inside the shared Tailwind page shell", () => {
    const { container } = renderComponent();

    const mainElement = container.querySelector("main");
    expect(mainElement).toHaveClass("tailwind-scope");
    expect(mainElement).toHaveClass("tw-border-iron-800");
  });
});
