import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesRowManualApprove from '@/components/waves/create-wave/outcomes/winners/rows/manual/CreateWaveOutcomesRowManualApprove';
import { CreateWaveOutcomeConfig } from '@/types/waves.types';


jest.mock('@/helpers/Helpers', () => ({
  formatLargeNumber: (n: number) => `formatted-${n}`,
}));

describe('CreateWaveOutcomesRowManualApprove', () => {
  const outcome: CreateWaveOutcomeConfig = {
    type: 0 as any,
    title: 'Winner',
    credit: null,
    category: null,
    maxWinners: 3,
    winnersConfig: null,
  };

  it('displays formatted max winners and title', () => {
    render(<CreateWaveOutcomesRowManualApprove outcome={outcome} removeOutcome={jest.fn()} />);
    expect(screen.getByText('Max winners: formatted-3')).toBeInTheDocument();
    expect(screen.getByText('Winner')).toBeInTheDocument();
  });

  it('calls removeOutcome on button click', async () => {
    const user = userEvent.setup();
    const remove = jest.fn();
    render(<CreateWaveOutcomesRowManualApprove outcome={outcome} removeOutcome={remove} />);
    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(remove).toHaveBeenCalled();
  });
});
