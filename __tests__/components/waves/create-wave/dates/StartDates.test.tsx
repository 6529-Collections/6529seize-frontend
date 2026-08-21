import StartDates from "@/components/waves/create-wave/dates/StartDates";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/components/utils/calendar/CommonCalendar", () => {
  const MockCommonCalendar = (props: any) => (
    <button onClick={() => props.setSelectedTimestamp(123)}>calendar</button>
  );
  MockCommonCalendar.displayName = "MockCommonCalendar";
  return MockCommonCalendar;
});
jest.mock("@/components/common/CollapsibleCard", () => {
  const MockCollapsibleCard = (props: any) => (
    <div>
      <div onClick={props.onToggle}>
        {props.title}
        {props.titleActions}
      </div>
      {props.isExpanded ? props.children : props.collapsedContent}
    </div>
  );
  MockCollapsibleCard.displayName = "MockCollapsibleCard";
  return MockCollapsibleCard;
});

const baseDates: CreateWaveDatesConfig = {
  submissionStartDate: Date.now(),
  votingStartDate: Date.now(),
  endDate: null,
  firstDecisionTime: 0,
  subsequentDecisions: [],
  isRolling: false,
};

describe("StartDates", () => {
  it("renders both calendars for rank waves", () => {
    const { container } = render(
      <StartDates
        waveType={ApiWaveType.Rank}
        dates={baseDates}
        setDates={jest.fn()}
        isExpanded={true}
        setIsExpanded={() => {}}
      />
    );
    // Two mocked calendar buttons, one per date (the header info tooltip that
    // used to add a third button has been removed).
    expect(container.querySelectorAll("button").length).toBe(2);
    expect(screen.getByText("Opening dates")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Submissions Open" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Voting Opens" })
    ).toBeInTheDocument();
  });

  it("calls setDates when calendar clicked", () => {
    const setDates = jest.fn();
    render(
      <StartDates
        waveType={ApiWaveType.Approve}
        dates={baseDates}
        setDates={setDates}
        isExpanded={true}
        setIsExpanded={() => {}}
      />
    );
    fireEvent.click(screen.getByText("calendar"));
    expect(setDates).toHaveBeenCalled();
  });
});
