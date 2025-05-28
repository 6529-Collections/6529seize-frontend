import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesCICApprove from '../../../../../../components/waves/create-wave/outcomes/cic/CreateWaveOutcomesCICApprove';
import { ApiWaveType } from '../../../../../../generated/models/ApiWaveType';

describe('CreateWaveOutcomesCICApprove', () => {
  it('shows error when credit not provided', async () => {
    const onOutcome = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveOutcomesCICApprove
        waveType={ApiWaveType.Approve}
        dates={{} as any}
        onOutcome={onOutcome}
        onCancel={() => {}}
      />
    );
    await user.click(screen.getByText('Save'));
    expect(onOutcome).not.toHaveBeenCalled();
    expect(screen.getByText('NIC must be a positive number')).toBeInTheDocument();
  });

  it('submits valid outcome', async () => {
    const onOutcome = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveOutcomesCICApprove
        waveType={ApiWaveType.Approve}
        dates={{} as any}
        onOutcome={onOutcome}
        onCancel={() => {}}
      />
    );
    await user.type(screen.getByLabelText('NIC'), '10');
    await user.type(screen.getByLabelText('Max Winners'), '2');
    await user.click(screen.getByText('Save'));
    expect(onOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ credit: 10, maxWinners: 2 })
    );
  });
});
