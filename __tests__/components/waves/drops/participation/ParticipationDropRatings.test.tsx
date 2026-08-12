import { render, screen } from "@testing-library/react";
import React from "react";
import { ParticipationDropRatings } from "@/components/waves/drops/participation/ParticipationDropRatings";

const mockContainer = jest.fn(() => <div data-testid="container" />);

jest.mock(
  "@/components/waves/drops/participation/ratings/ParticipationDropRatingsContainer",
  () => (props: any) => {
    mockContainer(props);
    return <div data-testid="container" />;
  }
);

describe("ParticipationDropRatings", () => {
  beforeEach(() => {
    mockContainer.mockClear();
  });

  it("forwards props to container", () => {
    const drop = { id: "d1" } as any;
    render(
      <ParticipationDropRatings drop={drop} rank={5} winningThreshold={12} />
    );
    expect(screen.getByTestId("container")).toBeInTheDocument();
    expect(mockContainer).toHaveBeenCalledWith({
      drop,
      rank: 5,
      winningThreshold: 12,
      winningThresholdMinDurationMs: undefined,
      isVotingClosed: false,
    });
  });

  it("forwards closed voting state to container", () => {
    const drop = { id: "d1" } as any;
    render(<ParticipationDropRatings drop={drop} isVotingClosed={true} />);
    expect(screen.getByTestId("container")).toBeInTheDocument();
    expect(mockContainer).toHaveBeenCalledWith({
      drop,
      rank: null,
      winningThreshold: undefined,
      winningThresholdMinDurationMs: undefined,
      isVotingClosed: true,
    });
  });
});
