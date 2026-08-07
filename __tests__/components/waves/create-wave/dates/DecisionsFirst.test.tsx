import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DecisionsFirst from "@/components/waves/create-wave/dates/DecisionsFirst";

// The calendar stub takes the timestamp to emit from a text input so tests can
// drive any date without re-mocking, and mirrors the props it receives.
jest.mock(
  "@/components/utils/calendar/CommonCalendar",
  () =>
    function MockCommonCalendar(props: {
      readonly initialMonth: number;
      readonly initialYear: number;
      readonly selectedTimestamp: number;
      readonly minTimestamp: number | null;
      readonly maxTimestamp: number | null;
      readonly setSelectedTimestamp: (timestamp: number) => void;
    }) {
      return (
        <div
          data-testid="calendar"
          data-initial-month={props.initialMonth}
          data-initial-year={props.initialYear}
          data-selected-timestamp={props.selectedTimestamp}
          data-min-timestamp={props.minTimestamp ?? ""}
          data-max-timestamp={props.maxTimestamp ?? ""}>
          <input
            id="next-timestamp"
            aria-label="next-timestamp"
            defaultValue="1000"
          />
          <button
            type="button"
            onClick={() => {
              // Looked up by id rather than sibling order so the stub survives
              // any reshuffling of its own markup.
              const input =
                document.querySelector<HTMLInputElement>("#next-timestamp");
              props.setSelectedTimestamp(Number(input?.value));
            }}>
            calendar
          </button>
        </div>
      );
    }
);

jest.mock(
  "@/components/common/TimePicker",
  () =>
    function MockTimePicker(props: {
      readonly hours: number;
      readonly minutes: number;
      readonly minTime: { hours: number; minutes: number } | null;
      readonly onTimeChange: (hours: number, minutes: number) => void;
    }) {
      return (
        <div
          data-testid="time-picker"
          data-hours={props.hours}
          data-minutes={props.minutes}
          data-min-time={
            props.minTime
              ? `${props.minTime.hours}:${props.minTime.minutes}`
              : ""
          }>
          <button type="button" onClick={() => props.onTimeChange(1, 30)}>
            time
          </button>
        </div>
      );
    }
);

jest.mock(
  "@/components/common/TooltipIconButton",
  () =>
    function MockTooltipIconButton(props: {
      readonly tooltipPosition?: string;
      readonly tooltipText: string;
    }) {
      return (
        <div
          data-testid="tooltip"
          data-position={props.tooltipPosition ?? ""}
          data-text={props.tooltipText}
        />
      );
    }
);

// Local-time constructors keep these assertions timezone-independent.
const at = (
  year: number,
  monthIndex: number,
  day: number,
  hours: number,
  minutes: number
) => new Date(year, monthIndex, day, hours, minutes, 0, 0).getTime();

const renderStep = (
  overrides: Partial<React.ComponentProps<typeof DecisionsFirst>> = {}
) => {
  const setFirstDecisionTime = jest.fn();
  const view = render(
    <DecisionsFirst
      firstDecisionTime={0}
      setFirstDecisionTime={setFirstDecisionTime}
      minTimestamp={null}
      {...overrides}
    />
  );
  return { setFirstDecisionTime, ...view };
};

const pickDate = async (timestamp: number) => {
  fireEvent.change(screen.getByLabelText("next-timestamp"), {
    target: { value: String(timestamp) },
  });
  await userEvent.click(screen.getByRole("button", { name: "calendar" }));
};

const lastTimestamp = (mock: jest.Mock): number =>
  mock.mock.calls.at(-1)?.[0] as number;

