import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveDatesApproveStart from "@/components/waves/create-wave/dates/CreateWaveDatesApproveStart";
import type { CreateWaveDatesConfig } from "@/types/waves.types";

let mockSelectedTimestamp = new Date("2035-05-03T09:15:00.000Z").getTime();

const getEarliestValidEndTimestamp = (timestamp: number) => {
  const nextValidMinute = new Date(timestamp);
  nextValidMinute.setSeconds(0, 0);
  nextValidMinute.setMinutes(nextValidMinute.getMinutes() + 1);
  return nextValidMinute.getTime();
};

jest.mock("@/components/utils/calendar/CommonCalendar", () => {
  const MockCommonCalendar = (props: any) => (
    <button onClick={() => props.setSelectedTimestamp(mockSelectedTimestamp)}>
      calendar
    </button>
  );
  MockCommonCalendar.displayName = "MockCommonCalendar";
  return MockCommonCalendar;
});

jest.mock("@/components/common/TooltipIconButton", () => () => <div />);

const baseDates: CreateWaveDatesConfig = {
  submissionStartDate: 10,
  votingStartDate: 10,
  endDate: null,
  firstDecisionTime: 0,
  subsequentDecisions: [],
  isRolling: false,
};

describe("CreateWaveDatesApproveStart", () => {
  beforeEach(() => {
    mockSelectedTimestamp = new Date("2035-05-03T09:15:00.000Z").getTime();
  });

  it("updates submission and voting start together", () => {
    const setDates = jest.fn();
    render(
      <CreateWaveDatesApproveStart dates={baseDates} setDates={setDates} />
    );

    fireEvent.click(screen.getByText("calendar"));
    expect(setDates).toHaveBeenCalledWith({
      ...baseDates,
      submissionStartDate: mockSelectedTimestamp,
      votingStartDate: mockSelectedTimestamp,
    });
  });

  it("moves a selected end date forward when start passes it", () => {
    const previousEndDate = new Date("2035-05-02T10:00:00.000Z").getTime();
    const setDates = jest.fn();
    render(
      <CreateWaveDatesApproveStart
        dates={{
          ...baseDates,
          endDate: previousEndDate,
        }}
        setDates={setDates}
      />
    );

    fireEvent.click(screen.getByText("calendar"));

    expect(setDates).toHaveBeenCalledWith({
      ...baseDates,
      submissionStartDate: mockSelectedTimestamp,
      votingStartDate: mockSelectedTimestamp,
      endDate: getEarliestValidEndTimestamp(mockSelectedTimestamp),
    });
  });
});
