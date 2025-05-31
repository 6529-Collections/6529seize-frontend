import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineToggleHeader } from "../../../../../components/waves/leaderboard/time/TimelineToggleHeader";
import { calculateTimeLeft } from "../../../../../helpers/waves/time.utils";

jest.mock("../../../../../helpers/waves/time.utils", () => ({
  calculateTimeLeft: jest.fn(() => ({ days: 0, hours: 1, minutes: 2, seconds: 3 })),
}));

jest.mock("../../../../../components/waves/leaderboard/time/TimeCountdown", () => ({
  TimeCountdown: ({ timeLeft }: any) => <div data-testid="countdown">{timeLeft.seconds}</div>,
}));

describe("TimelineToggleHeader", () => {
  it("renders countdown when next decision time provided", () => {
    const setIsOpen = jest.fn();
    render(
      <TimelineToggleHeader icon={{} as any} isOpen={false} setIsOpen={setIsOpen} nextDecisionTime={Date.now()+1000} />
    );
    expect(screen.getByTestId("countdown").textContent).toBe("3");
    fireEvent.click(screen.getByText(/Next winner/).closest("div")!);
    expect(setIsOpen).toHaveBeenCalledWith(true);
  });
});
