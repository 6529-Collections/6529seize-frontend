import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveDates from '@/components/waves/create-wave/dates/CreateWaveDates';
import { ApiWaveType } from '@/generated/models/ApiWaveType';
import { CreateWaveDatesConfig } from '@/types/waves.types';

jest.mock('@/components/waves/create-wave/dates/StartDates', () => (props: any) => (
  <button
    data-testid="start"
    data-expanded={props.isExpanded}
    onClick={() => {
      props.setIsExpanded();
      props.setDates({ ...props.dates, submissionStartDate: 50 });
    }}
  >start</button>
));

jest.mock('@/components/waves/create-wave/dates/Decisions', () => (props: any) => (
  <button
    data-testid="decisions"
    data-expanded={props.isExpanded}
    onClick={() => {
      props.onInteraction();
    }}
  >decisions</button>
));

jest.mock('@/components/waves/create-wave/dates/RollingEndDate', () => () => (
  <div data-testid="rolling" />
));

jest.mock('@/components/waves/create-wave/services/waveDecisionService', () => ({
  adjustDatesAfterSubmissionChange: jest.fn((d, ts) => ({ ...d, submissionStartDate: ts })),
  calculateEndDate: jest.fn(() => 123),
  validateDateSequence: jest.fn(() => []),
}));

const baseDates: CreateWaveDatesConfig = {
  submissionStartDate: 10,
  votingStartDate: 20,
  endDate: null,
  firstDecisionTime: 30,
  subsequentDecisions: [],
  isRolling: false,
};

describe('CreateWaveDates', () => {
  it('adjusts dates when submission start changes', async () => {
    const setDates = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveDates waveType={ApiWaveType.Approve} dates={baseDates} setDates={setDates} />
    );
    await user.click(screen.getByTestId('start'));
    expect(setDates).toHaveBeenCalledWith({ ...baseDates, submissionStartDate: 50 });
  });

  it('shows rolling section when rolling mode and decisions present', () => {
    const dates = { ...baseDates, isRolling: true, subsequentDecisions: [1] };
    render(
      <CreateWaveDates waveType={ApiWaveType.Approve} dates={dates} setDates={jest.fn()} />
    );
    expect(screen.getByTestId('rolling')).toBeInTheDocument();
  });

  it('hides rolling section when not rolling', () => {
    const dates = { ...baseDates, subsequentDecisions: [1], isRolling: false };
    render(
      <CreateWaveDates waveType={ApiWaveType.Approve} dates={dates} setDates={jest.fn()} />
    );
    expect(screen.queryByTestId('rolling')).toBeNull();
  });

  it('auto collapses start section after decisions interaction', async () => {
    const user = userEvent.setup();
    render(
      <CreateWaveDates waveType={ApiWaveType.Approve} dates={baseDates} setDates={jest.fn()} />
    );
    // start initially expanded
    expect(screen.getByTestId('start')).toHaveAttribute('data-expanded', 'true');
    await user.click(screen.getByTestId('decisions'));
    expect(screen.getByTestId('start')).toHaveAttribute('data-expanded', 'false');
  });

  it('updates end date when calculateEndDate differs', () => {
    const setDates = jest.fn();
    const dates = { ...baseDates, endDate: 0 };
    render(<CreateWaveDates waveType={ApiWaveType.Approve} dates={dates} setDates={setDates} />);
    expect(setDates).toHaveBeenCalledWith({ ...dates, endDate: 123 });
  });
});
