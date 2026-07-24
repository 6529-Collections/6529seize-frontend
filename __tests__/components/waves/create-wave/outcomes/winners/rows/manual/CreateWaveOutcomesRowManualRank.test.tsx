import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesRowManualRank from '@/components/waves/create-wave/outcomes/winners/rows/manual/CreateWaveOutcomesRowManualRank';

const outcome = { title: 'Winner' } as any;

describe('CreateWaveOutcomesRowManualRank', () => {
  it('shows outcome title', () => {
    render(<CreateWaveOutcomesRowManualRank outcome={outcome} removeOutcome={jest.fn()} />);
    expect(screen.getByText('Winner')).toBeInTheDocument();
  });

  it('calls removeOutcome on click', async () => {
    const user = userEvent.setup();
    const removeOutcome = jest.fn();
    render(<CreateWaveOutcomesRowManualRank outcome={outcome} removeOutcome={removeOutcome} />);
    await user.click(screen.getByLabelText('Remove'));
    expect(removeOutcome).toHaveBeenCalled();
  });
});
