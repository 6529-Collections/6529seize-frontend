import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import ClientCommunityNerdPage from "@/app/network/nerd/[[...focus]]/page.client";
import { generateMetadata } from "@/app/network/nerd/[[...focus]]/page";
import { LeaderboardFocus } from "@/enums";

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
          onClick={() => setFocus("Interactions")}>
          Change Focus
        </button>
      </div>
    ),
  };
});

// 🧪 Mock next/navigation
const replaceMock = jest.fn();
const useRouterMock = jest.fn(() => ({
  replace: replaceMock,
}));
const usePathnameMock = jest.fn(() => "/network/nerd");

jest.mock("next/navigation", () => ({
  useRouter: () => useRouterMock(),
  usePathname: () => usePathnameMock(),
}));

// 🧪 Mock TitleContext
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

describe("ClientCommunityNerdPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    expect(replaceMock).toHaveBeenCalledWith("/network/nerd/interactions");
  });
});

describe("generateMetadata", () => {
  it("returns Interactions metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ focus: "interactions" }),
    });
    expect(metadata).toEqual({
      title: "Network Nerd - Interactions",
      description: "Network",
    });
  });

  it("returns default TDH metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ focus: undefined }),
    });
    expect(metadata).toEqual({
      title: "Network Nerd - Cards Collected",
      description: "Network",
    });
  });
});
