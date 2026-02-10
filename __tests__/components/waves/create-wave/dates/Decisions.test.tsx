import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Decisions from '@/components/waves/create-wave/dates/Decisions';

jest.mock('@/components/waves/create-wave/dates/DecisionsFirst', () => () => <div data-testid="first" />);
jest.mock('@/components/waves/create-wave/dates/SubsequentDecisions', () => (props: any) => (
  <button data-testid="sub" onClick={() => props.setSubsequentDecisions([1])}>add</button>
));
jest.mock('@/components/waves/create-wave/services/waveDecisionService', () => ({
  calculateDecisionTimes: jest.fn(() => [1, 2]),
  calculateEndDateForCycles: jest.fn(() => 3),
}));
jest.mock('@/components/common/DateAccordion', () => (props: any) => <div>{props.children}</div>);
jest.mock('@/components/common/TooltipIconButton', () => () => <div />);
jest.mock('@/components/utils/switch/CommonSwitch', () => (props: any) => (
  <button role="switch" onClick={() => props.setIsOn(!props.isOn)}>{String(props.isOn)}</button>
));

describe('Decisions', () => {
  const baseDates = { firstDecisionTime: 1, subsequentDecisions: [], votingStartDate: 0, isRolling: false, endDate: 0 } as any;

  it('updates decisions when subsequent decisions added', async () => {
    const user = userEvent.setup();
    const setDates = jest.fn();
    render(
      <Decisions
        dates={baseDates}
        setDates={setDates}
        isRollingMode={false}
        setIsRollingMode={jest.fn()}
        isExpanded={true}
        setIsExpanded={jest.fn()}
        onInteraction={jest.fn()}
      />
    );
    await user.click(screen.getByTestId('sub'));
    expect(setDates).toHaveBeenCalled();
  });

  it('enables rolling mode and sets dates', async () => {
    const user = userEvent.setup();
    const setDates = jest.fn();
    const setRolling = jest.fn();
    render(
      <Decisions
        dates={{ ...baseDates, subsequentDecisions: [1] }}
        setDates={setDates}
        isRollingMode={false}
        setIsRollingMode={setRolling}
        isExpanded={true}
        setIsExpanded={jest.fn()}
        onInteraction={jest.fn()}
      />
    );
    await user.click(screen.getByRole('switch'));
    expect(setRolling).toHaveBeenCalledWith(true);
    expect(setDates).toHaveBeenCalledWith(expect.objectContaining({ isRolling: true }));
  });
});
