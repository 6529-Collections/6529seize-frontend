import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveDates from '../../../../../components/waves/create-wave/dates/CreateWaveDates';
import { ApiWaveType } from '../../../../../generated/models/ApiWaveType';
import { CreateWaveDatesConfig } from '../../../../../types/waves.types';

jest.mock('../../../../../components/waves/create-wave/dates/StartDates', () => (props: any) => (
  <button data-testid="start" onClick={() => props.setDates({ ...props.dates, submissionStartDate: 50 })}>start</button>
));

jest.mock('../../../../../components/waves/create-wave/dates/Decisions', () => (props: any) => (
  <button data-testid="decisions" onClick={() => props.setIsRollingMode(true)}>decisions</button>
));

jest.mock('../../../../../components/waves/create-wave/dates/RollingEndDate', () => () => (
  <div data-testid="rolling" />
));

jest.mock('../../../../../components/waves/create-wave/services/waveDecisionService', () => ({
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
});
