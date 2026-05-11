import { render, screen } from "@testing-library/react";
import React from "react";
import { MyStreamWaveTab } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { Time } from "@/helpers/time";

const setActiveTab = jest.fn();
const updateAvailableTabs = jest.fn();
const searchParamsGet = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: searchParamsGet,
  }),
}));

jest.mock("@/components/brain/ContentTabContext", () => {
  const actual = jest.requireActual(
    "../../../../components/brain/ContentTabContext"
  );
  return {
    __esModule: true,
    ...actual,
    useContentTab: () => ({
      availableTabs: mockAvailableTabs,
      updateAvailableTabs,
    }),
  };
});

jest.mock("@/hooks/useWave", () => ({
  useWave: () => ({
    ...mockWaveInfo,
    pauses: {
      isPaused: false,
      currentPause: null,
      nextPause: null,
      showPause: jest.fn(() => null),
      hasDecisionsBeforePause: jest.fn(() => false),
      filterDecisionsDuringPauses: jest.fn((decisions) => decisions),
      getNextValidDecision: jest.fn(() => null),
    },
  }),
}));

jest.mock("@/hooks/useWaveTimers", () => ({
  useWaveTimers: () => ({
    voting: mockVoting,
    decisions: { firstDecisionDone: false },
  }),
}));

jest.mock("@/hooks/waves/useDecisionPoints", () => ({
  useDecisionPoints: () => ({
    allDecisions: mockDecisions,
    hasMoreFuture: false,
    loadMoreFuture: jest.fn(),
  }),
}));

jest.mock("@/hooks/waves/useWaveCurations", () => ({
  useWaveCurations: () => ({ data: [] }),
}));

jest.mock("@/hooks/waves/useWaveCurationReorderMutation", () => ({
  useWaveCurationReorderMutation: () => ({
    reorderCuration: jest.fn(),
    isPending: false,
  }),
}));

jest.mock("@/hooks/useProfileWave", () => ({
  getProfileWaveIdentity: () => "",
  useProfileWave: () => ({ data: null }),
}));

