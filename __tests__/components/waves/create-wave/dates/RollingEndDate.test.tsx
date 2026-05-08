import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RollingEndDate from "@/components/waves/create-wave/dates/RollingEndDate";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import type { CreateWaveDatesConfig } from "@/types/waves.types";

let mockCalendarSelectionTimestamp = new Date(
  "2035-05-10T00:00:00.000Z"
).getTime();
let mockTimeSelection = { hours: 1, minutes: 2 };

const mockCommonCalendar = jest.fn((props: any) => (
  <button
    data-testid="calendar"
    data-selected-timestamp={String(props.selectedTimestamp)}
    onClick={() => props.setSelectedTimestamp(mockCalendarSelectionTimestamp)}
  >
    calendar
  </button>
));

jest.mock(
  "@/components/utils/calendar/CommonCalendar",
  () => (props: any) => mockCommonCalendar(props)
);

jest.mock("@/components/common/DateAccordion", () => (props: any) => (
  <div data-testid="accordion" data-expanded={String(props.isExpanded)}>
    <button onClick={props.onToggle}>toggle</button>
    {props.isExpanded && props.children}
    {props.collapsedContent}
  </div>
));

const mockTimePicker = jest.fn((props: any) => (
  <button
    data-testid="time"
    data-hours={String(props.hours)}
    data-minutes={String(props.minutes)}
    data-disabled={String(props.disabled)}
    onClick={() =>
      props.onTimeChange(mockTimeSelection.hours, mockTimeSelection.minutes)
    }
  >
    time
  </button>
));

jest.mock(
  "@/components/common/TimePicker",
  () => (props: any) => mockTimePicker(props)
);

jest.mock("@/helpers/waves/create-wave.helpers", () => ({
  calculateLastDecisionTime: () => 1234,
}));

jest.mock("@/components/waves/create-wave/services/waveDecisionService", () => {
  const actual = jest.requireActual(
    "@/components/waves/create-wave/services/waveDecisionService"
  );

  return {
    ...actual,
    countTotalDecisions: jest.fn(() => 1),
    formatDate: (n: number) => `date-${n}`,
  };
});

describe("RollingEndDate", () => {
  const selectedEndDate = new Date("2035-05-05T14:45:00.000Z").getTime();
  const firstDecisionTime = new Date("2035-05-01T08:30:00.000Z").getTime();
  const baseConfig: CreateWaveDatesConfig = {
    submissionStartDate: 0,
    votingStartDate: 0,
    endDate: selectedEndDate,
    firstDecisionTime,
    subsequentDecisions: [],
    isRolling: true,
  };

  beforeEach(() => {
    mockCommonCalendar.mockClear();
    mockTimePicker.mockClear();
    mockCalendarSelectionTimestamp = new Date(
      "2035-05-10T00:00:00.000Z"
    ).getTime();
    mockTimeSelection = { hours: 1, minutes: 2 };
  });

  it("updates date on calendar selection and preserves displayed time", async () => {
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <RollingEndDate
        dates={baseConfig}
        errors={[]}
        setDates={setDates}
        isExpanded
        setIsExpanded={() => {}}
      />
    );
    await user.click(screen.getByText("calendar"));

    const expected = new Date(mockCalendarSelectionTimestamp);
    const displayedDate = new Date(selectedEndDate);
    expected.setHours(
      displayedDate.getHours(),
      displayedDate.getMinutes(),
      0,
      0
    );

    expect(setDates).toHaveBeenCalledWith({
      ...baseConfig,
      endDate: expected.getTime(),
    });
  });

  it("shows no end date when blank", () => {
    render(
      <RollingEndDate
        dates={{ ...baseConfig, endDate: null }}
        errors={[]}
        setDates={jest.fn()}
        isExpanded
        setIsExpanded={() => {}}
      />
    );

    expect(screen.getAllByText("No end date")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Clear end date" })).toBeNull();
    expect(screen.getByTestId("time")).toHaveAttribute("data-disabled", "true");
  });

  it("passes selected end date time to the time picker", () => {
    render(
      <RollingEndDate
        dates={baseConfig}
        errors={[]}
        setDates={jest.fn()}
        isExpanded
        setIsExpanded={() => {}}
      />
    );

    const displayedDate = new Date(selectedEndDate);
    expect(screen.getByTestId("time")).toHaveAttribute(
      "data-hours",
      String(displayedDate.getHours())
    );
    expect(screen.getByTestId("time")).toHaveAttribute(
      "data-minutes",
      String(displayedDate.getMinutes())
    );
    expect(screen.getByTestId("time")).toHaveAttribute(
      "data-disabled",
      "false"
    );
  });

  it("updates time picker hours and minutes when the end date prop changes", () => {
    const { rerender } = render(
      <RollingEndDate
        dates={baseConfig}
        errors={[]}
        setDates={jest.fn()}
        isExpanded
        setIsExpanded={() => {}}
      />
    );

    const updatedEndDate = new Date("2035-05-06T07:05:00.000Z").getTime();
    rerender(
      <RollingEndDate
        dates={{ ...baseConfig, endDate: updatedEndDate }}
        errors={[]}
        setDates={jest.fn()}
        isExpanded
        setIsExpanded={() => {}}
      />
    );

    const displayedDate = new Date(updatedEndDate);
    expect(screen.getByTestId("time")).toHaveAttribute(
      "data-hours",
      String(displayedDate.getHours())
    );
    expect(screen.getByTestId("time")).toHaveAttribute(
      "data-minutes",
      String(displayedDate.getMinutes())
    );
  });

  it("clears a selected end date", async () => {
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <RollingEndDate
        dates={baseConfig}
        errors={[]}
        setDates={setDates}
        isExpanded
        setIsExpanded={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "Clear end date" }));
    expect(setDates).toHaveBeenCalledWith({
      ...baseConfig,
      endDate: null,
    });
  });

  it("updates time when time picker changes", async () => {
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <RollingEndDate
        dates={baseConfig}
        errors={[]}
        setDates={setDates}
        isExpanded
        setIsExpanded={() => {}}
      />
    );
    await user.click(screen.getByText("time"));

    const expected = new Date(selectedEndDate);
    expected.setHours(mockTimeSelection.hours, mockTimeSelection.minutes, 0, 0);
    expect(setDates).toHaveBeenCalledWith({
      ...baseConfig,
      endDate: expected.getTime(),
    });
  });

  it("does not update time when no end date exists", async () => {
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <RollingEndDate
        dates={{ ...baseConfig, endDate: null }}
        errors={[]}
        setDates={setDates}
        isExpanded
        setIsExpanded={() => {}}
      />
    );

    await user.click(screen.getByText("time"));
    expect(setDates).not.toHaveBeenCalled();
  });

  it("expands and shows an alert for rank future-date errors", () => {
    render(
      <RollingEndDate
        dates={baseConfig}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE,
        ]}
        setDates={jest.fn()}
        isExpanded={false}
        setIsExpanded={() => {}}
      />
    );

    expect(screen.getByTestId("accordion")).toHaveAttribute(
      "data-expanded",
      "true"
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Wave end date must be in the future."
    );
  });
});
