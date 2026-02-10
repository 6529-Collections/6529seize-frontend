import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RollingEndDate from '@/components/waves/create-wave/dates/RollingEndDate';

jest.mock('@/components/utils/calendar/CommonCalendar', () => (props: any) => (
  <button onClick={() => props.setSelectedTimestamp(1000)}>calendar</button>
));

type Config = {
  submissionStartDate: number;
  votingStartDate: number;
  endDate: number | null;
  firstDecisionTime: number;
  subsequentDecisions: number[];
  isRolling: boolean;
};

jest.mock('@/components/common/DateAccordion', () => (props: any) => (
  <div>
    <button onClick={props.onToggle}>toggle</button>
    {props.isExpanded && props.children}
    {props.collapsedContent}
  </div>
));

jest.mock('@/components/common/TimePicker', () => (props: any) => (
  <button onClick={() => props.onTimeChange(1, 2)}>time</button>
));

jest.mock('@/helpers/waves/create-wave.helpers', () => ({
  calculateLastDecisionTime: () => 1234,
}));

jest.mock('@/components/waves/create-wave/services/waveDecisionService', () => ({
  calculateDecisionTimes: jest.fn(() => []),
  countTotalDecisions: jest.fn(() => 1),
  formatDate: (n: number) => `date-${n}`,
}));

describe('RollingEndDate', () => {
  const baseConfig: Config = {
    submissionStartDate: 0,
    votingStartDate: 0,
    endDate: Date.now(),
    firstDecisionTime: 0,
    subsequentDecisions: [],
    isRolling: true,
  };

  it('updates date on calendar selection', async () => {
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <RollingEndDate
        dates={baseConfig}
        setDates={setDates}
        isRollingMode
        setIsRollingMode={() => {}}
        isExpanded
        setIsExpanded={() => {}}
      />
    );
    await user.click(screen.getByText('calendar'));
    expect(setDates).toHaveBeenCalled();
  });

  it('updates time when time picker changes', async () => {
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <RollingEndDate
        dates={baseConfig}
        setDates={setDates}
        isRollingMode
        setIsRollingMode={() => {}}
        isExpanded
        setIsExpanded={() => {}}
      />
    );
    await user.click(screen.getByText('time'));
    expect(setDates).toHaveBeenCalled();
  });
});
