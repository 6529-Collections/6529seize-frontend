import React from "react";
import { render, screen } from "@testing-library/react";
import { WaveLeaderboardDropRaters } from "@/components/waves/leaderboard/drops/header/WaveleaderboardDropRaters";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (u: string) => u,
  ImageScale: { W_AUTO_H_50: "AUTO" },
}));
jest.mock("@/components/drops/view/utils/DropVoteProgressing", () => ({
  __esModule: true,
  default: (props: any) => (
    <span
      data-testid="progress"
      data-current={props.current}
      data-projected={props.projected}
      data-projected-label={props.projectedLabel ?? ""}
      data-tooltip-label={props.tooltipLabel}
    />
  ),
}));
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => false,
}));

describe("WaveLeaderboardDropRaters", () => {
  const drop: ExtendedDrop = {
    id: "1",
    rating: 10,
    realtime_rating: 13,
    rating_prediction: 12,
    raters_count: 2,
    rank: 1,
    wave: { voting_credit_type: ApiWaveCreditType.Tdh } as any,
    top_raters: [
      { profile: { id: "p1", handle: "u1", pfp: "" }, rating: 5 },
      { profile: { id: "p2", handle: "u2", pfp: "" }, rating: 5 },
    ],
    context_profile_context: { rating: 3 },
  } as any;

  it("renders rating info and user vote", () => {
    render(<WaveLeaderboardDropRaters drop={drop} />);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("TDH Total")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "View voters and vote log for 2 voters",
      })
    ).toHaveClass(
      "tw-rounded-lg",
      "tw-border",
      "tw-border-iron-700",
      "tw-bg-iron-900/40"
    );
    expect(screen.getByText("Your votes:")).toBeInTheDocument();
  });

  it("renders approve threshold progress", () => {
    render(
      <WaveLeaderboardDropRaters
        drop={{ ...drop, rank: null } as ExtendedDrop}
        winningThreshold={12}
      />
    );

    expect(screen.getByText("/")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Needs 2")).toBeInTheDocument();
    const progress = screen.getByTestId("progress");
    expect(progress).toHaveAttribute("data-current", "10");
    expect(progress).toHaveAttribute("data-projected", "13");
    expect(progress).toHaveAttribute(
      "data-tooltip-label",
      "Votes given now"
    );
    expect(
      screen.getByRole("button", {
        name: "View voters and vote log for 2 voters",
      })
    ).toHaveClass(
      "tw-rounded-lg",
      "tw-border",
      "tw-border-iron-700",
      "tw-bg-iron-900/40"
    );
  });

  it("renders the approval countdown label", () => {
    jest.useFakeTimers().setSystemTime(new Date(1_000_000));
    const { unmount } = render(
      <WaveLeaderboardDropRaters
        drop={
          {
            ...drop,
            rating: 12,
            rank: null,
            over_threshold_since_ms: 1_000_000,
          } as ExtendedDrop
        }
        winningThreshold={12}
        winningThresholdMinDurationMs={480_000}
      />
    );

    try {
      expect(screen.getByText("Approving in 8m")).toBeInTheDocument();
    } finally {
      unmount();
      jest.useRealTimers();
    }
  });

  it("keeps approve status on current vote while showing green realtime movement", () => {
    render(
      <WaveLeaderboardDropRaters
        drop={
          {
            ...drop,
            rating: 38_936_088,
            realtime_rating: 80_273_465,
            rating_prediction: 38_936_088,
            rank: null,
          } as ExtendedDrop
        }
        winningThreshold={42_000_000}
      />
    );

    expect(
      screen.getByTitle("38,936,088 / 42,000,000 TDH")
    ).toBeInTheDocument();
    expect(screen.getByText("38.9M")).toBeInTheDocument();
    expect(screen.getByText("42M")).toBeInTheDocument();
    expect(screen.getByText("Needs 3,063,912")).toBeInTheDocument();
    const progress = screen.getByTestId("progress");
    expect(progress).toHaveAttribute("data-current", "38936088");
    expect(progress).toHaveAttribute("data-projected", "80273465");
    expect(progress).toHaveAttribute("data-projected-label", "80.3M");
    expect(progress).toHaveAttribute(
      "data-tooltip-label",
      "Votes given now"
    );
  });

  it("passes lower approve realtime votes to the progress badge", () => {
    render(
      <WaveLeaderboardDropRaters
        drop={
          {
            ...drop,
            rating: 100,
            realtime_rating: 80,
            rating_prediction: 100,
            rank: null,
          } as ExtendedDrop
        }
        winningThreshold={120}
      />
    );

    const progress = screen.getByTestId("progress");
    expect(progress).toHaveAttribute("data-current", "100");
    expect(progress).toHaveAttribute("data-projected", "80");
  });
});
