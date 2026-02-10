import { render, screen } from '@testing-library/react';
import CreateWaveOutcomesRowCIC from '@/components/waves/create-wave/outcomes/winners/rows/cic/CreateWaveOutcomesRowCIC';
import { ApiWaveType } from '@/generated/models/ApiWaveType';

jest.mock('@/components/waves/create-wave/outcomes/winners/rows/cic/CreateWaveOutcomesRowCICApprove', () => () => <div data-testid="approve" />);
jest.mock('@/components/waves/create-wave/outcomes/winners/rows/cic/CreateWaveOutcomesRowCICRank', () => () => <div data-testid="rank" />);

describe('CreateWaveOutcomesRowCIC', () => {
  const baseProps = { outcome: {} as any, removeOutcome: jest.fn() };

  it('renders approve component for approve wave type', () => {
    render(<CreateWaveOutcomesRowCIC {...baseProps} waveType={ApiWaveType.Approve} />);
    expect(screen.getByTestId('approve')).toBeInTheDocument();
  });

  it('renders rank component for rank wave type', () => {
    render(<CreateWaveOutcomesRowCIC {...baseProps} waveType={ApiWaveType.Rank} />);
    expect(screen.getByTestId('rank')).toBeInTheDocument();
  });
});
