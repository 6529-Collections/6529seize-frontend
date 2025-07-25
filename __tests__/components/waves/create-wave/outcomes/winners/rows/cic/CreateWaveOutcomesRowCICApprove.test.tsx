import { render, screen } from '@testing-library/react';
import CreateWaveOutcomesRowCICApprove from '../../../../../../../../components/waves/create-wave/outcomes/winners/rows/cic/CreateWaveOutcomesRowCICApprove';

const outcome = { credit: 1000, maxWinners: 2 } as any;

describe('CreateWaveOutcomesRowCICApprove', () => {
  it('displays formatted credit and max winners', () => {
    render(<CreateWaveOutcomesRowCICApprove outcome={outcome} removeOutcome={jest.fn()} />);
    expect(screen.getByText('1K NIC')).toBeInTheDocument();
    expect(screen.getByText(/Max winners: 2/)).toBeInTheDocument();
  });

  it('renders remove button', () => {
    render(<CreateWaveOutcomesRowCICApprove outcome={outcome} removeOutcome={jest.fn()} />);
    expect(screen.getByLabelText('Remove')).toBeInTheDocument();
  });
});
