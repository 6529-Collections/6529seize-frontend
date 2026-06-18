import ClientCommunityNerdPage from "@/app/network/nerd/[[...focus]]/page.client";
import { ApiConsolidatedTdhView } from "@/generated/models/ApiConsolidatedTdhView";
import { LeaderboardFocus } from "@/types/enums";
import { act, render } from "@testing-library/react";
import React from "react";

// 🧪 Mock leaderboard component and capture props
let capturedProps: any;
jest.mock("@/components/leaderboard/Leaderboard", () => ({
  __esModule: true,
  LeaderboardFocus: {
    TDH: "Cards Collected",
    INTERACTIONS: "Interactions",
  },
  default: (props: any) => {
    capturedProps = props;
    return <div data-testid="leaderboard" />;
  },
}));

jest.mock("@/components/network/NetworkPageLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="network-page-layout">{children}</div>
  ),
}));

// 🧪 Mock next/navigation
const replaceMock = jest.fn();
const usePathnameMock = jest.fn();
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
    capturedProps = undefined;
    jest.clearAllMocks();
    globalThis.history.pushState({}, "", "/network/nerd/cards-collected");
    usePathnameMock.mockReturnValue("/network/nerd/cards-collected");
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  const renderPage = (focus: LeaderboardFocus) => {
    return render(<ClientCommunityNerdPage focus={focus} />);
  };

  it("passes focus to leaderboard", () => {
    renderPage(LeaderboardFocus.TDH);
    expect(capturedProps.focus).toBe(LeaderboardFocus.TDH);
  });

  it("updates path when focus changes", () => {
    renderPage(LeaderboardFocus.TDH);
    act(() => capturedProps.setFocus(LeaderboardFocus.INTERACTIONS));
    expect(replaceMock).toHaveBeenCalledWith("/network/nerd/interactions", {
      scroll: false,
    });
  });

  it("reads tdh view from search params", () => {
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams("tdh_view=unboosted")
    );
    renderPage(LeaderboardFocus.TDH);
    expect(capturedProps.tdhView).toBe(ApiConsolidatedTdhView.Unboosted);
  });
});
