import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesRepRank from '../../../../../../components/waves/create-wave/outcomes/rep/CreateWaveOutcomesRepRank';
import { CreateWaveOutcomeType } from '../../../../../../types/waves.types';

// Mock dependencies
jest.mock('../../../../../../components/utils/input/rep-category/RepCategorySearch', () => {
  return function RepCategorySearch({ error, category, setCategory }: any) {
    return (
      <div data-testid="rep-category-search">
        <input
          data-testid="category-input"
          value={category || ''}
          onChange={(e) => setCategory(e.target.value || null)}
          placeholder="Select category"
          className={error ? 'error' : ''}
        />
        {error && <span data-testid="category-error">Category required</span>}
      </div>
    );
  };
});

jest.mock('../../../../../../components/waves/create-wave/outcomes/winners/CreateWaveOutcomesWinners', () => {
  return function CreateWaveOutcomesWinners({ 
    winnersConfig, 
    totalValueError, 
    percentageError, 
    outcomeType, 
    setWinnersConfig 
  }: any) {
    return (
      <div data-testid="outcomes-winners">
        <button
          onClick={() => setWinnersConfig({
            ...winnersConfig,
            totalAmount: 100,
            winners: [{ value: 50 }, { value: 50 }],
          })}
          data-testid="update-winners"
        >
          Update Winners
        </button>
        <button
          onClick={() => setWinnersConfig({
            ...winnersConfig,
            creditValueType: 'PERCENTAGE',
            totalAmount: 100,
            winners: [{ value: 60 }, { value: 30 }], // This adds up to 90, not 100
          })}
          data-testid="set-percentage-mode"
        >
          Set Percentage Mode
        </button>
        {totalValueError && <span data-testid="total-value-error">Total value error</span>}
        {percentageError && <span data-testid="percentage-error">Percentage error</span>}
        <span data-testid="outcome-type">{outcomeType}</span>
      </div>
    );
  };
});

jest.mock('../../../../../../components/utils/button/PrimaryButton', () => {
  return function PrimaryButton({ onClicked, disabled, loading, children }: any) {
    return (
      <button
        onClick={onClicked}
        disabled={disabled}
        data-testid="primary-button"
        data-loading={loading}
      >
        {children}
      </button>
    );
  };
});

describe('CreateWaveOutcomesRepRank', () => {
  const mockOnOutcome = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onOutcome: mockOnOutcome,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<CreateWaveOutcomesRepRank {...defaultProps} {...props} />);
  };

  it('renders all required components', () => {
    renderComponent();
    
    expect(screen.getByTestId('rep-category-search')).toBeInTheDocument();
    expect(screen.getByTestId('outcomes-winners')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByTestId('primary-button')).toBeInTheDocument();
  });

  it('initializes with REP outcome type', () => {
    renderComponent();
    
    expect(screen.getByTestId('outcome-type')).toHaveTextContent(CreateWaveOutcomeType.REP);
  });

  it('handles category selection', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const categoryInput = screen.getByTestId('category-input');
    await user.type(categoryInput, 'Test Category');
    
    expect(categoryInput).toHaveValue('Test Category');
  });

  it('handles cancel button click', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await user.click(screen.getByText('Cancel'));
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('validates category is required on submit', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Try to submit without category
    await user.click(screen.getByTestId('primary-button'));
    
    expect(screen.getByTestId('category-error')).toBeInTheDocument();
    expect(mockOnOutcome).not.toHaveBeenCalled();
  });

  it('submits successfully with valid data', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Set category
    const categoryInput = screen.getByTestId('category-input');
    await user.type(categoryInput, 'Test Category');
    
    // Update winners to valid configuration
    await user.click(screen.getByTestId('update-winners'));
    
    // Submit
    await user.click(screen.getByTestId('primary-button'));
    
    expect(mockOnOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CreateWaveOutcomeType.REP,
        category: 'Test Category',
        maxWinners: 2,
        winnersConfig: expect.objectContaining({
          totalAmount: 100,
          winners: [{ value: 50 }, { value: 50 }],
        }),
      })
    );
  });

  it('shows total value error when present', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Set category but leave winners in invalid state
    const categoryInput = screen.getByTestId('category-input');
    await user.type(categoryInput, 'Test Category');
    
    // Submit with invalid winners
    await user.click(screen.getByTestId('primary-button'));
    
    expect(screen.getByTestId('total-value-error')).toBeInTheDocument();
    expect(mockOnOutcome).not.toHaveBeenCalled();
  });

  it('shows percentage error when present', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Set category 
    const categoryInput = screen.getByTestId('category-input');
    await user.type(categoryInput, 'Test Category');
    
    // Set to percentage mode with invalid total (90% instead of 100%)
    await user.click(screen.getByTestId('set-percentage-mode'));
    
    // Submit with invalid percentage
    await user.click(screen.getByTestId('primary-button'));
    
    expect(screen.getByTestId('percentage-error')).toBeInTheDocument();
    expect(mockOnOutcome).not.toHaveBeenCalled();
  });

  it('clears category error when category is selected', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Trigger category error
    await user.click(screen.getByTestId('primary-button'));
    expect(screen.getByTestId('category-error')).toBeInTheDocument();
    
    // Set category to clear error
    const categoryInput = screen.getByTestId('category-input');
    await user.type(categoryInput, 'Test Category');
    
    expect(screen.queryByTestId('category-error')).not.toBeInTheDocument();
  });

  it('updates max winners based on winners config', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Set category
    const categoryInput = screen.getByTestId('category-input');
    await user.type(categoryInput, 'Test Category');
    
    // Update winners - this should set maxWinners to 2
    await user.click(screen.getByTestId('update-winners'));
    
    // Submit to verify maxWinners is correct
    await user.click(screen.getByTestId('primary-button'));
    
    expect(mockOnOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        maxWinners: 2,
      })
    );
  });

  it('renders with proper structure and classes', () => {
    const { container } = renderComponent();
    
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('tw-flex', 'tw-flex-col', 'tw-gap-y-5');
    
    const buttonContainer = container.querySelector('.tw-flex.tw-justify-end.tw-gap-x-3');
    expect(buttonContainer).toBeInTheDocument();
  });

  it('handles empty category input correctly', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const categoryInput = screen.getByTestId('category-input');
    
    // Type and then clear
    await user.type(categoryInput, 'Test');
    await user.clear(categoryInput);
    
    expect(categoryInput).toHaveValue('');
  });

  it('initializes with default outcome configuration', () => {
    renderComponent();
    
    // Check that the initial configuration is passed to CreateWaveOutcomesWinners
    expect(screen.getByTestId('outcomes-winners')).toBeInTheDocument();
  });
});