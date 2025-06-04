import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesRowCICRank from '../../../../../../../../components/waves/create-wave/outcomes/winners/rows/cic/CreateWaveOutcomesRowCICRank';

const outcome = { winnersConfig: { totalAmount: 1500, winners: [] } } as any;

describe('CreateWaveOutcomesRowCICRank', () => {
  it('displays formatted total NIC', () => {
    render(<CreateWaveOutcomesRowCICRank outcome={outcome} removeOutcome={jest.fn()} />);
    expect(screen.getByText(/1\.5K/)).toBeInTheDocument();
  });

  it('renders remove button', () => {
    render(<CreateWaveOutcomesRowCICRank outcome={outcome} removeOutcome={jest.fn()} />);
    expect(screen.getByLabelText('Remove')).toBeInTheDocument();
  });
});
