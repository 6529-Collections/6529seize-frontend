import { render, fireEvent } from "@testing-library/react";
import React from "react";
import { WaveWinnersDropHeader } from "@/components/waves/winners/drops/header/WaveWinnersDropHeader";

jest.mock(
  "@/components/waves/winners/drops/header/WaveWinnersDropHeaderTotalVotes",
  () => () => <div data-testid="votes" />
);
jest.mock(
  "@/components/waves/winners/drops/header/WaveWinnersDropHeaderVoters",
  () => () => <div data-testid="voters" />
);
jest.mock(
  "@/components/waves/winners/drops/header/WaveWinnersDropHeaderAuthorHandle",
  () => () => <div data-testid="author" />
);
jest.mock("@/components/waves/drops/winner/WinnerDropBadge", () => () => (
  <div data-testid="badge" />
));
jest.mock("@/components/waves/drops/time/WaveDropTime", () => () => (
  <div data-testid="time" />
));
jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: () => <div data-testid="author-badges" />,
}));

const winner = {
  place: 1,
  drop: {
    id: "drop-1",
    author: { id: "author-1" },
    created_at: 1,
    winning_context: {},
  },
} as any;

describe("WaveWinnersDropHeader", () => {
  it("renders voting info when enabled", () => {
    const { getByTestId } = render(<WaveWinnersDropHeader winner={winner} />);
    expect(getByTestId("author")).toBeInTheDocument();
    expect(getByTestId("author-badges")).toBeInTheDocument();
    expect(getByTestId("badge")).toBeInTheDocument();
    expect(getByTestId("votes")).toBeInTheDocument();
    expect(getByTestId("voters")).toBeInTheDocument();
  });

  it("hides voting info when disabled and stops propagation", () => {
    const stop = jest.fn();
    const { queryByTestId, getByRole, getByTestId } = render(
      <div role="button" onClick={stop}>
        <WaveWinnersDropHeader winner={winner} showVotingInfo={false} />
      </div>
    );
    fireEvent.click(getByRole("button").firstChild as HTMLElement);
    expect(stop).not.toHaveBeenCalled();
    expect(getByTestId("author-badges")).toBeInTheDocument();
    expect(queryByTestId("votes")).toBeNull();
    expect(queryByTestId("voters")).toBeNull();
  });
});
