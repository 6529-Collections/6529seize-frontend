import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveDatesApproveEnd from "@/components/waves/create-wave/dates/CreateWaveDatesApproveEnd";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

const getEarliestValidEndTimestamp = (timestamp: number) => {
  const nextValidMinute = new Date(timestamp);
  nextValidMinute.setSeconds(0, 0);
  nextValidMinute.setMinutes(nextValidMinute.getMinutes() + 1);
  return nextValidMinute.getTime();
};

let mockSelectedDayTimestamp = new Date("2035-05-10T00:00:00.000Z").getTime();
let mockTimeSelection = { hours: 15, minutes: 30 };
const mockCommonCalendar = jest.fn((props: any) => (
  <button
    data-testid="calendar"
    data-selected-timestamp={String(props.selectedTimestamp)}
    onClick={() => props.setSelectedTimestamp(mockSelectedDayTimestamp)}
  >
    calendar
  </button>
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
  "@/components/utils/calendar/CommonCalendar",
  () => (props: any) => mockCommonCalendar(props)
);

jest.mock(
  "@/components/common/TimePicker",
  () => (props: any) => mockTimePicker(props)
);

jest.mock("@/components/common/TooltipIconButton", () => () => <div />);

describe("CreateWaveDatesApproveEnd", () => {
  const submissionStartDate = new Date("2035-05-01T09:15:00.000Z").getTime();
  const baseDates: CreateWaveDatesConfig = {
    submissionStartDate,
    votingStartDate: submissionStartDate,
    endDate: null,
    firstDecisionTime: 0,
    subsequentDecisions: [],
    isRolling: false,
  };

  beforeEach(() => {
    mockCommonCalendar.mockClear();
    mockTimePicker.mockClear();
    mockSelectedDayTimestamp = new Date("2035-05-10T00:00:00.000Z").getTime();
    mockTimeSelection = { hours: 15, minutes: 30 };
  });

  it("updates end date on calendar selection", async () => {
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveDatesApproveEnd
        dates={baseDates}
        errors={[]}
        setDates={setDates}
      />
    );

    await user.click(screen.getByText("calendar"));

    const expected = new Date(mockSelectedDayTimestamp);
    const earliestValidEndDate = new Date(
      getEarliestValidEndTimestamp(submissionStartDate)
    );
    expected.setHours(
      earliestValidEndDate.getHours(),
      earliestValidEndDate.getMinutes(),
      0,
      0
    );

    expect(setDates).toHaveBeenCalledWith({
      ...baseDates,
      endDate: expected.getTime(),
    });
  });

  it("clamps same-day calendar selection to the next valid minute", async () => {
    mockSelectedDayTimestamp = new Date("2035-05-01T00:00:00.000Z").getTime();
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveDatesApproveEnd
        dates={baseDates}
        errors={[]}
        setDates={setDates}
      />
    );

    await user.click(screen.getByText("calendar"));

    expect(setDates).toHaveBeenCalledWith({
      ...baseDates,
      endDate: getEarliestValidEndTimestamp(submissionStartDate),
    });
  });

  it("keeps same-day calendar selection strictly after starts with seconds", async () => {
    mockSelectedDayTimestamp = new Date("2035-05-01T00:00:00.000Z").getTime();
    const submissionStartDateWithSeconds = new Date(
      "2035-05-01T09:15:45.000Z"
    ).getTime();
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveDatesApproveEnd
        dates={{
          ...baseDates,
          submissionStartDate: submissionStartDateWithSeconds,
          votingStartDate: submissionStartDateWithSeconds,
        }}
        errors={[]}
        setDates={setDates}
      />
    );

    await user.click(screen.getByText("calendar"));

    expect(setDates).toHaveBeenCalledWith({
      ...baseDates,
      submissionStartDate: submissionStartDateWithSeconds,
      votingStartDate: submissionStartDateWithSeconds,
      endDate: getEarliestValidEndTimestamp(submissionStartDateWithSeconds),
    });
  });

  it("updates end date on time selection", async () => {
    const datesWithEnd = {
      ...baseDates,
      endDate: getEarliestValidEndTimestamp(submissionStartDate),
    };
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveDatesApproveEnd
        dates={datesWithEnd}
        errors={[]}
        setDates={setDates}
      />
    );

    await user.click(screen.getByText("time"));

    const expected = new Date(
      getEarliestValidEndTimestamp(submissionStartDate)
    );
    expected.setHours(15, 30, 0, 0);

    expect(setDates).toHaveBeenCalledWith({
      ...datesWithEnd,
      endDate: expected.getTime(),
    });
  });

  it("clamps same-day time selection to the next valid minute", async () => {
    mockTimeSelection = { hours: 9, minutes: 15 };
    const submissionStartDateWithSeconds = new Date(
      "2035-05-01T09:15:45.000Z"
    ).getTime();
    const datesWithEnd = {
      ...baseDates,
      submissionStartDate: submissionStartDateWithSeconds,
      votingStartDate: submissionStartDateWithSeconds,
      endDate: getEarliestValidEndTimestamp(submissionStartDateWithSeconds),
    };
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveDatesApproveEnd
        dates={datesWithEnd}
        errors={[]}
        setDates={setDates}
      />
    );

    await user.click(screen.getByText("time"));

    expect(setDates).toHaveBeenCalledWith({
      ...datesWithEnd,
      endDate: getEarliestValidEndTimestamp(submissionStartDateWithSeconds),
    });
  });

  it("derives the displayed time from the latest dates props", () => {
    const updatedSubmissionStartDate = new Date(
      "2035-05-03T12:45:00.000Z"
    ).getTime();
    const { rerender } = render(
      <CreateWaveDatesApproveEnd
        dates={baseDates}
        errors={[]}
        setDates={() => {}}
      />
    );

    expect(screen.getByTestId("calendar")).toHaveAttribute(
      "data-selected-timestamp",
      "null"
    );
    expect(screen.getByTestId("time")).toHaveAttribute("data-hours", "12");
    expect(screen.getByTestId("time")).toHaveAttribute("data-minutes", "16");

    rerender(
      <CreateWaveDatesApproveEnd
        dates={{
          ...baseDates,
          submissionStartDate: updatedSubmissionStartDate,
          votingStartDate: updatedSubmissionStartDate,
        }}
        errors={[]}
        setDates={() => {}}
      />
    );

    expect(screen.getByTestId("calendar")).toHaveAttribute(
      "data-selected-timestamp",
      "null"
    );
    expect(screen.getByTestId("time")).toHaveAttribute("data-hours", "15");
    expect(screen.getByTestId("time")).toHaveAttribute("data-minutes", "46");
  });

  it("shows the end date controls without an end date", () => {
    render(
      <CreateWaveDatesApproveEnd
        dates={baseDates}
        errors={[]}
        setDates={() => {}}
      />
    );

    expect(screen.getByText("No end date")).toBeInTheDocument();
    expect(
      screen.getByText("Optional. Leave blank for no end date.")
    ).toBeInTheDocument();
    expect(screen.getByText("Select End Date:")).toBeInTheDocument();
    expect(screen.getByText("Select End Time:")).toBeInTheDocument();
    expect(screen.getByTestId("time")).toHaveAttribute("data-disabled", "true");
    expect(
      screen.queryByText("This must be after the wave start.")
    ).not.toBeInTheDocument();
  });

  it("does not show required end date copy", () => {
    render(
      <CreateWaveDatesApproveEnd
        dates={baseDates}
        errors={[CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED]}
        setDates={() => {}}
      />
    );

    expect(
      screen.queryByText("Choose a wave end before continuing.")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("clears a selected end date and returns to the blank state", async () => {
    const user = userEvent.setup();
    const selectedEndDate = new Date("2035-05-02T10:00:00.000Z").getTime();

    function Harness() {
      const [dates, setDates] = useState<CreateWaveDatesConfig>({
        ...baseDates,
        endDate: selectedEndDate,
      });

      return (
        <CreateWaveDatesApproveEnd
          dates={dates}
          errors={[]}
          setDates={setDates}
        />
      );
    }

    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Clear end date" }));

    expect(screen.getByText("No end date")).toBeInTheDocument();
    expect(screen.getByTestId("time")).toHaveAttribute("data-disabled", "true");
  });

  it("shows an error when end is before start", () => {
    render(
      <CreateWaveDatesApproveEnd
        dates={{
          ...baseDates,
          endDate: submissionStartDate - 1,
        }}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.END_DATE_MUST_BE_AFTER_VOTING_START_DATE,
        ]}
        setDates={() => {}}
      />
    );

    expect(
      screen.getByText("Wave end must be after wave start.")
    ).toBeInTheDocument();
  });
});
