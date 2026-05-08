import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Decisions from "@/components/waves/create-wave/dates/Decisions";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

jest.mock("@/components/waves/create-wave/dates/DecisionsFirst", () => () => (
  <div data-testid="first" />
));
jest.mock(
  "@/components/waves/create-wave/dates/SubsequentDecisions",
  () => (props: any) => (
    <button data-testid="sub" onClick={() => props.setSubsequentDecisions([1])}>
      add
    </button>
  )
);
jest.mock("@/components/waves/create-wave/services/waveDecisionService", () => {
  const actual = jest.requireActual(
    "@/components/waves/create-wave/services/waveDecisionService"
  );

  return {
    ...actual,
    calculateDecisionTimes: jest.fn(() => [1, 2]),
    calculateEndDateForCycles: jest.fn(() => 3),
  };
});
jest.mock("@/components/common/DateAccordion", () => (props: any) => (
  <div data-testid="accordion" data-expanded={String(props.isExpanded)}>
    {props.isExpanded ? props.children : props.collapsedContent}
  </div>
));
jest.mock("@/components/common/TooltipIconButton", () => () => <div />);
jest.mock("@/components/utils/switch/CommonSwitch", () => (props: any) => (
  <button role="switch" onClick={() => props.setIsOn(!props.isOn)}>
    {String(props.isOn)}
  </button>
));

describe("Decisions", () => {
  const baseDates = {
    firstDecisionTime: 1,
    subsequentDecisions: [],
    votingStartDate: 0,
    isRolling: false,
    endDate: 0,
  } as any;

  it("updates decisions when subsequent decisions added", async () => {
    const user = userEvent.setup();
    const setDates = jest.fn();
    render(
      <Decisions
        dates={baseDates}
        errors={[]}
        setDates={setDates}
        onRollingEnabled={jest.fn()}
        isExpanded={true}
        setIsExpanded={jest.fn()}
        onInteraction={jest.fn()}
      />
    );
    await user.click(screen.getByTestId("sub"));
    expect(setDates).toHaveBeenCalledWith({
      ...baseDates,
      subsequentDecisions: [1],
    });
  });

  it("enables rolling mode and sets dates", async () => {
    const user = userEvent.setup();
    const setDates = jest.fn();
    const onRollingEnabled = jest.fn();
    render(
      <Decisions
        dates={{ ...baseDates, subsequentDecisions: [1] }}
        errors={[]}
        setDates={setDates}
        onRollingEnabled={onRollingEnabled}
        isExpanded={true}
        setIsExpanded={jest.fn()}
        onInteraction={jest.fn()}
      />
    );
    await user.click(screen.getByRole("switch"));
    expect(onRollingEnabled).toHaveBeenCalled();
    expect(setDates).toHaveBeenCalledWith(
      expect.objectContaining({ isRolling: true, endDate: null })
    );
  });

  it("shows a future-date alert when rank dates are not in the future", () => {
    render(
      <Decisions
        dates={baseDates}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE,
        ]}
        setDates={jest.fn()}
        onRollingEnabled={jest.fn()}
        isExpanded={false}
        setIsExpanded={jest.fn()}
        onInteraction={jest.fn()}
      />
    );

    expect(screen.getByTestId("accordion")).toHaveAttribute(
      "data-expanded",
      "true"
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "First winners announcement and wave end must be in the future."
    );
  });
});