describe("DecisionsFirst", () => {
  it("updates date when calendar clicked", async () => {
    const { setFirstDecisionTime } = renderStep();

    await userEvent.click(screen.getByRole("button", { name: "calendar" }));

    expect(setFirstDecisionTime).toHaveBeenCalledWith(expect.any(Number));
  });

  it("updates time when time picker used", async () => {
    const { setFirstDecisionTime } = renderStep({
      firstDecisionTime: at(2026, 0, 15, 9, 0),
    });

    await userEvent.click(screen.getByRole("button", { name: "time" }));

    const emitted = new Date(lastTimestamp(setFirstDecisionTime));
    expect(emitted.getHours()).toBe(1);
    expect(emitted.getMinutes()).toBe(30);
    expect(emitted.getDate()).toBe(15);
  });

  it("does not seed a default on mount (the config/date layer owns that)", async () => {
    const { setFirstDecisionTime } = renderStep({
      minTimestamp: at(2026, 0, 1, 12, 0),
    });

    // The safe one-week-out default now lives in getDefaultFirstDecisionTime,
    // applied at config init and in the date-commit path — this step no longer
    // pushes a default back up to its parent via an effect.
    await screen.findByTestId("calendar");
    expect(setFirstDecisionTime).not.toHaveBeenCalled();
  });

  it("seeds the calendar from the incoming decision time", () => {
    renderStep({ firstDecisionTime: at(2026, 4, 20, 8, 15) });

    const calendar = screen.getByTestId("calendar");
    expect(calendar).toHaveAttribute("data-initial-month", "4");
    expect(calendar).toHaveAttribute("data-initial-year", "2026");
    expect(screen.getByTestId("time-picker")).toHaveAttribute("data-hours", "8");
    expect(screen.getByTestId("time-picker")).toHaveAttribute(
      "data-minutes",
      "15"
    );
  });

  it("tracks a changed decision time prop", () => {
    const setFirstDecisionTime = jest.fn();
    const { rerender } = render(
      <DecisionsFirst
        firstDecisionTime={at(2026, 0, 15, 9, 0)}
        setFirstDecisionTime={setFirstDecisionTime}
        minTimestamp={null}
      />
    );

    rerender(
      <DecisionsFirst
        firstDecisionTime={at(2026, 0, 16, 17, 45)}
        setFirstDecisionTime={setFirstDecisionTime}
        minTimestamp={null}
      />
    );

    const timePicker = screen.getByTestId("time-picker");
    expect(timePicker).toHaveAttribute("data-hours", "17");
    expect(timePicker).toHaveAttribute("data-minutes", "45");
    expect(setFirstDecisionTime).not.toHaveBeenCalled();
  });

  it("keeps the selected time when moving to a day after the minimum", async () => {
    const { setFirstDecisionTime } = renderStep({
      firstDecisionTime: at(2026, 0, 15, 9, 20),
      minTimestamp: at(2026, 0, 10, 18, 0),
    });

    await pickDate(at(2026, 0, 20, 0, 0));

    const emitted = new Date(lastTimestamp(setFirstDecisionTime));
    expect(emitted.getDate()).toBe(20);
    expect(emitted.getHours()).toBe(9);
    expect(emitted.getMinutes()).toBe(20);
  });

  it("keeps the selected time on the minimum day when it is already late enough", async () => {
    const { setFirstDecisionTime } = renderStep({
      firstDecisionTime: at(2026, 0, 15, 20, 0),
      minTimestamp: at(2026, 0, 10, 18, 0),
    });

    await pickDate(at(2026, 0, 10, 0, 0));

    const emitted = new Date(lastTimestamp(setFirstDecisionTime));
    expect(emitted.getDate()).toBe(10);
    expect(emitted.getHours()).toBe(20);
    expect(emitted.getMinutes()).toBe(0);
  });

  it("pushes the time 30 minutes past the minimum when the minimum day would start too early", async () => {
    const { setFirstDecisionTime } = renderStep({
      firstDecisionTime: at(2026, 0, 15, 9, 0),
      minTimestamp: at(2026, 0, 10, 18, 0),
    });

    await pickDate(at(2026, 0, 10, 0, 0));

    const emitted = new Date(lastTimestamp(setFirstDecisionTime));
    expect(emitted.getHours()).toBe(18);
    expect(emitted.getMinutes()).toBe(30);
  });

  it("treats the same hour with earlier minutes as too early", async () => {
    const { setFirstDecisionTime } = renderStep({
      firstDecisionTime: at(2026, 0, 15, 18, 5),
      minTimestamp: at(2026, 0, 10, 18, 20),
    });

    await pickDate(at(2026, 0, 10, 0, 0));

    const emitted = new Date(lastTimestamp(setFirstDecisionTime));
    expect(emitted.getHours()).toBe(18);
    expect(emitted.getMinutes()).toBe(50);
  });

  it("rolls the buffer into the next hour when the minute overflows", async () => {
    const { setFirstDecisionTime } = renderStep({
      firstDecisionTime: at(2026, 0, 15, 9, 0),
      minTimestamp: at(2026, 0, 10, 18, 45),
    });

    await pickDate(at(2026, 0, 10, 0, 0));

    const emitted = new Date(lastTimestamp(setFirstDecisionTime));
    expect(emitted.getHours()).toBe(19);
    expect(emitted.getMinutes()).toBe(15);
  });

  it("applies no minimum-day adjustment when there is no minimum timestamp", async () => {
    const { setFirstDecisionTime } = renderStep({
      firstDecisionTime: at(2026, 0, 15, 3, 5),
      minTimestamp: null,
    });

    await pickDate(at(2026, 0, 10, 0, 0));

    const emitted = new Date(lastTimestamp(setFirstDecisionTime));
    expect(emitted.getDate()).toBe(10);
    expect(emitted.getHours()).toBe(3);
    expect(emitted.getMinutes()).toBe(5);
  });

  it("constrains the time picker only while the selected day is the minimum day", () => {
    const minTimestamp = at(2026, 0, 10, 18, 30);
    const { rerender } = render(
      <DecisionsFirst
        firstDecisionTime={at(2026, 0, 10, 20, 0)}
        setFirstDecisionTime={jest.fn()}
        minTimestamp={minTimestamp}
      />
    );

    expect(screen.getByTestId("time-picker")).toHaveAttribute(
      "data-min-time",
      "18:30"
    );

    rerender(
      <DecisionsFirst
        firstDecisionTime={at(2026, 0, 11, 20, 0)}
        setFirstDecisionTime={jest.fn()}
        minTimestamp={minTimestamp}
      />
    );

    expect(screen.getByTestId("time-picker")).toHaveAttribute(
      "data-min-time",
      ""
    );
  });

  it("passes the minimum timestamp through to the calendar with no maximum", () => {
    const minTimestamp = at(2026, 0, 10, 18, 30);
    renderStep({ minTimestamp });

    const calendar = screen.getByTestId("calendar");
    expect(calendar).toHaveAttribute("data-min-timestamp", String(minTimestamp));
    expect(calendar).toHaveAttribute("data-max-timestamp", "");
  });

  it("opens the explanatory tooltip downward so it cannot push the page sideways", () => {
    renderStep();

    expect(screen.getByTestId("tooltip")).toHaveAttribute(
      "data-position",
      "bottom"
    );
  });
});
