import MemeCalendarOverview from "@/components/meme-calendar/MemeCalendarOverview";
import { render, screen } from "@testing-library/react";

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({
    isCapacitor: false,
    platform: "web",
    isIos: false,
    isAndroid: false,
    orientation: 0,
    keyboardVisible: false,
    isActive: false,
  }),
}));

describe("MemeCalendarOverview upcoming mints card", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows next season when current season has no upcoming mints", () => {
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2025, 11, 31)));
    render(<MemeCalendarOverview displayTz="utc" />);
    expect(screen.getByText(/Upcoming Mints for SZN 14/)).toBeInTheDocument();
    expect(
      screen.queryByText(/No upcoming mints in this season./)
    ).not.toBeInTheDocument();
  });
});
