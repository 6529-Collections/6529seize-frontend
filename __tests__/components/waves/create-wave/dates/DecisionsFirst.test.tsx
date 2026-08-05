import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DecisionsFirst from "@/components/waves/create-wave/dates/DecisionsFirst";

jest.mock("@/components/utils/calendar/CommonCalendar", () => (props: any) => (
  <button onClick={() => props.setSelectedTimestamp(1000)}>calendar</button>
));

jest.mock("@/components/common/TimePicker", () => (props: any) => (
  <button onClick={() => props.onTimeChange(1, 30)}>time</button>
));

jest.mock("@/components/common/TooltipIconButton", () => () => <div />);

describe("DecisionsFirst", () => {
  it("updates date when calendar clicked", async () => {
    const user = userEvent.setup();
    const setFirstDecisionTime = jest.fn();
    render(
      <DecisionsFirst
        firstDecisionTime={0}
        setFirstDecisionTime={setFirstDecisionTime}
        minTimestamp={null}
      />
    );
    await user.click(screen.getByText("calendar"));
    expect(setFirstDecisionTime).toHaveBeenCalledWith(expect.any(Number));
  });

  it("updates time when time picker used", async () => {
    const user = userEvent.setup();
    const setFirstDecisionTime = jest.fn();
    render(
      <DecisionsFirst
        firstDecisionTime={0}
        setFirstDecisionTime={setFirstDecisionTime}
        minTimestamp={null}
      />
    );
    await user.click(screen.getByText("time"));
    expect(setFirstDecisionTime).toHaveBeenCalledWith(expect.any(Number));
  });

  it("does not seed a default on mount (the config/date layer owns that)", async () => {
    const setFirstDecisionTime = jest.fn();
    const minTs = new Date("2023-01-01T12:00:00Z").getTime();
    render(
      <DecisionsFirst
        firstDecisionTime={0}
        setFirstDecisionTime={setFirstDecisionTime}
        minTimestamp={minTs}
      />
    );
    // The safe one-week-out default now lives in getDefaultFirstDecisionTime,
    // applied at config init and in the date-commit path — this step no longer
    // pushes a default back up to its parent via an effect.
    await screen.findByText("calendar"); // wait for render
    expect(setFirstDecisionTime).not.toHaveBeenCalled();
  });
});
