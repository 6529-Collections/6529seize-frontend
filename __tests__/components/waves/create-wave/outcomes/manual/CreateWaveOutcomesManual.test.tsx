import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesManual from '@/components/waves/create-wave/outcomes/manual/CreateWaveOutcomesManual';
import { ApiWaveType } from '@/generated/models/ApiWaveType';
import { CreateWaveDatesConfig } from '@/types/waves.types';

// Mock dependencies
jest.mock('@/components/waves/create-wave/outcomes/CreateWaveOutcomeWarning', () => {
  return function MockCreateWaveOutcomeWarning() {
    return <div data-testid="outcome-warning">Outcome Warning</div>;
  };
});

jest.mock('@/components/utils/button/PrimaryButton', () => {
  return function MockPrimaryButton({ children, onClicked, disabled, loading }: any) {
    return (
      <button 
        data-testid="primary-button" 
        onClick={onClicked} 
        disabled={disabled || loading}
      >
        {children}
      </button>
    );
  };
});

const mockDates: CreateWaveDatesConfig = {
  submissionStartDate: new Date('2024-01-01').getTime(),
  votingStartDate: new Date('2024-02-01').getTime(),
  endDate: new Date('2024-02-28').getTime(),
  firstDecisionTime: new Date('2024-03-01').getTime(),
  subsequentDecisions: [],
  isRolling: false,
};

describe('CreateWaveOutcomesManual', () => {
  const defaultProps = {
    waveType: ApiWaveType.Approve,
    dates: mockDates,
    onOutcome: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders manual action input', () => {
    render(<CreateWaveOutcomesManual {...defaultProps} />);
    
    expect(screen.getByLabelText('Manual action')).toBeInTheDocument();
  });

  it('shows max winners input for approve wave type', () => {
    render(<CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Approve} />);
    
    expect(screen.getByLabelText('Max Winners')).toBeInTheDocument();
  });

  it('shows positions input for rank wave type', () => {
    render(<CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} />);
    
    expect(screen.getByLabelText(/Winning Positions/i)).toBeInTheDocument();
  });

  it('does not show max winners for rank wave type', () => {
    render(<CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} />);
    
    expect(screen.queryByLabelText('Max Winners')).not.toBeInTheDocument();
  });

  it('does not show positions for approve wave type', () => {
    render(<CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Approve} />);
    
    expect(screen.queryByLabelText(/Winning Positions/i)).not.toBeInTheDocument();
  });

  it('updates manual action value on input change', async () => {
    render(<CreateWaveOutcomesManual {...defaultProps} />);
    
    const input = screen.getByLabelText('Manual action');
    await userEvent.type(input, 'Test action');
    
    expect(input).toHaveValue('Test action');
  });

  it('updates max winners value on input change', async () => {
    render(<CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Approve} />);
    
    const input = screen.getByLabelText('Max Winners');
    await userEvent.type(input, '10');
    
    expect(input).toHaveValue('10');
  });

  it('shows error when submitting without manual action', async () => {
    render(<CreateWaveOutcomesManual {...defaultProps} />);
    
    const saveButton = screen.getByTestId('primary-button');
    await userEvent.click(saveButton);
    
    expect(screen.getByText('Please enter your manual action')).toBeInTheDocument();
  });

  it('shows error for rank wave without positions', async () => {
    render(<CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} />);
    
    const actionInput = screen.getByLabelText('Manual action');
    await userEvent.type(actionInput, 'Test action');
    
    const saveButton = screen.getByTestId('primary-button');
    await userEvent.click(saveButton);
    
    expect(screen.getByText('Please enter positions')).toBeInTheDocument();
  });

  it('accepts valid position format for rank wave', async () => {
    const mockOnOutcome = jest.fn();
    render(<CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} onOutcome={mockOnOutcome} />);
    
    const actionInput = screen.getByLabelText('Manual action');
    await userEvent.type(actionInput, 'Test action');
    
    const positionsInput = screen.getByLabelText(/Winning Positions/i);
    await userEvent.type(positionsInput, '1,3,5');
    
    const saveButton = screen.getByTestId('primary-button');
    await userEvent.click(saveButton);
    
    expect(mockOnOutcome).toHaveBeenCalled();
  });

  it('shows error for invalid position format', async () => {
    render(<CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} />);
    
    const actionInput = screen.getByLabelText('Manual action');
    await userEvent.type(actionInput, 'Test action');
    
    const positionsInput = screen.getByLabelText(/Winning Positions/i);
    // Use a value that passes the input filter but fails format validation
    await userEvent.type(positionsInput, '1--3');
    
    const saveButton = screen.getByTestId('primary-button');
    await userEvent.click(saveButton);
    
    expect(screen.getByText('Invalid position format')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const mockOnCancel = jest.fn();
    render(<CreateWaveOutcomesManual {...defaultProps} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onOutcome with correct data for approve wave', async () => {
    const mockOnOutcome = jest.fn();
    render(<CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Approve} onOutcome={mockOnOutcome} />);
    
    const actionInput = screen.getByLabelText('Manual action');
    await userEvent.type(actionInput, 'Approve action');
    
    const maxWinnersInput = screen.getByLabelText('Max Winners');
    await userEvent.type(maxWinnersInput, '5');
    
    const saveButton = screen.getByTestId('primary-button');
    await userEvent.click(saveButton);
    
    expect(mockOnOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Approve action',
        maxWinners: 5,
        winnersConfig: null,
      })
    );
  });

  it('parses range positions correctly', async () => {
    const mockOnOutcome = jest.fn();
    render(<CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} onOutcome={mockOnOutcome} />);
    
    const actionInput = screen.getByLabelText('Manual action');
    await userEvent.type(actionInput, 'Rank action');
    
    const positionsInput = screen.getByLabelText(/Winning Positions/i);
    await userEvent.type(positionsInput, '1-3,5');
    
    const saveButton = screen.getByTestId('primary-button');
    await userEvent.click(saveButton);
    
    expect(mockOnOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Rank action',
        winnersConfig: expect.objectContaining({
          totalAmount: 4, // positions 1,2,3,5
          winners: expect.arrayContaining([
            { value: 1 }, // position 1
            { value: 1 }, // position 2
            { value: 1 }, // position 3
            { value: 0 }, // position 4
            { value: 1 }, // position 5
          ]),
        }),
      })
    );
  });

  it('filters invalid characters in positions input', async () => {
    render(<CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} />);
    
    const positionsInput = screen.getByLabelText(/Winning Positions/i);
    await userEvent.type(positionsInput, '1,2abc,3');
    
    // Should only allow numbers, commas, and dashes
    expect(positionsInput).toHaveValue('1,2,3');
  });

  it('clears input empty error when value is entered', async () => {
    render(<CreateWaveOutcomesManual {...defaultProps} />);
    
    // First trigger the error
    const saveButton = screen.getByTestId('primary-button');
    await userEvent.click(saveButton);
    
    expect(screen.getByText('Please enter your manual action')).toBeInTheDocument();
    
    // Then enter a value to clear the error
    const actionInput = screen.getByLabelText('Manual action');
    await userEvent.type(actionInput, 'Action');
    
    expect(screen.queryByText('Please enter your manual action')).not.toBeInTheDocument();
  });
});
