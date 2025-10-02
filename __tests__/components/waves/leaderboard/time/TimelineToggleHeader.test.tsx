import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineToggleHeader } from "../../../../../components/waves/leaderboard/time/TimelineToggleHeader";
import { SeizeSettingsProvider } from "../../../../../contexts/SeizeSettingsContext";

jest.mock("../../../../../hooks/useWave", () => ({
  useWave: jest.fn(() => null),
}));

jest.mock("../../../../../services/6529api", () => ({
  fetchUrl: jest.fn(() => Promise.resolve({
    memes_wave_id: "test-wave-id"
  })),
}));

describe("TimelineToggleHeader", () => {
  it("renders Decision Timeline when next decision time provided", () => {
    const setIsOpen = jest.fn();
    render(
      <SeizeSettingsProvider>
        <TimelineToggleHeader isOpen={false} setIsOpen={setIsOpen} nextDecisionTime={Date.now()+1000} />
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
});
