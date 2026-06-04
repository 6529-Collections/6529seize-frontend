import { render } from "@testing-library/react";
import React from "react";
import { WaveSmallLeaderboardDefaultDrop } from "@/components/waves/small-leaderboard/WaveSmallLeaderboardDefaultDrop";
import { CICType } from "@/entities/IProfile";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children }: any) => <a>{children}</a>,
}));

jest.mock(
  "@/components/waves/small-leaderboard/WaveSmallLeaderboardItemContent",
  () => ({
    __esModule: true,
    WaveSmallLeaderboardItemContent: (props: any) => (
      <div
        data-testid="content"
        onClick={() => props.onDropClick(props.drop)}
      />
    ),
  })
);

jest.mock(
  "@/components/waves/small-leaderboard/WaveSmallLeaderboardItemOutcomes",
  () => ({
    __esModule: true,
    WaveSmallLeaderboardItemOutcomes: () => <div data-testid="outcomes" />,
  })
);

jest.mock("@/components/waves/drops/WaveDropActionsRate", () => ({
  __esModule: true,
  default: () => <div data-testid="rate" />,
}));

jest.mock("@/components/waves/drops/winner/WinnerDropBadge", () => ({
  __esModule: true,
  default: () => <div data-testid="badge" />,
}));

jest.mock("@/components/waves/approval/ApprovalStatusBadge", () => ({
  __esModule: true,
  default: ({ order }: any) => (
    <div data-testid="approval-badge">Approved {order}</div>
  ),
}));

jest.mock("@/components/drops/view/utils/DropVoteProgressing", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="progress"
      data-current={props.current}
      data-projected={props.projected}
      data-tooltip-label={props.tooltipLabel}
    />
  ),
}));

jest.mock("@/helpers/Helpers", () => ({
  __esModule: true,
  cicToType: jest.fn(() => CICType.INACCURATE),
  formatNumberWithCommas: (n: number) => n.toString(),
}));

describe("WaveSmallLeaderboardDefaultDrop", () => {
  const drop: any = {
    id: "d",
    author: { handle: "h", level: 1, cic: 0 },
    rating: 1,
    realtime_rating: 3,
    rating_prediction: 2,
  };
  const wave: any = { id: "w" };

  it("shows winner badge when rank present", () => {
    render(
      <WaveSmallLeaderboardDefaultDrop
        drop={{ ...drop, rank: 1 }}
        wave={wave}
        onDropClick={jest.fn()}
      />
    );
    expect(document.querySelector('[data-testid="badge"]')).toBeInTheDocument();
  });

  it("shows neutral placeholder for approve wave ranked drop without winning context", () => {
    const { container } = render(
      <WaveSmallLeaderboardDefaultDrop
        drop={{ ...drop, rank: 1, winning_context: null }}
        wave={wave}
        isApproveWave={true}
        onDropClick={jest.fn()}
      />
    );

    expect(
      document.querySelector('[data-testid="badge"]')
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-testid="approval-badge"]')
    ).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows approval badge for approve wave drop with winning context", () => {
    render(
      <WaveSmallLeaderboardDefaultDrop
        drop={{
          ...drop,
          rank: 1,
          winning_context: { decision_time: 123, place: 1 },
        }}
        wave={wave}
        isApproveWave={true}
        onDropClick={jest.fn()}
      />
    );

    expect(
      document.querySelector('[data-testid="approval-badge"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-testid="badge"]')
    ).not.toBeInTheDocument();
  });

  it("shows minus icon when rank missing", () => {
    const { container } = render(
      <WaveSmallLeaderboardDefaultDrop
        drop={{ ...drop, rank: null }}
        wave={wave}
        onDropClick={jest.fn()}
      />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies CIC color class", () => {
    const { container } = render(
      <WaveSmallLeaderboardDefaultDrop
        drop={{ ...drop, rank: null }}
        wave={wave}
        onDropClick={jest.fn()}
      />
    );
    expect(
      container.querySelector(".tw-bg-\\[\\#F97066\\]")
    ).toBeInTheDocument();
  });

  it("shows rate action while voting is open", () => {
    render(
      <WaveSmallLeaderboardDefaultDrop
        drop={{ ...drop, rank: null }}
        wave={wave}
        onDropClick={jest.fn()}
      />
    );
    expect(document.querySelector('[data-testid="rate"]')).toBeInTheDocument();
  });

  it("hides rate action when voting is closed", () => {
    render(
      <WaveSmallLeaderboardDefaultDrop
        drop={{ ...drop, rank: null }}
        wave={wave}
        isVotingClosed={true}
        onDropClick={jest.fn()}
      />
    );
    expect(
      document.querySelector('[data-testid="rate"]')
    ).not.toBeInTheDocument();
  });

  it("hides rate action when voting controls are locked", () => {
    render(
      <WaveSmallLeaderboardDefaultDrop
        drop={{ ...drop, rank: null }}
        wave={wave}
        isVotingControlsLocked={true}
        onDropClick={jest.fn()}
      />
    );
    expect(
      document.querySelector('[data-testid="rate"]')
    ).not.toBeInTheDocument();
  });

  it("uses realtime rating for approve wave progress", () => {
    render(
      <WaveSmallLeaderboardDefaultDrop
        drop={drop}
        wave={wave}
        isApproveWave={true}
        onDropClick={jest.fn()}
      />
    );

    const progress = document.querySelector('[data-testid="progress"]');
    expect(progress).toHaveAttribute("data-current", "1");
    expect(progress).toHaveAttribute("data-projected", "3");
    expect(progress).toHaveAttribute(
      "data-tooltip-label",
      "Votes given now"
    );
  });
});
