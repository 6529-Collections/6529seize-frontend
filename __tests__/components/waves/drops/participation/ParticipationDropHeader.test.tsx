import { render, screen } from "@testing-library/react";
import React from "react";
import ParticipationDropHeader from "@/components/waves/drops/participation/ParticipationDropHeader";

const mockDropAuthorBadges = jest.fn();

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, onClick, className }: any) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));
jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: (p: any) => <div data-testid="level" {...p} />,
  UserCICAndLevelSize: { SMALL: "SMALL" },
}));
jest.mock("@/components/waves/drops/winner/WinnerDropBadge", () => {
  const MockWinnerDropBadge = (props: any) => (
    <div data-testid="badge">{JSON.stringify(props)}</div>
  );
  MockWinnerDropBadge.displayName = "MockWinnerDropBadge";
  return MockWinnerDropBadge;
});
jest.mock("@/components/waves/drops/time/WaveDropTime", () => {
  const MockWaveDropTime = (props: any) => (
    <span data-testid="time">{props.timestamp}</span>
  );
  MockWaveDropTime.displayName = "MockWaveDropTime";
  return MockWaveDropTime;
});
jest.mock("@/components/waves/approval/ApprovalStatusBadge", () => {
  const MockApprovalStatusBadge = (props: any) => (
    <div data-testid="approval-badge">{JSON.stringify(props)}</div>
  );
  MockApprovalStatusBadge.displayName = "MockApprovalStatusBadge";
  return MockApprovalStatusBadge;
});
jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: (props: any) => {
    mockDropAuthorBadges(props);
    return <div data-testid="author-badges" />;
  },
}));
jest.mock("@/helpers/Helpers", () => ({ cicToType: jest.fn(() => "TYPE") }));

describe("ParticipationDropHeader", () => {
  const baseDrop: any = {
    author: { handle: "alice", level: 1, cic: 1500 },
    created_at: 123,
    wave: { id: "w1", name: "WaveName" },
  };

  it("shows author info, time and badge when showWaveInfo is true", () => {
    const drop = {
      ...baseDrop,
      rank: 2,
      winning_context: { decision_time: 999 },
    };
    render(<ParticipationDropHeader drop={drop} showWaveInfo={true} />);

    expect(screen.getByTestId("level")).toBeInTheDocument();
    expect(screen.getByText("alice").closest("a")).toHaveAttribute(
      "href",
      "/alice"
    );
    expect(screen.getByTestId("time")).toHaveTextContent("123");
    expect(mockDropAuthorBadges).toHaveBeenLastCalledWith(
      expect.objectContaining({
        profile: drop.author,
        wave: drop.wave,
      })
    );
    expect(screen.getByTestId("badge").textContent).toContain('"rank":2');
    expect(screen.getByTestId("badge").textContent).toContain(
      '"decisionTime":999'
    );
    expect(screen.getByText("WaveName").closest("a")).toHaveAttribute(
      "href",
      "/waves/w1"
    );
  });

  it("omits wave link when showWaveInfo is false", () => {
    const drop = {
      ...baseDrop,
      rank: 1,
      winning_context: { decision_time: 50 },
    };
    render(<ParticipationDropHeader drop={drop} showWaveInfo={false} />);

    expect(screen.queryByText("WaveName")).toBeNull();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByTestId("badge")).toBeInTheDocument();
  });

  it("hides badge when rank is missing", () => {
    render(<ParticipationDropHeader drop={baseDrop} showWaveInfo={false} />);

    expect(screen.queryByText("WaveName")).toBeNull();
    expect(screen.queryByTestId("badge")).toBeNull();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByTestId("time")).toBeInTheDocument();
  });

  it("uses approval badge for approved approve drops", () => {
    const drop = {
      ...baseDrop,
      rank: 1,
      winning_context: { decision_time: 999, place: 1 },
    };

    render(
      <ParticipationDropHeader
        drop={drop}
        showWaveInfo={false}
        winningThreshold={10}
      />
    );

    expect(screen.getByTestId("approval-badge").textContent).not.toContain(
      "order"
    );
    expect(screen.queryByTestId("badge")).toBeNull();
  });

  it("does not show approval badge for rank-only approve drops", () => {
    const drop = {
      ...baseDrop,
      rank: 1,
    };

    render(
      <ParticipationDropHeader
        drop={drop}
        showWaveInfo={false}
        winningThreshold={10}
      />
    );

    expect(screen.queryByTestId("approval-badge")).toBeNull();
    expect(screen.queryByTestId("badge")).toBeNull();
  });
});
