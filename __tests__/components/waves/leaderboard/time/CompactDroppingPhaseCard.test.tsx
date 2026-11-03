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

test.each([
  [true, "Submissions open in"],
  [false, "Submissions close in"],
])("shows the correct countdown for upcoming=%s", (isUpcoming, label) => {
  useWaveTimers.mockReturnValue({
    participation: {
      isCompleted: false,
      isUpcoming,
      timeLeft: { days: 1, hours: 2, minutes: 3 },
    },
  });
  useWave.mockReturnValue({ participation: { startTime: 0, endTime: 100 } });
  render(<CompactDroppingPhaseCard wave={wave} />);
  expect(screen.getByText(label)).toBeInTheDocument();
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
  const endsAt = Date.UTC(2024, 11, 3, 8, 33);
  useWave.mockReturnValue({ participation: { startTime: 0, endTime: endsAt } });
  render(<CompactDroppingPhaseCard wave={wave} />);
  expect(screen.getByText("Submissions closed")).toBeInTheDocument();
  expect(screen.getByText("Dec 3, 2024")).toHaveAttribute(
    "dateTime",
    new Date(endsAt).toISOString()
  );
  expect(screen.getByText("Dec 3, 2024")).toHaveAccessibleName(
    /December 3, 2024/
  );
  expect(screen.queryByText("0h 0m")).not.toBeInTheDocument();
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
  expect(screen.getByText("Submissions open")).toBeInTheDocument();
  expect(screen.getByText("No end date")).toBeInTheDocument();
  expect(screen.queryByText(/close in/)).toBeNull();
});
