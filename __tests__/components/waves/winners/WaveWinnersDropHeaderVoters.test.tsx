import { render, screen } from "@testing-library/react";
import React from "react";
import WaveWinnersDropHeaderVoters from "@/components/waves/winners/drops/header/WaveWinnersDropHeaderVoters";

jest.mock(
  "@/components/waves/winners/drops/header/WaveWinnersDropHeaderVoter",
  () => {
    return function Mock(props: any) {
      return <div data-testid="voter">{props.voter.profile.handle}</div>;
    };
  }
);
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => false,
}));

const baseWinner = {
  place: 1,
  drop: {
    id: "drop-1",
    top_raters: [{ profile: { handle: "bob" }, rating: 2 }],
    raters_count: 3,
    wave: { voting_credit_type: "REP" },
    context_profile_context: { rating: 5 },
  },
};

test("shows user vote when available", () => {
  render(<WaveWinnersDropHeaderVoters winner={baseWinner as any} />);
  expect(
    screen.getByRole("button", {
      name: "View voters and vote log for 3 voters",
    })
  ).toBeInTheDocument();
  expect(screen.getByText(/Your votes/)).toBeInTheDocument();
  expect(screen.getByText("5 Rep")).toBeInTheDocument();
});

test("shows vote details trigger for normal winners", () => {
  render(<WaveWinnersDropHeaderVoters winner={baseWinner as any} />);

  expect(
    screen.getByRole("button", {
      name: "View voters and vote log for 3 voters",
    })
  ).toHaveClass(
    "tw-rounded-lg",
    "tw-border",
    "tw-border-iron-700",
    "tw-bg-iron-900/40"
  );
});

test("hides user vote when not voted", () => {
  const winner = {
    ...baseWinner,
    drop: { ...baseWinner.drop, context_profile_context: {} },
  };
  render(<WaveWinnersDropHeaderVoters winner={winner as any} />);
  expect(screen.queryByText(/Your votes/)).not.toBeInTheDocument();
});
