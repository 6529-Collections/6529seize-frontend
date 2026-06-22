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
        />
      </SeizeSettingsProvider>
    );
    expect(screen.getByText("Decision Timeline")).toBeInTheDocument();
    const toggle = screen.getByText(/Decision Timeline/).closest("div");
    if (!toggle) {
      throw new Error("Toggle container not found");
    }
    fireEvent.click(toggle);
    expect(setIsOpen).toHaveBeenCalledWith(true);
  });

  it("uses the actual next decision date in the paused banner", () => {
    const nextDecisionTime = Date.UTC(2026, 3, 10, 12, 0, 0);
    const currentPause: ApiWaveDecisionPause = {
      start_time: Date.UTC(2026, 3, 8, 12, 0, 0),
      end_time: Date.UTC(2026, 3, 9, 12, 0, 0),
    };
    const formatSpy = jest
      .spyOn(Date.prototype, "toLocaleDateString")
      .mockImplementation(function mockToLocaleDateString() {
        return `formatted:${this.getTime()}`;
      });

    render(
      <SeizeSettingsProvider>
        <TimelineToggleHeader
          isOpen={false}
          setIsOpen={jest.fn()}
          nextDecisionTime={nextDecisionTime}
          isPaused
          currentPause={currentPause}
        />
      </SeizeSettingsProvider>
    );

    expect(
      screen.getByText(`Next decision after formatted:${nextDecisionTime}`)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        `Next decision after formatted:${currentPause.end_time}`
      )
    ).not.toBeInTheDocument();
    expect(formatSpy).toHaveBeenCalled();
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
          isPaused
          currentPause={currentPause}
        />
      </SeizeSettingsProvider>
    );

    expect(screen.getByText("No decision scheduled")).toBeInTheDocument();
  });
});
