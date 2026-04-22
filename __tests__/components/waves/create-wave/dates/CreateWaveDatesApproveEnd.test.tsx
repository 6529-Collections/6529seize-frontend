import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveDatesApproveEnd from "@/components/waves/create-wave/dates/CreateWaveDatesApproveEnd";
import type { CreateWaveDatesConfig } from "@/types/waves.types";

const mockSelectedDayTimestamp = new Date("2035-05-10T00:00:00.000Z").getTime();
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
    onClick={() => props.onTimeChange(15, 30)}
  >
    time
  </button>
));

jest.mock(
  "@/components/utils/calendar/CommonCalendar",
  () => (props: any) => mockCommonCalendar(props)
);

jest.mock("@/components/common/DateAccordion", () => (props: any) => (
  <div>
    <button onClick={() => props.onToggle()}>toggle</button>
    {props.isExpanded ? props.children : props.collapsedContent}
  </div>
));

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
  });

  it("updates end date on calendar selection", async () => {
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveDatesApproveEnd
        dates={baseDates}
        setDates={setDates}
        isExpanded={true}
        setIsExpanded={() => {}}
      />
    );

    await user.click(screen.getByText("calendar"));

    const expected = new Date(mockSelectedDayTimestamp);
    const startDate = new Date(submissionStartDate);
    expected.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);

    expect(setDates).toHaveBeenCalledWith({
      ...baseDates,
      endDate: expected.getTime(),
    });
  });

  it("updates end date on time selection", async () => {
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveDatesApproveEnd
        dates={baseDates}
        setDates={setDates}
        isExpanded={true}
        setIsExpanded={() => {}}
      />
    );

    await user.click(screen.getByText("time"));

    const expected = new Date(submissionStartDate);
    expected.setHours(15, 30, 0, 0);

    expect(setDates).toHaveBeenCalledWith({
      ...baseDates,
      endDate: expected.getTime(),
    });
  });

  it("derives the selected timestamp from the latest dates props", () => {
    const updatedSubmissionStartDate = new Date(
      "2035-05-03T12:45:00.000Z"
    ).getTime();
    const { rerender } = render(
      <CreateWaveDatesApproveEnd
        dates={baseDates}
        setDates={() => {}}
        isExpanded={true}
        setIsExpanded={() => {}}
      />
    );

    expect(screen.getByTestId("calendar")).toHaveAttribute(
      "data-selected-timestamp",
      String(submissionStartDate)
    );
    expect(screen.getByTestId("time")).toHaveAttribute("data-hours", "9");
    expect(screen.getByTestId("time")).toHaveAttribute("data-minutes", "15");

    rerender(
      <CreateWaveDatesApproveEnd
        dates={{
          ...baseDates,
          submissionStartDate: updatedSubmissionStartDate,
          votingStartDate: updatedSubmissionStartDate,
        }}
        setDates={() => {}}
        isExpanded={true}
        setIsExpanded={() => {}}
      />
    );

    expect(screen.getByTestId("calendar")).toHaveAttribute(
      "data-selected-timestamp",
      String(updatedSubmissionStartDate)
    );
    expect(screen.getByTestId("time")).toHaveAttribute("data-hours", "12");
    expect(screen.getByTestId("time")).toHaveAttribute("data-minutes", "45");
  });
});
