import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { MyStreamWaveTab } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { Time } from "@/helpers/time";

const setActiveTab = jest.fn();
const updateAvailableTabs = jest.fn();
const searchParamsGet = jest.fn();
let mockWavePollSummary = { hasPolls: false, unansweredPolls: 0 };

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

const mockApproveLabels = {
  approvals: "Proposals",
  approved: "Approved",
};

jest.mock("@/hooks/waves/useWaveMetadata", () => ({
  useApproveWaveCustomTabLabels: () => mockApproveLabels,
  useWaveOutcomeVisibility: () => mockOutcomesVisible,
  useWaveSubmissionButtonLabelOverride: () => null,
}));

jest.mock("@/hooks/useProfileWave", () => ({
  getProfileWaveIdentity: () => "",
  useProfileWave: () => ({ data: null }),
}));

jest.mock("@/hooks/useWaveHasPolls", () => ({
  useWaveHasPolls: () => mockWavePollSummary.hasPolls,
  useWavePollSummary: () => mockWavePollSummary,
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
let mockOutcomesVisible = true;
const { useAuth } = require("@/components/auth/Auth");

function renderComponent(activeTab: MyStreamWaveTab = MyStreamWaveTab.CHAT) {
  return render(
    <MyStreamWaveDesktopTabs
      activeTab={activeTab}
      wave={
        {
          id: "wave-1",
          author: { id: "author-1", handle: "author" },
          chat: { scope: { group: { is_direct_message: false } } },
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
  mockApproveLabels.approvals = "Proposals";
  mockApproveLabels.approved = "Approved";
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
  mockOutcomesVisible = true;
  mockWavePollSummary = { hasPolls: false, unansweredPolls: 0 };
  (useAuth as jest.Mock).mockReturnValue({
    connectedProfile: { handle: "alice" },
  });
});

describe("MyStreamWaveDesktopTabs", () => {
  it("renders Polls for chat waves when available", () => {
    mockWaveInfo = {
      isChatWave: true,
      isApproveWave: false,
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: false,
    };
    mockAvailableTabs = [MyStreamWaveTab.CHAT, MyStreamWaveTab.POLLS];

    renderComponent();

    expect(screen.getAllByText("Chat").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Polls").length).toBeGreaterThan(0);
  });

  it("renders unanswered poll count on the Polls tab", () => {
    mockAvailableTabs = [MyStreamWaveTab.CHAT, MyStreamWaveTab.POLLS];
    mockWavePollSummary = { hasPolls: true, unansweredPolls: 7 };

    renderComponent();

    expect(
      screen.getAllByRole("tab", { name: /polls/i }).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("7").length).toBeGreaterThan(0);
  });

  it("filters hidden My Votes without correcting the active tab", () => {
    mockAvailableTabs = [
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.MY_VOTES,
      MyStreamWaveTab.LEADERBOARD,
    ];
    renderComponent(MyStreamWaveTab.MY_VOTES);
    expect(screen.getAllByText("Chat").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Leaderboard").length).toBeGreaterThan(0);
    expect(screen.queryByText("My Votes")).toBeNull();
    expect(setActiveTab).not.toHaveBeenCalled();
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

    expect(screen.getAllByText("Sales").length).toBeGreaterThan(0);
    expect(screen.getAllByText("My Votes").length).toBeGreaterThan(0);
    expect(setActiveTab).not.toHaveBeenCalled();
  });

  it("shows My Votes for authenticated normal rank waves", () => {
    mockWaveInfo = {
      isChatWave: false,
      isApproveWave: false,
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: true,
    };
    mockAvailableTabs = [
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.MY_VOTES,
    ];

    renderComponent(MyStreamWaveTab.MY_VOTES);

    expect(screen.getAllByText("My Votes").length).toBeGreaterThan(0);
  });

  it("shows Polls when available and activates it", () => {
    mockAvailableTabs = [MyStreamWaveTab.CHAT, MyStreamWaveTab.POLLS];

    renderComponent(MyStreamWaveTab.CHAT);

    fireEvent.click(screen.getAllByRole("tab", { name: "Polls" })[0]);

    expect(setActiveTab).toHaveBeenCalledWith(MyStreamWaveTab.POLLS);
  });

  it("hides My Votes for guests on normal rank waves", () => {
    mockWaveInfo = {
      isChatWave: false,
      isApproveWave: false,
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: true,
    };
    mockAvailableTabs = [
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.MY_VOTES,
    ];
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: null,
    });

    renderComponent(MyStreamWaveTab.MY_VOTES);

    expect(screen.getAllByText("Chat").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Leaderboard").length).toBeGreaterThan(0);
    expect(screen.queryByText("My Votes")).toBeNull();
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

    expect(screen.getAllByText("Leaderboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Chat").length).toBeGreaterThan(0);
    expect(screen.queryByText("My Votes")).toBeNull();
    expect(setActiveTab).not.toHaveBeenCalled();
  });

  it("shows My Votes for authenticated normal approve waves", () => {
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
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.MY_VOTES,
    ];

    renderComponent(MyStreamWaveTab.MY_VOTES);

    expect(screen.getAllByText("My Votes").length).toBeGreaterThan(0);
  });

  it("hides My Votes for guests on normal approve waves", () => {
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
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.MY_VOTES,
    ];
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: null,
    });

    renderComponent(MyStreamWaveTab.MY_VOTES);

    expect(screen.getAllByText("Chat").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Proposals").length).toBeGreaterThan(0);
    expect(screen.queryByText("My Votes")).toBeNull();
    expect(setActiveTab).not.toHaveBeenCalled();
  });

  it("sets the active tab when a visible standard tab is clicked", () => {
    mockAvailableTabs = [MyStreamWaveTab.CHAT, MyStreamWaveTab.LEADERBOARD];
    renderComponent(MyStreamWaveTab.CHAT);

    fireEvent.click(screen.getAllByRole("tab", { name: "Leaderboard" })[0]);

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

    expect(screen.getAllByText("Chat").length).toBeGreaterThan(0);
    expect(screen.queryByText("Sales")).toBeNull();
    expect(setActiveTab).not.toHaveBeenCalled();
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

    expect(screen.getAllByText("Chat").length).toBeGreaterThan(0);
    expect(screen.queryByText("FAQ")).toBeNull();
    expect(setActiveTab).not.toHaveBeenCalled();
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

    expect(screen.getAllByText("Chat").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Proposals").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Approved").length).toBeGreaterThan(0);
    expect(screen.queryByText("Leaderboard")).toBeNull();
    expect(screen.queryByText("Winners")).toBeNull();
  });

  it("uses custom approve wave tab labels", () => {
    mockApproveLabels.approvals = "Candidates";
    mockApproveLabels.approved = "Selected";
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

    expect(screen.getAllByText("Candidates").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Selected").length).toBeGreaterThan(0);
    expect(screen.queryByText("Proposals")).toBeNull();
    expect(screen.queryByText("Approved")).toBeNull();
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
