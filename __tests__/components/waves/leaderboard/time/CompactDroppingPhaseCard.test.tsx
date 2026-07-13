import React from "react";
import { render, screen } from "@testing-library/react";
import { CompactDroppingPhaseCard } from "@/components/waves/leaderboard/time/CompactDroppingPhaseCard";

const useWaveTimers = jest.fn();
jest.mock("@/hooks/useWaveTimers", () => ({
  useWaveTimers: (...args: any[]) => useWaveTimers(...args),
}));
const useWave = jest.fn();
jest.mock("@/hooks/useWave", () => ({
  useWave: (...args: any[]) => useWave(...args),
}));

const wave: any = { id: "w1", participation: { period: { min: 1, max: 100 } } };
const perpetualWave: any = {
  id: "w2",
  participation: { period: { min: 1, max: null } },
};

beforeEach(() => jest.clearAllMocks());

test("shows countdown when not completed", () => {
  useWaveTimers.mockReturnValue({
    participation: {
      isCompleted: false,
      isUpcoming: true,
      timeLeft: { days: 1, hours: 2, minutes: 3 },
    },
  });
  useWave.mockReturnValue({ participation: { startTime: 0, endTime: 100 } });
  render(<CompactDroppingPhaseCard wave={wave} />);
  expect(screen.getByText("Dropping starts in")).toBeInTheDocument();
  expect(screen.getByText("1d 2h 3m")).toBeInTheDocument();
});

test("shows completion message when completed", () => {
  useWaveTimers.mockReturnValue({
    participation: {
      isCompleted: true,
      isUpcoming: false,
      timeLeft: { days: 0, hours: 0, minutes: 0 },
    },
  });
  useWave.mockReturnValue({ participation: { startTime: 0, endTime: 100 } });
  render(<CompactDroppingPhaseCard wave={wave} />);
  expect(screen.getByText("Dropping complete")).toBeInTheDocument();
});

test("shows open state instead of a countdown for open-ended submissions", () => {
  useWaveTimers.mockReturnValue({
    participation: {
      isCompleted: false,
      isUpcoming: false,
      timeLeft: { days: 99999, hours: 0, minutes: 0 },
    },
  });
  useWave.mockReturnValue({
    participation: { startTime: 0, endTime: Number.MAX_SAFE_INTEGER },
  });
  render(<CompactDroppingPhaseCard wave={perpetualWave} />);
  expect(screen.getByText("Dropping open")).toBeInTheDocument();
  expect(screen.getByText("No end date")).toBeInTheDocument();
  expect(screen.queryByText(/ends in/)).toBeNull();
});
