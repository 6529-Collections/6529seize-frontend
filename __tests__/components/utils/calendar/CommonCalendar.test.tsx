import { render, screen, fireEvent } from "@testing-library/react";
import CommonCalendar from "@/components/utils/calendar/CommonCalendar";

jest.mock("@/helpers/calendar/calendar.helpers", () => ({
  __esModule: true,
  generateCalendar: jest.fn(() => [
    { startTimestamp: 0, date: 1, isActiveMonth: true },
  ]),
}));

jest.mock("@/components/utils/calendar/CommonCalendarDay", () => ({
  __esModule: true,
  default: () => <div data-testid="day" />,
}));

describe("CommonCalendar", () => {
  it("initializes from selected timestamp and navigates months", () => {
    const setSelected = jest.fn();
    const ts = new Date("2025-03-15T00:00:00Z").getTime();
    render(
      <CommonCalendar
        initialMonth={0}
        initialYear={2024}
        minTimestamp={null}
        maxTimestamp={null}
        selectedTimestamp={ts}
        setSelectedTimestamp={setSelected}
      />
    );
    expect(screen.getByText("March")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Next month"));
    expect(screen.getByText("April")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText("March")).toBeInTheDocument();
  });

  it("resets the visible month when the selected date changes", () => {
    const setSelected = jest.fn();
    const marchTimestamp = new Date("2025-03-15T00:00:00Z").getTime();
    const julyTimestamp = new Date("2025-07-10T00:00:00Z").getTime();

    const { rerender } = render(
      <CommonCalendar
        initialMonth={0}
        initialYear={2024}
        minTimestamp={null}
        maxTimestamp={null}
        selectedTimestamp={marchTimestamp}
        setSelectedTimestamp={setSelected}
      />
    );

    fireEvent.click(screen.getByLabelText("Next month"));
    expect(screen.getByText("April")).toBeInTheDocument();

    rerender(
      <CommonCalendar
        initialMonth={0}
        initialYear={2024}
        minTimestamp={null}
        maxTimestamp={null}
        selectedTimestamp={julyTimestamp}
        setSelectedTimestamp={setSelected}
      />
    );

    expect(screen.getByText("July")).toBeInTheDocument();
  });

  it("keeps the visible month when only the selected time changes", () => {
    const setSelected = jest.fn();
    const morningTimestamp = new Date(2025, 2, 15, 10, 0, 0).getTime();
    const eveningTimestamp = new Date(2025, 2, 15, 18, 30, 0).getTime();

    const { rerender } = render(
      <CommonCalendar
        initialMonth={0}
        initialYear={2024}
        minTimestamp={null}
        maxTimestamp={null}
        selectedTimestamp={morningTimestamp}
        setSelectedTimestamp={setSelected}
      />
    );

    fireEvent.click(screen.getByLabelText("Next month"));
    expect(screen.getByText("April")).toBeInTheDocument();

    rerender(
      <CommonCalendar
        initialMonth={0}
        initialYear={2024}
        minTimestamp={null}
        maxTimestamp={null}
        selectedTimestamp={eveningTimestamp}
        setSelectedTimestamp={setSelected}
      />
    );

    expect(screen.getByText("April")).toBeInTheDocument();
  });

  it("resets to the initial month when the selection is cleared", () => {
    const setSelected = jest.fn();
    const { rerender } = render(
      <CommonCalendar
        initialMonth={0}
        initialYear={2024}
        minTimestamp={null}
        maxTimestamp={null}
        selectedTimestamp={null}
        setSelectedTimestamp={setSelected}
      />
    );

    expect(screen.getByText("January")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Next month"));
    expect(screen.getByText("February")).toBeInTheDocument();

    rerender(
      <CommonCalendar
        initialMonth={5}
        initialYear={2026}
        minTimestamp={null}
        maxTimestamp={null}
        selectedTimestamp={null}
        setSelectedTimestamp={setSelected}
      />
    );

    expect(screen.getByText("June")).toBeInTheDocument();
  });
});
