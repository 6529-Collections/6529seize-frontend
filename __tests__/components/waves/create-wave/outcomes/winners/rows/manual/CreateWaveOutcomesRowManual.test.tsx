import { render, screen } from '@testing-library/react';
import CreateWaveOutcomesRowManual from '@/components/waves/create-wave/outcomes/winners/rows/manual/CreateWaveOutcomesRowManual';
import { ApiWaveType } from '@/generated/models/ApiWaveType';
import { CreateWaveOutcomeConfig } from '@/types/waves.types';

jest.mock('@/components/waves/create-wave/outcomes/winners/rows/manual/CreateWaveOutcomesRowManualApprove', () => 
  function MockApprove(props: any) {
    return (
      <div 
        data-testid="manual-approve" 
        data-outcome-id={props.outcome.id}
      >
        Approve Component
        <button onClick={props.removeOutcome} data-testid="remove-approve">
          Remove
        </button>
      </div>
    );
  }
);

jest.mock('@/components/waves/create-wave/outcomes/winners/rows/manual/CreateWaveOutcomesRowManualRank', () => 
  function MockRank(props: any) {
    return (
      <div 
        data-testid="manual-rank" 
        data-outcome-id={props.outcome.id}
      >
        Rank Component
        <button onClick={props.removeOutcome} data-testid="remove-rank">
          Remove
        </button>
      </div>
    );
  }
);

describe('CreateWaveOutcomesRowManual', () => {
  const mockOutcome: CreateWaveOutcomeConfig = {
    id: 'outcome-1',
    type: 'manual',
  } as CreateWaveOutcomeConfig;

  const mockRemoveOutcome = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders approve component for approve wave type', () => {
    render(
      <CreateWaveOutcomesRowManual
        waveType={ApiWaveType.Approve}
        outcome={mockOutcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    expect(screen.getByTestId('manual-approve')).toBeInTheDocument();
    expect(screen.getByText('Approve Component')).toBeInTheDocument();
    expect(screen.queryByTestId('manual-rank')).not.toBeInTheDocument();
  });

  it('renders rank component for rank wave type', () => {
    render(
      <CreateWaveOutcomesRowManual
        waveType={ApiWaveType.Rank}
        outcome={mockOutcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    expect(screen.getByTestId('manual-rank')).toBeInTheDocument();
    expect(screen.getByText('Rank Component')).toBeInTheDocument();
    expect(screen.queryByTestId('manual-approve')).not.toBeInTheDocument();
  });

  it('renders empty div for chat wave type', () => {
    const { container } = render(
      <CreateWaveOutcomesRowManual
        waveType={ApiWaveType.Chat}
        outcome={mockOutcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    expect(container.firstChild).toBeEmptyDOMElement();
    expect(screen.queryByTestId('manual-approve')).not.toBeInTheDocument();
    expect(screen.queryByTestId('manual-rank')).not.toBeInTheDocument();
  });

  it('passes correct props to approve component', () => {
    render(
      <CreateWaveOutcomesRowManual
        waveType={ApiWaveType.Approve}
        outcome={mockOutcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    const approveComponent = screen.getByTestId('manual-approve');
    expect(approveComponent).toHaveAttribute('data-outcome-id', 'outcome-1');
  });

  it('passes correct props to rank component', () => {
    render(
      <CreateWaveOutcomesRowManual
        waveType={ApiWaveType.Rank}
        outcome={mockOutcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    const rankComponent = screen.getByTestId('manual-rank');
    expect(rankComponent).toHaveAttribute('data-outcome-id', 'outcome-1');
  });

  it('passes removeOutcome function to approve component', () => {
    render(
      <CreateWaveOutcomesRowManual
        waveType={ApiWaveType.Approve}
        outcome={mockOutcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    const removeButton = screen.getByTestId('remove-approve');
    removeButton.click();

    expect(mockRemoveOutcome).toHaveBeenCalledTimes(1);
  });

  it('passes removeOutcome function to rank component', () => {
    render(
      <CreateWaveOutcomesRowManual
        waveType={ApiWaveType.Rank}
        outcome={mockOutcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    const removeButton = screen.getByTestId('remove-rank');
    removeButton.click();

    expect(mockRemoveOutcome).toHaveBeenCalledTimes(1);
  });

  it('handles different outcome configurations', () => {
    const customOutcome: CreateWaveOutcomeConfig = {
      id: 'custom-outcome',
      type: 'custom',
      description: 'Custom outcome',
    } as CreateWaveOutcomeConfig;

    render(
      <CreateWaveOutcomesRowManual
        waveType={ApiWaveType.Approve}
        outcome={customOutcome}
        removeOutcome={mockRemoveOutcome}
      />
    );

    const approveComponent = screen.getByTestId('manual-approve');
    expect(approveComponent).toHaveAttribute('data-outcome-id', 'custom-outcome');
  });

  it('maintains component mapping integrity', () => {
    // Test that each wave type maps to the correct component
    const waveTypes = [ApiWaveType.Approve, ApiWaveType.Rank, ApiWaveType.Chat];
    const expectedTestIds = ['manual-approve', 'manual-rank', null];

    waveTypes.forEach((waveType, index) => {
      const { unmount } = render(
        <CreateWaveOutcomesRowManual
          waveType={waveType}
          outcome={mockOutcome}
          removeOutcome={mockRemoveOutcome}
        />
      );

      if (expectedTestIds[index]) {
        expect(screen.getByTestId(expectedTestIds[index]!)).toBeInTheDocument();
      } else {
        // For chat type, expecting empty div
        expect(screen.queryByTestId('manual-approve')).not.toBeInTheDocument();
        expect(screen.queryByTestId('manual-rank')).not.toBeInTheDocument();
      }

      unmount();
    });
  });
});