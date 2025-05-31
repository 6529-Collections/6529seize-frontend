import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveApprovalThresholdTime from '../../../../../components/waves/create-wave/approval/CreateWaveApprovalThresholdTime';
import { Period } from '../../../../../helpers/Types';

jest.mock('../../../../../components/waves/create-wave/dates/end-date/CreateWaveDatesEndDateSelectPeriod', () => ({
  __esModule: true,
  default: (props: any) => (
    <button onClick={() => props.onPeriodSelect(Period.HOURS)}>select-period</button>
  ),
}));

describe('CreateWaveApprovalThresholdTime', () => {
  it('calculates milliseconds when time and period set', async () => {
    const setThresholdTimeMs = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveApprovalThresholdTime
        thresholdTimeMs={null}
        thresholdTimeError={false}
        thresholdDurationError={false}
        setThresholdTimeMs={setThresholdTimeMs}
      />
    );
    await user.type(screen.getByLabelText('Set time'), '2');
    await user.click(screen.getByText('select-period'));
    const twoHoursMs = 2 * 60 * 60 * 1000;
    expect(setThresholdTimeMs).toHaveBeenLastCalledWith(twoHoursMs);
  });

  it('shows error message when time missing', () => {
    render(
      <CreateWaveApprovalThresholdTime
        thresholdTimeMs={null}
        thresholdTimeError={true}
        thresholdDurationError={false}
        setThresholdTimeMs={jest.fn()}
      />
    );
    expect(screen.getByText('Please set time')).toBeInTheDocument();
  });
});
