import { render, screen } from "@testing-library/react";
import React from "react";
import WaveWinnersDropHeaderVoters from "@/components/waves/winners/drops/header/WaveWinnersDropHeaderVoters";

jest.mock("@/components/waves/winners/drops/header/WaveWinnersDropHeaderVoter", () => {
  return function Mock(props: any) {
    return <div data-testid="voter">{props.voter.profile.handle}</div>;
  };
});

const baseWinner = {
  place: 1,
  drop: {
    top_raters: [{ profile: { handle: "bob" }, rating: 2 }],
    raters_count: 3,
    wave: { voting_credit_type: "REP" },
    context_profile_context: { rating: 5 },
  },
};

test("shows user vote when available", () => {
  render(<WaveWinnersDropHeaderVoters winner={baseWinner as any} />);
  expect(screen.getByText("3")).toBeInTheDocument();
  expect(screen.getByText(/voters/)).toBeInTheDocument();
  expect(screen.getByText(/Your vote:/)).toBeInTheDocument();
  expect(screen.getByText("5 REP")).toBeInTheDocument();
});

test("hides user vote when not voted", () => {
  const winner = { ...baseWinner, drop: { ...baseWinner.drop, context_profile_context: {} } };
  render(<WaveWinnersDropHeaderVoters winner={winner as any} />);
  expect(screen.queryByText(/Your vote:/)).not.toBeInTheDocument();
});
