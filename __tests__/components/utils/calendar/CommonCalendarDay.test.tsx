import { render, fireEvent } from "@testing-library/react";
import CommonCalendarDay from "@/components/utils/calendar/CommonCalendarDay";
import type { CalendarDay } from "@/helpers/calendar/calendar.helpers";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("CommonCalendarDay", () => {
  it("disables button for inactive month", () => {
    const day: CalendarDay = {
      date: 1,
      isActiveMonth: false,
      startTimestamp: 0,
    };
    const setSelected = jest.fn();
    const { getByRole } = render(
      <CommonCalendarDay
        day={day}
        selectedTimestamp={null}
        minTimestamp={null}
        maxTimestamp={null}
        setSelectedTimestamp={setSelected}
      />
    );
    const button = getByRole("button");
    expect(button).toBeDisabled();
  });

  it("selects minTimestamp when start equals min", () => {
    const min = 1000;
    const day: CalendarDay = {
      date: 1,
      isActiveMonth: true,
      startTimestamp: min,
    };
    const setSelected = jest.fn();
    const { getByRole } = render(
      <CommonCalendarDay
        day={day}
        selectedTimestamp={null}
        minTimestamp={min}
        maxTimestamp={null}
        setSelectedTimestamp={setSelected}
      />
    );
    fireEvent.click(getByRole("button"));
    expect(setSelected).toHaveBeenCalledWith(min);
  });

  it("keeps the selected day focusable and exposes its selected state", () => {
    const selected = new Date(2026, 7, 14).getTime();
    const day: CalendarDay = {
      date: 14,
      isActiveMonth: true,
      startTimestamp: selected,
    };
    const setSelected = jest.fn();
    const { getByRole } = render(
      <CommonCalendarDay
        day={day}
        selectedTimestamp={selected}
        minTimestamp={null}
        maxTimestamp={null}
        setSelectedTimestamp={setSelected}
      />
    );

    const button = getByRole("button", { name: /august 14, 2026/i });
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    expect(setSelected).toHaveBeenCalledWith(selected);
  });
});
