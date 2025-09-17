import { MemeCalendarOverviewUpcomingMints } from "@/components/meme-calendar/MemeCalendarOverview";
import { render, screen } from "@testing-library/react";

describe("MemeCalendarOverviewUpcomingMints", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows next season when current season has no upcoming mints", () => {
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2025, 11, 31)));
    render(<MemeCalendarOverviewUpcomingMints displayTz="utc" />);
    expect(screen.getByText(/Upcoming Mints for SZN 14/)).toBeInTheDocument();
    expect(
      screen.queryByText(/No upcoming mints in this season./)
    ).not.toBeInTheDocument();
  });
});
