import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DecisionsFirst from "@/components/waves/create-wave/dates/DecisionsFirst";

jest.mock("@/components/utils/calendar/CommonCalendar", () => ({
  __esModule: true,
  default: ({
    setSelectedTimestamp,
  }: {
    setSelectedTimestamp: (timestamp: number) => void;
  }) => (
    <button
      type="button"
      onClick={() => setSelectedTimestamp(new Date(2026, 0, 5).getTime())}
    >
      Select another date
    </button>
  ),
}));

jest.mock("@/components/common/TimePicker", () => ({
  __esModule: true,
  default: ({
    onTimeChange,
  }: {
    onTimeChange: (hours: number, minutes: number) => void;
  }) => (
    <button type="button" onClick={() => onTimeChange(9, 15)}>
      Select another time
    </button>
  ),
}));

describe("DecisionsFirst", () => {
  it("preserves the selected time when the date changes", async () => {
    const user = userEvent.setup();
    const setFirstDecisionTime = jest.fn();

    render(
      <DecisionsFirst
        firstDecisionTime={new Date(2026, 0, 2, 14, 35).getTime()}
        setFirstDecisionTime={setFirstDecisionTime}
        minTimestamp={null}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Select another date" })
    );

    const selected = new Date(setFirstDecisionTime.mock.calls[0]![0]);
    expect(selected.getDate()).toBe(5);
    expect(selected.getHours()).toBe(14);
    expect(selected.getMinutes()).toBe(35);
  });

  it("preserves the selected date when the time changes", async () => {
    const user = userEvent.setup();
    const setFirstDecisionTime = jest.fn();

    render(
      <DecisionsFirst
        firstDecisionTime={new Date(2026, 0, 2, 14, 35).getTime()}
        setFirstDecisionTime={setFirstDecisionTime}
        minTimestamp={null}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Select another time" })
    );

    const selected = new Date(setFirstDecisionTime.mock.calls[0]![0]);
    expect(selected.getDate()).toBe(2);
    expect(selected.getHours()).toBe(9);
    expect(selected.getMinutes()).toBe(15);
  });
});
