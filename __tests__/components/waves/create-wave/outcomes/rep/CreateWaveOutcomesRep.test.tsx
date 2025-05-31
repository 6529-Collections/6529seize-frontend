import { render, screen } from '@testing-library/react';
import CreateWaveOutcomesRep from '../../../../../../components/waves/create-wave/outcomes/rep/CreateWaveOutcomesRep';
import { ApiWaveType } from '../../../../../../generated/models/ApiWaveType';

jest.mock('../../../../../../components/waves/create-wave/outcomes/rep/CreateWaveOutcomesRepApprove', () => () => <div data-testid="approve" />);
jest.mock('../../../../../../components/waves/create-wave/outcomes/rep/CreateWaveOutcomesRepRank', () => () => <div data-testid="rank" />);

describe('CreateWaveOutcomesRep', () => {
  it('renders approve component when waveType is Approve', () => {
    render(
      <CreateWaveOutcomesRep
        waveType={ApiWaveType.Approve}
        dates={{} as any}
        onOutcome={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByTestId('approve')).toBeInTheDocument();
  });

  it('renders rank component when waveType is Rank', () => {
    render(
      <CreateWaveOutcomesRep
        waveType={ApiWaveType.Rank}
        dates={{} as any}
        onOutcome={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByTestId('rank')).toBeInTheDocument();
  });
});
