import { render, screen } from '@testing-library/react';
import CreateWaveOutcomesRowCICRank from '../../../../../../../../components/waves/create-wave/outcomes/winners/rows/cic/CreateWaveOutcomesRowCICRank';

// Mock formatLargeNumber to ensure consistent formatting
jest.mock('../../../../../../../../helpers/Helpers', () => ({
  formatLargeNumber: jest.fn((num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }),
}));

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
