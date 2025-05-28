import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesRowRepApprove from '../../../../../../../../components/waves/create-wave/outcomes/winners/rows/rep/CreateWaveOutcomesRowRepApprove';

jest.mock('../../../../../../../../helpers/Helpers', () => ({
  formatLargeNumber: (n: number) => n.toString(),
}));

describe('CreateWaveOutcomesRowRepApprove', () => {
  const outcome = {
    category: 'Cat',
    credit: 10,
    maxWinners: 2,
  } as any;
  const removeOutcome = jest.fn();

  it('displays outcome data and handles remove', async () => {
    const user = userEvent.setup();
    render(
      <CreateWaveOutcomesRowRepApprove outcome={outcome} removeOutcome={removeOutcome} />
    );

    expect(screen.getByText('Cat')).toBeInTheDocument();
    expect(screen.getByText('10 Rep')).toBeInTheDocument();
    expect(screen.getByText('Max winners: 2')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Remove'));
    expect(removeOutcome).toHaveBeenCalled();
  });
});
