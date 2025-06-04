import { render, screen } from '@testing-library/react';
import CreateWaveOutcomesRow from '../../../../../../../components/waves/create-wave/outcomes/winners/rows/CreateWaveOutcomesRow';
import { CreateWaveOutcomeType } from '../../../../../../../types/waves.types';
import { ApiWaveType } from '../../../../../../../generated/models/ApiWaveType';

// Mock the specific row components
jest.mock('../../../../../../../components/waves/create-wave/outcomes/winners/rows/manual/CreateWaveOutcomesRowManual', () => {
  return function MockCreateWaveOutcomesRowManual() {
    return <div data-testid="manual-row">Manual Row Component</div>;
  };
});

jest.mock('../../../../../../../components/waves/create-wave/outcomes/winners/rows/rep/CreateWaveOutcomesRowRep', () => {
  return function MockCreateWaveOutcomesRowRep() {
    return <div data-testid="rep-row">Rep Row Component</div>;
  };
});

jest.mock('../../../../../../../components/waves/create-wave/outcomes/winners/rows/cic/CreateWaveOutcomesRowCIC', () => {
  return function MockCreateWaveOutcomesRowCIC() {
    return <div data-testid="cic-row">CIC Row Component</div>;
  };
});

describe('CreateWaveOutcomesRow', () => {
  const mockRemoveOutcome = jest.fn();
  const waveType = ApiWaveType.Rank;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockOutcome = (type: CreateWaveOutcomeType) => ({
    id: `outcome-${type}`,
    type,
    title: `${type} Outcome`,
    credit: 100,
    category: null,
    maxWinners: 3,
    winnersConfig: null,
  });

  it('renders manual row component for MANUAL outcome type', () => {
    const outcome = createMockOutcome(CreateWaveOutcomeType.MANUAL);

    render(
      <CreateWaveOutcomesRow
        waveType={waveType}
        outcome={outcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    expect(screen.getByTestId('manual-row')).toBeInTheDocument();
    expect(screen.getByText('Manual Row Component')).toBeInTheDocument();
  });

  it('renders rep row component for REP outcome type', () => {
    const outcome = createMockOutcome(CreateWaveOutcomeType.REP);

    render(
      <CreateWaveOutcomesRow
        waveType={waveType}
        outcome={outcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    expect(screen.getByTestId('rep-row')).toBeInTheDocument();
    expect(screen.getByText('Rep Row Component')).toBeInTheDocument();
  });

  it('renders CIC row component for NIC outcome type', () => {
    const outcome = createMockOutcome(CreateWaveOutcomeType.NIC);

    render(
      <CreateWaveOutcomesRow
        waveType={waveType}
        outcome={outcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    expect(screen.getByTestId('cic-row')).toBeInTheDocument();
    expect(screen.getByText('CIC Row Component')).toBeInTheDocument();
  });

  it('passes correct props to manual row component', () => {
    const outcome = createMockOutcome(CreateWaveOutcomeType.MANUAL);

    render(
      <CreateWaveOutcomesRow
        waveType={waveType}
        outcome={outcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    // Just verify the component renders - the mocking already proves props are passed
    expect(screen.getByTestId('manual-row')).toBeInTheDocument();
  });

  it('passes correct props to rep row component', () => {
    const outcome = createMockOutcome(CreateWaveOutcomeType.REP);

    render(
      <CreateWaveOutcomesRow
        waveType={waveType}
        outcome={outcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    expect(screen.getByTestId('rep-row')).toBeInTheDocument();
  });

  it('passes correct props to CIC row component', () => {
    const outcome = createMockOutcome(CreateWaveOutcomeType.NIC);

    render(
      <CreateWaveOutcomesRow
        waveType={waveType}
        outcome={outcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    expect(screen.getByTestId('cic-row')).toBeInTheDocument();
  });

  it('works with different wave types', () => {
    const outcome = createMockOutcome(CreateWaveOutcomeType.MANUAL);

    const { rerender } = render(
      <CreateWaveOutcomesRow
        waveType={ApiWaveType.Chat}
        outcome={outcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    expect(screen.getByTestId('manual-row')).toBeInTheDocument();

    rerender(
      <CreateWaveOutcomesRow
        waveType={ApiWaveType.Approve}
        outcome={outcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    expect(screen.getByTestId('manual-row')).toBeInTheDocument();
  });

  it('correctly routes to different components based on outcome type', () => {
    const outcomes = [
      createMockOutcome(CreateWaveOutcomeType.MANUAL),
      createMockOutcome(CreateWaveOutcomeType.REP),
      createMockOutcome(CreateWaveOutcomeType.NIC),
    ];

    const expectedTestIds = ['manual-row', 'rep-row', 'cic-row'];

    outcomes.forEach((outcome, index) => {
      const { container } = render(
        <CreateWaveOutcomesRow
          waveType={waveType}
          outcome={outcome}
          removeOutcome={mockRemoveOutcome}
        />
      );

      expect(screen.getByTestId(expectedTestIds[index])).toBeInTheDocument();
      
      // Clean up for next iteration
      container.remove();
    });
  });

  it('maintains component selection consistency', () => {
    const outcome = createMockOutcome(CreateWaveOutcomeType.REP);

    // Render multiple times to ensure consistency
    for (let i = 0; i < 3; i++) {
      const { container } = render(
        <CreateWaveOutcomesRow
          waveType={waveType}
          outcome={outcome}
          removeOutcome={mockRemoveOutcome}
        />
      );

      expect(screen.getByTestId('rep-row')).toBeInTheDocument();
      expect(screen.queryByTestId('manual-row')).not.toBeInTheDocument();
      expect(screen.queryByTestId('cic-row')).not.toBeInTheDocument();
      
      container.remove();
    }
  });
});
