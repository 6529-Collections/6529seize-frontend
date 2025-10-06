import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DecisionsFirst from '@/components/waves/create-wave/dates/DecisionsFirst';

jest.mock('@/components/utils/calendar/CommonCalendar', () => (props: any) => (
  <button onClick={() => props.setSelectedTimestamp(1000)}>calendar</button>
));

jest.mock('@/components/common/TimePicker', () => (props: any) => (
  <button onClick={() => props.onTimeChange(1, 30)}>time</button>
));

jest.mock('@/components/common/TooltipIconButton', () => () => <div />);

describe('DecisionsFirst', () => {
  it('updates date when calendar clicked', async () => {
    const user = userEvent.setup();
    const setFirstDecisionTime = jest.fn();
    render(
      <DecisionsFirst firstDecisionTime={0} setFirstDecisionTime={setFirstDecisionTime} minTimestamp={null} />
    );
    await user.click(screen.getByText('calendar'));
    expect(setFirstDecisionTime).toHaveBeenCalledWith(expect.any(Number));
  });

  it('updates time when time picker used', async () => {
    const user = userEvent.setup();
    const setFirstDecisionTime = jest.fn();
    render(
      <DecisionsFirst firstDecisionTime={0} setFirstDecisionTime={setFirstDecisionTime} minTimestamp={null} />
    );
    await user.click(screen.getByText('time'));
    expect(setFirstDecisionTime).toHaveBeenCalledWith(expect.any(Number));
  });

  it('initializes to end of day when minTimestamp provided', async () => {
    const user = userEvent.setup();
    const setFirstDecisionTime = jest.fn();
    const minTs = new Date('2023-01-01T12:00:00Z').getTime();
    render(
      <DecisionsFirst firstDecisionTime={0} setFirstDecisionTime={setFirstDecisionTime} minTimestamp={minTs} />
    );
    const expected = new Date(minTs);
    expected.setHours(23, 59, 0, 0);
    await screen.findByText('calendar'); // wait for render
    expect(setFirstDecisionTime).toHaveBeenCalledWith(expected.getTime());
  });
});
