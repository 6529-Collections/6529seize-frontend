import React from "react";
import { render, screen } from "@testing-library/react";
import { CompactVotingPhaseCard } from "@/components/waves/leaderboard/time/CompactVotingPhaseCard";

const useWaveTimers = jest.fn();
jest.mock("@/hooks/useWaveTimers", () => ({
  useWaveTimers: (...args: any[]) => useWaveTimers(...args),
}));
const useWave = jest.fn();
jest.mock("@/hooks/useWave", () => ({
  useWave: (...args: any[]) => useWave(...args),
}));

const wave: any = { id: "w1", voting: { period: { min: 1, max: 100 } } };
const perpetualWave: any = {
  id: "w2",
  voting: { period: { min: 1, max: null } },
};

beforeEach(() => jest.clearAllMocks());

test("shows countdown when not completed", () => {
  useWaveTimers.mockReturnValue({
    voting: {
      isCompleted: false,
      isUpcoming: true,
      timeLeft: { days: 1, hours: 2, minutes: 3 },
    },
  });
  useWave.mockReturnValue({ voting: { startTime: 0, endTime: 100 } });
  render(<CompactVotingPhaseCard wave={wave} />);
  expect(screen.getByText("Voting starts in")).toBeInTheDocument();
  expect(screen.getByText("1d 2h 3m")).toBeInTheDocument();
});

test("shows completion message when completed", () => {
  useWaveTimers.mockReturnValue({
    voting: {
      isCompleted: true,
      isUpcoming: false,
      timeLeft: { days: 0, hours: 0, minutes: 0 },
    },
  });
  useWave.mockReturnValue({ voting: { startTime: 0, endTime: 1000 } });
  render(<CompactVotingPhaseCard wave={wave} />);
  expect(screen.getByText("Voting complete")).toBeInTheDocument();
});

test("shows ongoing state instead of a countdown for open-ended voting", () => {
  useWaveTimers.mockReturnValue({
    voting: {
      isCompleted: false,
      isUpcoming: false,
      timeLeft: { days: 99999, hours: 0, minutes: 0 },
    },
  });
  useWave.mockReturnValue({
    voting: { startTime: 0, endTime: Number.MAX_SAFE_INTEGER },
  });
  render(<CompactVotingPhaseCard wave={perpetualWave} />);
  expect(screen.getByText("Voting ongoing")).toBeInTheDocument();
  expect(screen.getByText("No end date")).toBeInTheDocument();
  expect(screen.queryByText(/ends in/)).toBeNull();
});
