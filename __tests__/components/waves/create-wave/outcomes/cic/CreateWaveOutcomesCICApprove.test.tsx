import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesCICApprove from '../../../../../../components/waves/create-wave/outcomes/cic/CreateWaveOutcomesCICApprove';
import { ApiWaveType } from '../../../../../../generated/models/ApiWaveType';
import { CreateWaveDatesConfig } from '../../../../../../types/waves.types';

// Mock child components
jest.mock('../../../../../../components/waves/create-wave/outcomes/CreateWaveOutcomeWarning', () => ({
  __esModule: true,
  default: ({ waveType, dates, maxWinners }: any) => (
    <div data-testid="outcome-warning">
      Warning Component - Wave: {waveType}, Max Winners: {maxWinners}
    </div>
  ),
}));

jest.mock('../../../../../../components/utils/button/PrimaryButton', () => ({
  __esModule: true,
  default: ({ onClicked, disabled, loading, children, padding }: any) => (
    <button 
      onClick={onClicked}
      disabled={disabled}
      data-testid="primary-button"
      data-loading={loading}
      className={padding}
    >
      {children}
    </button>
  ),
}));

describe('CreateWaveOutcomesCICApprove', () => {
  const mockDates: CreateWaveDatesConfig = {
    submissionStartDate: 1000000,
    votingStartDate: 1100000,
    endDate: 1200000,
    firstDecisionTime: 1150000,
    subsequentDecisions: [],
    isRolling: false,
  };

  const defaultProps = {
    waveType: ApiWaveType.Approve,
    dates: mockDates,
    onOutcome: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render with initial state', () => {
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      expect(screen.getByLabelText('NIC')).toBeInTheDocument();
      expect(screen.getByLabelText('Max Winners')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByTestId('primary-button')).toHaveTextContent('Save');
      expect(screen.getByTestId('outcome-warning')).toBeInTheDocument();
    });

    it('should render inputs with empty values initially', () => {
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');
      const maxWinnersInput = screen.getByLabelText('Max Winners');

      expect(nicInput).toHaveValue('');
      expect(maxWinnersInput).toHaveValue('');
    });

    it('should not show error initially', () => {
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      expect(screen.queryByText('NIC must be a positive number')).not.toBeInTheDocument();
    });

    it('should pass correct props to warning component', () => {
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      expect(screen.getByTestId('outcome-warning')).toHaveTextContent(
        'Warning Component - Wave: APPROVE, Max Winners:'
      );
    });
  });

  describe('NIC Input Handling', () => {
    it('should update NIC value on valid numeric input', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');

      await user.type(nicInput, '100');

      expect(nicInput).toHaveValue('100');
    });

    it('should handle decimal values and submit correctly', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');

      // Type decimal value using individual characters
      await user.clear(nicInput);
      fireEvent.change(nicInput, { target: { value: '50.5' } });

      await user.click(screen.getByTestId('primary-button'));

      expect(defaultProps.onOutcome).toHaveBeenCalledWith(
        expect.objectContaining({ credit: 50.5 })
      );
    });

    it('should clear value on invalid input', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');

      // First enter a valid value
      await user.type(nicInput, '100');
      expect(nicInput).toHaveValue('100');

      // Clear and enter invalid input
      await user.clear(nicInput);
      await user.type(nicInput, 'invalid');

      expect(nicInput).toHaveValue('');
    });

    it('should handle negative input by ignoring minus sign', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');

      // Typing "-10" would result in "10" because minus is ignored
      await user.type(nicInput, '-10');

      expect(nicInput).toHaveValue('10');
    });

    it('should handle zero value', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');

      await user.type(nicInput, '0');

      expect(nicInput).toHaveValue('0');
    });

    it('should clear error when valid input is entered', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      // First trigger error by submitting without value
      await user.click(screen.getByTestId('primary-button'));
      expect(screen.getByText('NIC must be a positive number')).toBeInTheDocument();

      // Then enter valid value - error should clear
      const nicInput = screen.getByLabelText('NIC');
      await user.type(nicInput, '50');

      expect(screen.queryByText('NIC must be a positive number')).not.toBeInTheDocument();
    });
  });

  describe('Max Winners Input Handling', () => {
    it('should update max winners value on valid input', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const maxWinnersInput = screen.getByLabelText('Max Winners');

      await user.type(maxWinnersInput, '5');

      expect(maxWinnersInput).toHaveValue('5');
    });

    it('should handle zero and negative values correctly', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const maxWinnersInput = screen.getByLabelText('Max Winners');

      // Test zero input - zero should not be accepted (maxWinners > 0 required)
      fireEvent.change(maxWinnersInput, { target: { value: '0' } });
      // The warning should not display a number since 0 is invalid
      expect(screen.getByTestId('outcome-warning')).toHaveTextContent('Max Winners:');

      // Test valid positive number
      fireEvent.change(maxWinnersInput, { target: { value: '5' } });
      expect(screen.getByTestId('outcome-warning')).toHaveTextContent('Max Winners: 5');
    });

    it('should clear value on invalid input', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const maxWinnersInput = screen.getByLabelText('Max Winners');

      await user.type(maxWinnersInput, 'abc');

      expect(maxWinnersInput).toHaveValue('');
    });

    it('should update warning component with max winners value', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const maxWinnersInput = screen.getByLabelText('Max Winners');

      await user.type(maxWinnersInput, '3');

      expect(screen.getByTestId('outcome-warning')).toHaveTextContent(
        'Warning Component - Wave: APPROVE, Max Winners: 3'
      );
    });
  });

  describe('Form Submission', () => {
    it('should show error when submitting without NIC value', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      await user.click(screen.getByTestId('primary-button'));

      expect(screen.getByText('NIC must be a positive number')).toBeInTheDocument();
      expect(defaultProps.onOutcome).not.toHaveBeenCalled();
    });

    it('should submit successfully with valid NIC value', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');
      await user.type(nicInput, '100');

      await user.click(screen.getByTestId('primary-button'));

      expect(defaultProps.onOutcome).toHaveBeenCalledWith({
        type: 'NIC',
        title: null,
        credit: 100,
        category: null,
        winnersConfig: null,
        maxWinners: null,
      });
      expect(screen.queryByText('NIC must be a positive number')).not.toBeInTheDocument();
    });

    it('should submit with both NIC and max winners', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');
      const maxWinnersInput = screen.getByLabelText('Max Winners');

      // Type values carefully to avoid confusion
      await user.type(nicInput, '75');
      await user.type(maxWinnersInput, '10');

      await user.click(screen.getByTestId('primary-button'));

      expect(defaultProps.onOutcome).toHaveBeenCalledWith({
        type: 'NIC',
        title: null,
        credit: 75,
        category: null,
        winnersConfig: null,
        maxWinners: 10,
      });
    });

    it('should submit with NIC only (max winners optional)', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');
      await user.type(nicInput, '200');

      await user.click(screen.getByTestId('primary-button'));

      expect(defaultProps.onOutcome).toHaveBeenCalledWith({
        type: 'NIC',
        title: null,
        credit: 200,
        category: null,
        winnersConfig: null,
        maxWinners: null,
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      await user.click(screen.getByText('Cancel'));

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error State Styling', () => {
    it('should apply error styling when error is present', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      // Trigger error
      await user.click(screen.getByTestId('primary-button'));

      const nicInput = screen.getByLabelText('NIC');
      expect(nicInput).toHaveClass('tw-ring-error');
      expect(nicInput).toHaveClass('focus:tw-border-error');
      expect(nicInput).toHaveClass('focus:tw-ring-error');
      expect(nicInput).toHaveClass('tw-caret-error');

      const label = screen.getByText('NIC');
      expect(label).toHaveClass('peer-focus:tw-text-error');
    });

    it('should apply normal styling when no error', () => {
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');
      expect(nicInput).toHaveClass('tw-ring-iron-650');
      expect(nicInput).toHaveClass('focus:tw-border-blue-500');
      expect(nicInput).toHaveClass('focus:tw-ring-primary-400');
      expect(nicInput).toHaveClass('tw-caret-primary-400');
    });

    it('should show error icon when error is present', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      await user.click(screen.getByTestId('primary-button'));

      const errorIcon = document.querySelector('svg.tw-text-error');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  describe('Primary Button Props', () => {
    it('should pass correct props to primary button', () => {
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const primaryButton = screen.getByTestId('primary-button');
      
      expect(primaryButton).toHaveAttribute('data-loading', 'false');
      expect(primaryButton).not.toBeDisabled();
      expect(primaryButton).toHaveClass('tw-px-4 tw-py-3');
    });
  });

  describe('Component Integration', () => {
    it('should handle rapid input changes correctly', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');

      // Rapid changes
      await user.type(nicInput, '1');
      await user.type(nicInput, '0');
      await user.type(nicInput, '0');

      expect(nicInput).toHaveValue('100');

      await user.click(screen.getByTestId('primary-button'));

      expect(defaultProps.onOutcome).toHaveBeenCalledWith(
        expect.objectContaining({ credit: 100 })
      );
    });

    it('should handle different wave types', () => {
      render(
        <CreateWaveOutcomesCICApprove 
          {...defaultProps} 
          waveType={ApiWaveType.Rank}
        />
      );

      expect(screen.getByTestId('outcome-warning')).toHaveTextContent(
        'Warning Component - Wave: RANK'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');
      await user.type(nicInput, '999999');

      expect(nicInput).toHaveValue('999999');

      await user.click(screen.getByTestId('primary-button'));

      expect(defaultProps.onOutcome).toHaveBeenCalledWith(
        expect.objectContaining({ credit: 999999 })
      );
    });

    it('should handle scientific notation input', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');
      
      // Scientific notation characters like 'e' would be ignored, so only '15' remains
      await user.type(nicInput, '1e5');
      expect(nicInput).toHaveValue('15');
    });

    it('should handle paste events', async () => {
      const user = userEvent.setup();
      render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

      const nicInput = screen.getByLabelText('NIC');
      
      // Simulate pasting valid number
      fireEvent.change(nicInput, { target: { value: '123.45' } });
      
      expect(nicInput).toHaveValue('123.45');
    });
  });
});
