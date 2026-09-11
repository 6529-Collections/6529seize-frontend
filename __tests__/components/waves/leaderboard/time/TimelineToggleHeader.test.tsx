import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineToggleHeader } from "@/components/waves/leaderboard/time/TimelineToggleHeader";
import { SeizeSettingsProvider } from "@/contexts/SeizeSettingsContext";
import type { ApiWaveDecisionPause } from "@/generated/models/ApiWaveDecisionPause";

jest.mock("@/helpers/waves/time.utils", () => ({
  calculateTimeLeft: jest.fn(() => ({
    days: 0,
    hours: 1,
    minutes: 2,
    seconds: 3,
  })),
}));

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(() =>
    Promise.resolve({
      memes_wave_id: "test-wave-id",
    })
  ),
}));

describe("TimelineToggleHeader", () => {
  const timeLeft = {
    days: 0,
    hours: 1,
    minutes: 2,
    seconds: 3,
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders Decision Timeline when next decision time provided", () => {
    const setIsOpen = jest.fn();
    render(
      <SeizeSettingsProvider>
        <TimelineToggleHeader
          isOpen={false}
          setIsOpen={setIsOpen}
          nextDecisionTime={Date.now() + 1000}
          timeLeft={timeLeft}
        />
      </SeizeSettingsProvider>
    );
    expect(screen.getByText("Decision Timeline")).toBeInTheDocument();
    expect(screen.getByText("Next winner")).toBeInTheDocument();
    expect(screen.getByText("Next winner").parentElement).toHaveClass(
      "tw-text-xs"
    );
    const toggle = screen.getByRole("button", {
      name: "Toggle decision timeline",
    });
    expect(toggle).toHaveAccessibleDescription(
      "Next winner in 1 hour, 2 minutes, 3 seconds"
    );
    fireEvent.click(toggle);
    expect(setIsOpen).toHaveBeenCalledWith(true);
  });

  it("uses the actual next decision date in the paused banner", () => {
    const nextDecisionTime = Date.UTC(2026, 3, 10, 12, 0, 0);
    const currentPause: ApiWaveDecisionPause = {
      start_time: Date.UTC(2026, 3, 8, 12, 0, 0),
      end_time: Date.UTC(2026, 3, 9, 12, 0, 0),
    };
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(nextDecisionTime);
    const pauseEndDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(currentPause.end_time);

    render(
      <SeizeSettingsProvider>
        <TimelineToggleHeader
          isOpen={false}
          setIsOpen={jest.fn()}
          nextDecisionTime={nextDecisionTime}
          timeLeft={timeLeft}
          isPaused
          currentPause={currentPause}
        />
      </SeizeSettingsProvider>
    );

    expect(
      screen.getByText(`Next decision after ${formattedDate}`)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle decision timeline" })
    ).toHaveAccessibleDescription(`Paused Next decision after ${formattedDate}`);
    expect(
      screen.queryByText(`Next decision after ${pauseEndDate}`)
    ).not.toBeInTheDocument();
  });

  it("shows no decision scheduled when paused without a next decision time", () => {
    const currentPause: ApiWaveDecisionPause = {
      start_time: Date.UTC(2026, 3, 8, 12, 0, 0),
      end_time: Date.UTC(2026, 3, 9, 12, 0, 0),
    };

    render(
      <SeizeSettingsProvider>
        <TimelineToggleHeader
          isOpen={false}
          setIsOpen={jest.fn()}
          nextDecisionTime={null}
          timeLeft={timeLeft}
          isPaused
          currentPause={currentPause}
        />
      </SeizeSettingsProvider>
    );

    expect(screen.getByText("No decision scheduled")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle decision timeline" })
    ).toHaveAccessibleDescription("Paused No decision scheduled");
  });
});
