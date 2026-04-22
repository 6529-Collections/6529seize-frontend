import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveDatesApproveStart from "@/components/waves/create-wave/dates/CreateWaveDatesApproveStart";
import type { CreateWaveDatesConfig } from "@/types/waves.types";

const mockFutureTimestamp = 2_000_000_000_000;

jest.mock("@/components/utils/calendar/CommonCalendar", () => {
  const MockCommonCalendar = (props: any) => (
    <button onClick={() => props.setSelectedTimestamp(mockFutureTimestamp)}>
      calendar
    </button>
  );
  MockCommonCalendar.displayName = "MockCommonCalendar";
  return MockCommonCalendar;
});

jest.mock("@/components/common/DateAccordion", () => {
  const MockDateAccordion = (props: any) => (
    <div>
      <div onClick={() => props.onToggle()}>{props.title}</div>
      {props.isExpanded ? props.children : props.collapsedContent}
    </div>
  );
  MockDateAccordion.displayName = "MockDateAccordion";
  return MockDateAccordion;
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
  it("updates submission and voting start together", () => {
    const setDates = jest.fn();
    render(
      <CreateWaveDatesApproveStart
        dates={baseDates}
        setDates={setDates}
        isExpanded={true}
        setIsExpanded={() => {}}
      />
    );

    fireEvent.click(screen.getByText("calendar"));
    expect(setDates).toHaveBeenCalledWith({
      ...baseDates,
      submissionStartDate: mockFutureTimestamp,
      votingStartDate: mockFutureTimestamp,
    });
  });
});
