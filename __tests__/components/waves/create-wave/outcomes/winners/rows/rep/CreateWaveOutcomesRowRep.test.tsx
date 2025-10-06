import { render, screen } from '@testing-library/react';
import CreateWaveOutcomesRowRep from '@/components/waves/create-wave/outcomes/winners/rows/rep/CreateWaveOutcomesRowRep';
import { ApiWaveType } from '@/generated/models/ApiWaveType';

jest.mock('@/components/waves/create-wave/outcomes/winners/rows/rep/CreateWaveOutcomesRowRepApprove', () => ({
  __esModule: true,
  default: () => <div data-testid="approve" />,
}));

jest.mock('@/components/waves/create-wave/outcomes/winners/rows/rep/CreateWaveOutcomesRowRepRank', () => ({
  __esModule: true,
  default: () => <div data-testid="rank" />,
}));

describe('CreateWaveOutcomesRowRep', () => {
  const outcome = {} as any;
  const removeOutcome = jest.fn();
  it('renders approve component for approve wave', () => {
    render(<CreateWaveOutcomesRowRep waveType={ApiWaveType.Approve} outcome={outcome} removeOutcome={removeOutcome} />);
    expect(screen.getByTestId('approve')).toBeInTheDocument();
  });

  it('renders rank component for rank wave', () => {
    render(<CreateWaveOutcomesRowRep waveType={ApiWaveType.Rank} outcome={outcome} removeOutcome={removeOutcome} />);
    expect(screen.getByTestId('rank')).toBeInTheDocument();
  });
});
