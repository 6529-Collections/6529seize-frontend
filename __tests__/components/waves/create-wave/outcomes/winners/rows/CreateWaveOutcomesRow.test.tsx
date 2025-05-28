import { render, screen } from '@testing-library/react';
import CreateWaveOutcomesRow from '../../../../../../../components/waves/create-wave/outcomes/winners/rows/CreateWaveOutcomesRow';
import { ApiWaveType } from '../../../../../../../generated/models/ApiWaveType';
import { CreateWaveOutcomeType } from '../../../../../../../types/waves.types';

jest.mock('../../../../../../../components/waves/create-wave/outcomes/winners/rows/manual/CreateWaveOutcomesRowManual', () => () => <div data-testid="manual" />);
jest.mock('../../../../../../../components/waves/create-wave/outcomes/winners/rows/rep/CreateWaveOutcomesRowRep', () => () => <div data-testid="rep" />);
jest.mock('../../../../../../../components/waves/create-wave/outcomes/winners/rows/cic/CreateWaveOutcomesRowCIC', () => () => <div data-testid="cic" />);

describe('CreateWaveOutcomesRow', () => {
  const outcome = { type: CreateWaveOutcomeType.MANUAL } as any;
  const removeOutcome = jest.fn();

  it('renders manual component', () => {
    render(<CreateWaveOutcomesRow waveType={ApiWaveType.Rank} outcome={{ ...outcome, type: CreateWaveOutcomeType.MANUAL }} removeOutcome={removeOutcome} />);
    expect(screen.getByTestId('manual')).toBeInTheDocument();
  });

  it('renders rep component', () => {
    render(<CreateWaveOutcomesRow waveType={ApiWaveType.Rank} outcome={{ ...outcome, type: CreateWaveOutcomeType.REP }} removeOutcome={removeOutcome} />);
    expect(screen.getByTestId('rep')).toBeInTheDocument();
  });

  it('renders cic component', () => {
    render(<CreateWaveOutcomesRow waveType={ApiWaveType.Rank} outcome={{ ...outcome, type: CreateWaveOutcomeType.NIC }} removeOutcome={removeOutcome} />);
    expect(screen.getByTestId('cic')).toBeInTheDocument();
  });
});
