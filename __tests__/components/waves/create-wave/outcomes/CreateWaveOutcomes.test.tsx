import { render, screen } from '@testing-library/react';
import CreateWaveOutcomes from '../../../../../components/waves/create-wave/outcomes/CreateWaveOutcomes';
import { CreateWaveOutcomeType } from '../../../../../types/waves.types';
import { ApiWaveType } from '../../../../../generated/models/ApiWaveType';

jest.mock('../../../../../components/waves/create-wave/outcomes/CreateWaveOutcomeTypes', () => ({
  __esModule: true,
  default: () => <div data-testid="types" />,
}));

jest.mock('../../../../../components/waves/create-wave/outcomes/manual/CreateWaveOutcomesManual', () => ({
  __esModule: true,
  default: () => <div data-testid="manual" />,
}));

jest.mock('../../../../../components/waves/create-wave/outcomes/rep/CreateWaveOutcomesRep', () => ({
  __esModule: true,
  default: () => <div data-testid="rep" />,
}));

jest.mock('../../../../../components/waves/create-wave/outcomes/cic/CreateWaveOutcomesCIC', () => ({
  __esModule: true,
  default: () => <div data-testid="cic" />,
}));

jest.mock('../../../../../components/waves/create-wave/outcomes/winners/rows/CreateWaveOutcomesRows', () => ({
  __esModule: true,
  default: () => <div data-testid="rows" />,
}));

jest.mock('../../../../../components/utils/animation/CommonAnimationHeight', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

describe('CreateWaveOutcomes', () => {
  const baseProps = {
    outcomes: [],
    outcomeType: null as CreateWaveOutcomeType | null,
    waveType: ApiWaveType.Approve,
    errors: [],
    dates: {} as any,
    setOutcomeType: jest.fn(),
    setOutcomes: jest.fn(),
  };

  it('shows rows list when no outcome type selected', () => {
    render(<CreateWaveOutcomes {...baseProps} />);
    expect(screen.getByTestId('rows')).toBeInTheDocument();
  });

  it('renders manual component when selected', () => {
    render(<CreateWaveOutcomes {...baseProps} outcomeType={CreateWaveOutcomeType.MANUAL} />);
    expect(screen.getByTestId('manual')).toBeInTheDocument();
  });
});
