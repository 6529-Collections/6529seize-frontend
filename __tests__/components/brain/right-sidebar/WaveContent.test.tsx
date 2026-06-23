import { render, screen } from "@testing-library/react";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import {
  Mode,
  SidebarTab,
} from "@/components/brain/right-sidebar/BrainRightSidebarTypes";
import { WaveContent } from "@/components/brain/right-sidebar/WaveContent";

jest.mock("@/components/waves/header/WaveHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="header">header</div>,
  WaveHeaderPinnedSide: { LEFT: "LEFT" },
}));

jest.mock("@/components/common/TabToggleWithOverflow", () => ({
  __esModule: true,
  TabToggleWithOverflow: ({ options, activeKey }: any) => (
    <div data-testid="tabs">
      {activeKey}-{options.map((option: any) => option.label).join(",")}
    </div>
  ),
}));

jest.mock(
  "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoters",
  () => ({
    __esModule: true,
    WaveLeaderboardRightSidebarVoters: () => <div>voters</div>,
  })
);
jest.mock(
  "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLogs",
  () => ({
    __esModule: true,
    WaveLeaderboardRightSidebarActivityLogs: () => <div>logs</div>,
  })
);
jest.mock("@/components/brain/right-sidebar/BrainRightSidebarContent", () => ({
  __esModule: true,
  default: () => <div>content</div>,
}));
jest.mock("@/components/brain/right-sidebar/BrainRightSidebarSettings", () => ({
  __esModule: true,
  default: () => <div>settings</div>,
}));
jest.mock("@/components/brain/right-sidebar/WaveRepDetails", () => ({
  __esModule: true,
  default: () => <div>rep details</div>,
}));
jest.mock(
  "@/components/brain/right-sidebar/BrainRightSidebarFollowers",
  () => ({ __esModule: true, default: () => <div>followers</div> })
);

describe("WaveContent", () => {
  const wave = { wave: { type: ApiWaveType.Chat }, name: "Wave" } as any;

  it("renders normal wave with about and settings tabs", () => {
    render(
      <WaveContent
        wave={wave}
        mode={Mode.CONTENT}
        setMode={jest.fn()}
        activeTab={SidebarTab.ABOUT}
        setActiveTab={jest.fn()}
      />
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("tabs")).toHaveTextContent(
      "ABOUT-About,REP,Settings"
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("renders settings tab content", () => {
    render(
      <WaveContent
        wave={wave}
        mode={Mode.CONTENT}
        setMode={jest.fn()}
        activeTab={SidebarTab.SETTINGS}
        setActiveTab={jest.fn()}
      />
    );

    expect(screen.getByTestId("tabs")).toHaveTextContent(
      "SETTINGS-About,REP,Settings"
    );
    expect(screen.getByText("settings")).toBeInTheDocument();
    expect(screen.queryByTestId("header")).toBeNull();
  });

  it("renders REP tab content", () => {
    render(
      <WaveContent
        wave={wave}
        mode={Mode.CONTENT}
        setMode={jest.fn()}
        activeTab={SidebarTab.REP}
        setActiveTab={jest.fn()}
      />
    );

    expect(screen.getByTestId("tabs")).toHaveTextContent(
      "REP-About,REP,Settings"
    );
    expect(screen.getByText("rep details")).toBeInTheDocument();
    expect(screen.queryByTestId("header")).toBeNull();
  });

  it("falls back to about when active tab is unavailable for the wave type", () => {
    render(
      <WaveContent
        wave={wave}
        mode={Mode.CONTENT}
        setMode={jest.fn()}
        activeTab={SidebarTab.TOP_VOTERS}
        setActiveTab={jest.fn()}
      />
    );

    expect(screen.getByTestId("tabs")).toHaveTextContent(
      "ABOUT-About,REP,Settings"
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("renders rank wave right-sidebar tabs without leaderboard or winners tabs", () => {
    render(
      <WaveContent
        wave={{ wave: { type: ApiWaveType.Rank }, name: "Wave" } as any}
        mode={Mode.CONTENT}
        setMode={jest.fn()}
        activeTab={SidebarTab.ABOUT}
        setActiveTab={jest.fn()}
      />
    );
    expect(screen.getByTestId("tabs")).toHaveTextContent(
      "ABOUT-About,REP,Settings,Voters,Activity"
    );
    expect(screen.getByTestId("tabs")).not.toHaveTextContent("Leaderboard");
    expect(screen.getByTestId("tabs")).not.toHaveTextContent("Winners");
  });

  it("renders approve wave right-sidebar tabs without approvals or approved tabs", () => {
    render(
      <WaveContent
        wave={{ wave: { type: ApiWaveType.Approve }, name: "Wave" } as any}
        mode={Mode.CONTENT}
        setMode={jest.fn()}
        activeTab={SidebarTab.ABOUT}
        setActiveTab={jest.fn()}
      />
    );

    expect(screen.getByTestId("tabs")).toHaveTextContent(
      "ABOUT-About,REP,Settings,Voters,Activity"
    );
    expect(screen.getByTestId("tabs")).not.toHaveTextContent("Proposals");
    expect(screen.getByTestId("tabs")).not.toHaveTextContent("Approved");
  });
});