jest.mock("@/components/waves/leaderboard/time/CompactTimeCountdown", () => ({
  __esModule: true,
  CompactTimeCountdown: ({ timeLeft }: any) => (
    <div data-testid="countdown">{timeLeft.seconds}</div>
  ),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

import MyStreamWaveDesktopTabs from "@/components/brain/my-stream/MyStreamWaveDesktopTabs";

let mockAvailableTabs: MyStreamWaveTab[] = [];
let mockWaveInfo: any = {
  isChatWave: false,
  isApproveWave: false,
  isMemesWave: false,
  isCurationWave: false,
  isRankWave: false,
};
let mockVoting = { isUpcoming: false, isCompleted: false, isInProgress: true };
let mockDecisions: { timestamp: number }[] = [];
const { useAuth } = require("@/components/auth/Auth");

function renderComponent(activeTab: MyStreamWaveTab = MyStreamWaveTab.CHAT) {
  return render(
    <MyStreamWaveDesktopTabs
      activeTab={activeTab}
      wave={
        {
          id: "wave-1",
          author: { id: "author-1" },
          wave: {
            type: ApiWaveType.Approve,
            authenticated_user_eligible_for_admin: false,
          },
        } as any
      }
      setActiveTab={setActiveTab}
      activeCurationId={null}
      onSelectCuration={jest.fn()}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  searchParamsGet.mockReturnValue(null);
  mockAvailableTabs = [MyStreamWaveTab.CHAT];
  mockWaveInfo = {
    isChatWave: false,
    isApproveWave: false,
    isMemesWave: false,
    isCurationWave: false,
    isRankWave: false,
  };
  mockVoting = { isUpcoming: false, isCompleted: false, isInProgress: true };
  mockDecisions = [];
  (useAuth as jest.Mock).mockReturnValue({
    connectedProfile: { handle: "alice" },
  });
});

describe("MyStreamWaveDesktopTabs", () => {
  it("returns null for chat waves", () => {
    mockWaveInfo = {
      isChatWave: true,
      isApproveWave: false,
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: false,
    };
    const { container } = renderComponent();
    expect(container.firstChild).toBeNull();
  });

  it("filters options and corrects invalid active tab", () => {
    mockAvailableTabs = [
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.MY_VOTES,
      MyStreamWaveTab.LEADERBOARD,
    ];
    renderComponent(MyStreamWaveTab.MY_VOTES);
    expect(setActiveTab).toHaveBeenCalledWith(MyStreamWaveTab.CHAT);
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
    expect(screen.queryByText("My Votes")).toBeNull();
  });

  it("shows My Votes for curation waves", () => {
    mockWaveInfo = {
      isChatWave: false,
      isApproveWave: false,
      isMemesWave: false,
      isCurationWave: true,
      isRankWave: false,
    };
    mockAvailableTabs = [
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.SALES,
      MyStreamWaveTab.MY_VOTES,
    ];
    renderComponent(MyStreamWaveTab.MY_VOTES);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Chat",
      "Leaderboard",
      "Sales",
      "My Votes",
    ]);
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("My Votes")).toBeInTheDocument();
    expect(setActiveTab).not.toHaveBeenCalled();
  });

  it("hides My Votes for guests on memes waves", () => {
    mockWaveInfo = {
      isChatWave: false,
      isApproveWave: false,
      isMemesWave: true,
      isCurationWave: false,
      isRankWave: false,
    };
    mockAvailableTabs = [
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.MY_VOTES,
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.FAQ,
    ];
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: null,
    });

    renderComponent(MyStreamWaveTab.MY_VOTES);

    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.queryByText("My Votes")).toBeNull();
    expect(setActiveTab).toHaveBeenCalledWith(MyStreamWaveTab.LEADERBOARD);
  });

  it("keeps Sales hidden outside curation waves", () => {
    mockWaveInfo = {
      isChatWave: false,
      isApproveWave: false,
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: false,
    };
    mockAvailableTabs = [MyStreamWaveTab.CHAT, MyStreamWaveTab.SALES];
    renderComponent(MyStreamWaveTab.SALES);

    expect(screen.queryByText("Sales")).toBeNull();
    expect(setActiveTab).toHaveBeenCalledWith(MyStreamWaveTab.CHAT);
  });

  it("keeps FAQ hidden outside memes waves", () => {
    mockWaveInfo = {
      isChatWave: false,
      isApproveWave: false,
      isMemesWave: false,
      isCurationWave: true,
      isRankWave: false,
    };
    mockAvailableTabs = [MyStreamWaveTab.CHAT, MyStreamWaveTab.FAQ];
    renderComponent(MyStreamWaveTab.FAQ);

    expect(screen.queryByText("FAQ")).toBeNull();
    expect(setActiveTab).toHaveBeenCalledWith(MyStreamWaveTab.CHAT);
  });

  it("does not render countdown; parent header handles it", () => {
    const spy = jest.spyOn(Time, "currentMillis").mockReturnValue(0);
    mockWaveInfo = {
      isChatWave: false,
      isApproveWave: false,
      isMemesWave: true,
      isCurationWave: false,
      isRankWave: false,
    };
    mockAvailableTabs = [MyStreamWaveTab.CHAT];
    mockDecisions = [{ timestamp: 10000 }];
    renderComponent(MyStreamWaveTab.CHAT);
    expect(screen.queryByTestId("countdown")).toBeNull();
    spy.mockRestore();
  });

  it("passes curation flag into tab availability update", () => {
    mockWaveInfo = {
      isChatWave: false,
      isApproveWave: false,
      isMemesWave: false,
      isCurationWave: true,
      isRankWave: false,
    };

    renderComponent(MyStreamWaveTab.CHAT);

    expect(updateAvailableTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: true,
        isApproveWave: false,
      })
    );
  });

  it("renames approve wave tabs", () => {
    mockWaveInfo = {
      isChatWave: false,
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: false,
    };
    mockAvailableTabs = [
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.WINNERS,
    ];

    renderComponent(MyStreamWaveTab.LEADERBOARD);

    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.queryByText("Leaderboard")).toBeNull();
    expect(screen.queryByText("Winners")).toBeNull();
  });

  it("forces a transient switch to Chat when serialNo is present", () => {
    searchParamsGet.mockImplementation((key: string) =>
      key === "serialNo" ? "42" : null
    );
    mockAvailableTabs = [MyStreamWaveTab.CHAT, MyStreamWaveTab.LEADERBOARD];

    renderComponent(MyStreamWaveTab.LEADERBOARD);

    expect(updateAvailableTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        transientPreferredTab: MyStreamWaveTab.CHAT,
      })
    );
    expect(setActiveTab).not.toHaveBeenCalled();
  });
});
