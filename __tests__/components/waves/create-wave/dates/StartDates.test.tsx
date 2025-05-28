import { render, screen, fireEvent } from '@testing-library/react';
import StartDates from '../../../../../components/waves/create-wave/dates/StartDates';
import { ApiWaveType } from '../../../../../generated/models/ApiWaveType';
import { CreateWaveDatesConfig } from '../../../../../types/waves.types';

jest.mock('../../../../../components/utils/calendar/CommonCalendar', () => (props: any) => (
  <button onClick={() => props.setSelectedTimestamp(123)}>calendar</button>
));
jest.mock('../../../../../components/common/DateAccordion', () => (props: any) => (
  <div>
    <div onClick={props.onToggle}>{props.title}</div>
    {props.isExpanded ? props.children : props.collapsedContent}
  </div>
));

const baseDates: CreateWaveDatesConfig = {
  submissionStartDate: Date.now(),
  votingStartDate: Date.now(),
  endDate: null,
  firstDecisionTime: 0,
  subsequentDecisions: [],
  isRolling: false,
};

describe('StartDates', () => {
  it('renders both calendars for rank waves', () => {
    const { container } = render(
      <StartDates waveType={ApiWaveType.Rank} dates={baseDates} setDates={jest.fn()} isExpanded={true} setIsExpanded={() => {}} />
    );
    expect(container.querySelectorAll('button').length).toBe(2);
  });

  it('calls setDates when calendar clicked', () => {
    const setDates = jest.fn();
    render(
      <StartDates waveType={ApiWaveType.Approve} dates={baseDates} setDates={setDates} isExpanded={true} setIsExpanded={() => {}} />
    );
    fireEvent.click(screen.getByText('calendar'));
    expect(setDates).toHaveBeenCalled();
  });
});
