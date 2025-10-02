import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineToggleHeader } from "@/components/waves/leaderboard/time/TimelineToggleHeader";
import { SeizeSettingsProvider } from "@/contexts/SeizeSettingsContext";

jest.mock("@/helpers/waves/time.utils", () => ({
  calculateTimeLeft: jest.fn(() => ({ days: 0, hours: 1, minutes: 2, seconds: 3 })),
}));

jest.mock("@/components/waves/leaderboard/time/TimeCountdown", () => ({
  TimeCountdown: ({ timeLeft }: any) => <div data-testid="countdown">{timeLeft.seconds}</div>,
}));

jest.mock("@/hooks/useWave", () => ({
  useWave: jest.fn(() => null),
}));

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(() => Promise.resolve({
    memes_wave_id: "test-wave-id"
  })),
}));

describe("TimelineToggleHeader", () => {
  it("renders countdown when next decision time provided", () => {
    const setIsOpen = jest.fn();
    render(
      <SeizeSettingsProvider>
        <TimelineToggleHeader isOpen={false} setIsOpen={setIsOpen} nextDecisionTime={Date.now()+1000} />
      </SeizeSettingsProvider>
    );
    expect(screen.getByTestId("countdown").textContent).toBe("3");
    fireEvent.click(screen.getByText(/Next winner/).closest("div")!);
    expect(setIsOpen).toHaveBeenCalledWith(true);
  });
});
