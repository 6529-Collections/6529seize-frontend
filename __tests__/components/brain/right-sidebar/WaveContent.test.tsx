import { render, screen } from "@testing-library/react";
import React from "react";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import {
  Mode,
  SidebarTab,
} from "@/components/brain/right-sidebar/BrainRightSidebar";
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
jest.mock(
  "@/components/brain/right-sidebar/BrainRightSidebarFollowers",
  () => ({ __esModule: true, default: () => <div>followers</div> })
);

describe("WaveContent", () => {
  const wave = { wave: { type: ApiWaveType.Chat }, name: "Wave" } as any;

  it("renders non-rank wave without tabs", () => {
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
    expect(screen.queryByTestId("tabs")).toBeNull();
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
      "ABOUT-About,Voters,Activity"
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
      "ABOUT-About,Voters,Activity"
    );
    expect(screen.getByTestId("tabs")).not.toHaveTextContent("Approvals");
    expect(screen.getByTestId("tabs")).not.toHaveTextContent("Approved");
  });
});
