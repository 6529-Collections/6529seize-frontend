import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { generateMetadata } from "@/app/network/nerd/[[...focus]]/page";
import ClientCommunityNerdPage from "@/app/network/nerd/[[...focus]]/page.client";
import { LeaderboardFocus } from "@/types/enums";

// 🧪 Mock dynamic Leaderboard
jest.mock("@/components/leaderboard/Leaderboard", () => {
  return {
    __esModule: true,
    LeaderboardFocus: {
      TDH: "Cards Collected",
      INTERACTIONS: "Interactions",
    },
    default: ({ focus, setFocus }: any) => (
      <div data-testid="leaderboard">
        <span data-testid="focus">{focus}</span>
        <button
          data-testid="set-focus"
          onClick={() => setFocus("Interactions")}
        >
          Change Focus
        </button>
      </div>
    ),
  };
});

jest.mock("@/components/network/NetworkPageLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="network-page-layout">{children}</div>
  ),
}));

// 🧪 Mock next/navigation
const replaceMock = jest.fn();
const usePathnameMock = jest.fn(() => "/network/nerd");
const useSearchParamsMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => usePathnameMock(),
  useSearchParams: () => useSearchParamsMock(),
}));

// 🧪 Mock TitleContext
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

describe("ClientCommunityNerdPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.history.pushState({}, "", "/network/nerd/cards-collected");
    usePathnameMock.mockReturnValue("/network/nerd/cards-collected");
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  const renderPage = (focus: LeaderboardFocus) => {
    return render(<ClientCommunityNerdPage focus={focus} />);
  };

  it("renders leaderboard with correct focus", () => {
    renderPage(LeaderboardFocus.TDH);
    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(screen.getByTestId("focus")).toHaveTextContent("Cards Collected");
  });

  it("changes focus and updates URL", () => {
    renderPage(LeaderboardFocus.TDH);
    fireEvent.click(screen.getByTestId("set-focus"));

    expect(replaceMock).toHaveBeenCalledWith("/network/nerd/interactions", {
      scroll: false,
    });
  });
});

describe("generateMetadata", () => {
  it("returns Interactions metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ focus: ["interactions"] }),
    });
    expect(metadata).toMatchObject({
      title: "Network Nerd - Interactions",
      description: expect.stringContaining("Network"),
      openGraph: expect.objectContaining({
        title: "Network Nerd - Interactions",
      }),
    });
  });

  it("returns default TDH metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ focus: undefined }),
    });
    expect(metadata).toMatchObject({
      title: "Network Nerd - Cards Collected",
      description: expect.stringContaining("Network"),
      openGraph: expect.objectContaining({
        title: "Network Nerd - Cards Collected",
      }),
    });
  });
});
