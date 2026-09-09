import { render, screen } from "@testing-library/react";
import React from "react";
import MyStreamWaveMyVoteVotes from "@/components/brain/my-stream/votes/MyStreamWaveMyVoteVotes";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";

jest.mock("@/components/drops/view/utils/DropVoteProgressing");

const ProgressMock = DropVoteProgressing as jest.Mock;

describe("MyStreamWaveMyVoteVotes", () => {
  beforeEach(() => {
    ProgressMock.mockClear();
  });

  const drop = { rating: 5, realtime_rating: 9, rating_prediction: 6 } as any;

  it("shows positive rating style", () => {
    render(<MyStreamWaveMyVoteVotes drop={drop} />);
    expect(screen.getByText("5")).toHaveClass(
      "tw-text-emerald-500",
      "tw-font-semibold"
    );
    expect(ProgressMock.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        current: 5,
        projected: 6,
        tooltipLabel: "Projected vote count at decision time",
        numberFont: "sans",
        numberWeight: "semibold",
      })
    );
  });

  it("shows negative rating style", () => {
    render(<MyStreamWaveMyVoteVotes drop={{ ...drop, rating: -1 }} />);
    expect(screen.getByText("-1")).toHaveClass("tw-text-rose-400");
  });

  it("uses realtime progress for approve waves", () => {
    render(<MyStreamWaveMyVoteVotes drop={drop} winningThreshold={10} />);

    expect(ProgressMock.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        current: 5,
        projected: 9,
        tooltipLabel: "Votes given now",
      })
    );
  });
});
