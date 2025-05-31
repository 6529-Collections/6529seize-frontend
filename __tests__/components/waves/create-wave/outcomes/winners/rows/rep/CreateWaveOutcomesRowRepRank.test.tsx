import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesRowRepRank from '../../../../../../../../components/waves/create-wave/outcomes/winners/rows/rep/CreateWaveOutcomesRowRepRank';

jest.mock('../../../../../../../../helpers/Helpers', () => ({
  formatLargeNumber: (n: number) => n.toString(),
}));

describe('CreateWaveOutcomesRowRepRank', () => {
  const outcome = {
    category: 'Cat',
    winnersConfig: { totalAmount: 100, winners: [{}, {}] },
  } as any;
  const removeOutcome = jest.fn();

  it('renders data and handles remove click', async () => {
    const user = userEvent.setup();
    render(
      <CreateWaveOutcomesRowRepRank outcome={outcome} removeOutcome={removeOutcome} />
    );

    expect(screen.getByText('Cat')).toBeInTheDocument();
    expect(screen.getByText('Total: 100 Rep')).toBeInTheDocument();
    expect(screen.getByText('Winners: 2')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Remove'));
    expect(removeOutcome).toHaveBeenCalled();
  });
});
