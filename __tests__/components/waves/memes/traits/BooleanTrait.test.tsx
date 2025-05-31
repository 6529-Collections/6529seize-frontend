import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BooleanTrait } from '../../../../../components/waves/memes/traits/BooleanTrait';
import { TraitsData } from '../../../../../components/waves/memes/submission/types/TraitsData';

// Mock TraitWrapper
jest.mock('../../../../../components/waves/memes/traits/TraitWrapper', () => ({
  TraitWrapper: ({ children, label, error, className, id }: any) => (
    <div data-testid="trait-wrapper" className={className} data-error={error} data-label={label} data-id={id}>
      {children}
    </div>
  ),
}));

describe('BooleanTrait', () => {
  const mockTraits: Partial<TraitsData> = {
    punk6529: false,
    gradient: true,
    movement: false,
  };

  const mockUpdateBoolean = jest.fn();
  const mockOnBlur = jest.fn();

  const defaultProps = {
    label: 'Test Boolean Field',
    field: 'punk6529' as keyof TraitsData,
    traits: mockTraits as TraitsData,
    updateBoolean: mockUpdateBoolean,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders with correct initial state for false value', () => {
    render(<BooleanTrait {...defaultProps} />);

    const yesButton = screen.getByRole('button', { name: 'Yes' });
    const noButton = screen.getByRole('button', { name: 'No' });

    expect(yesButton).toBeInTheDocument();
    expect(noButton).toBeInTheDocument();
    expect(yesButton).toHaveClass('tw-bg-iron-800/50');
    expect(noButton).toHaveClass('tw-bg-primary-400/30');
  });

  it('renders with correct initial state for true value', () => {
    render(
      <BooleanTrait 
        {...defaultProps} 
        field="gradient"
      />
    );

    const yesButton = screen.getByRole('button', { name: 'Yes' });
    const noButton = screen.getByRole('button', { name: 'No' });

    expect(yesButton).toHaveClass('tw-bg-primary-400/30');
    expect(noButton).toHaveClass('tw-bg-iron-800/50');
  });

  it('calls updateBoolean with true when Yes button is clicked', () => {
    render(<BooleanTrait {...defaultProps} />);

    const yesButton = screen.getByRole('button', { name: 'Yes' });
    fireEvent.click(yesButton);

    expect(mockUpdateBoolean).toHaveBeenCalledWith('punk6529', true);
    expect(mockUpdateBoolean).toHaveBeenCalledTimes(1);
  });

  it('calls updateBoolean with false when No button is clicked', () => {
    render(
      <BooleanTrait 
        {...defaultProps} 
        field="gradient"
      />
    );

    const noButton = screen.getByRole('button', { name: 'No' });
    fireEvent.click(noButton);

    expect(mockUpdateBoolean).toHaveBeenCalledWith('gradient', false);
    expect(mockUpdateBoolean).toHaveBeenCalledTimes(1);
  });

  it('calls onBlur when provided and Yes button is clicked', () => {
    render(
      <BooleanTrait 
        {...defaultProps} 
        onBlur={mockOnBlur}
      />
    );

    const yesButton = screen.getByRole('button', { name: 'Yes' });
    fireEvent.click(yesButton);

    expect(mockOnBlur).toHaveBeenCalledWith('punk6529');
    expect(mockOnBlur).toHaveBeenCalledTimes(1);
  });

  it('calls onBlur when provided and No button is clicked', () => {
    render(
      <BooleanTrait 
        {...defaultProps} 
        onBlur={mockOnBlur}
      />
    );

    const noButton = screen.getByRole('button', { name: 'No' });
    fireEvent.click(noButton);

    expect(mockOnBlur).toHaveBeenCalledWith('punk6529');
    expect(mockOnBlur).toHaveBeenCalledTimes(1);
  });

  it('passes correct props to TraitWrapper', () => {
    const error = 'This field is required';
    const className = 'custom-class';

    render(
      <BooleanTrait 
        {...defaultProps} 
        error={error}
        className={className}
      />
    );

    const wrapper = screen.getByTestId('trait-wrapper');
    expect(wrapper).toHaveAttribute('data-label', 'Test Boolean Field');
    expect(wrapper).toHaveAttribute('data-error', error);
    expect(wrapper).toHaveAttribute('data-id', 'field-punk6529');
    expect(wrapper).toHaveClass(className);
  });

  it('updates UI state when traits change', () => {
    const { rerender } = render(<BooleanTrait {...defaultProps} />);

    // Initially false
    let yesButton = screen.getByRole('button', { name: 'Yes' });
    let noButton = screen.getByRole('button', { name: 'No' });
    expect(yesButton).toHaveClass('tw-bg-iron-800/50');
    expect(noButton).toHaveClass('tw-bg-primary-400/30');

    // Change to true
    const updatedTraits = { ...mockTraits, punk6529: true };
    rerender(
      <BooleanTrait 
        {...defaultProps} 
        traits={updatedTraits as TraitsData}
      />
    );

    yesButton = screen.getByRole('button', { name: 'Yes' });
    noButton = screen.getByRole('button', { name: 'No' });
    expect(yesButton).toHaveClass('tw-bg-primary-400/30');
    expect(noButton).toHaveClass('tw-bg-iron-800/50');
  });

  it('maintains state during rapid clicks', () => {
    render(<BooleanTrait {...defaultProps} />);

    const yesButton = screen.getByRole('button', { name: 'Yes' });
    const noButton = screen.getByRole('button', { name: 'No' });

    // Multiple rapid clicks
    fireEvent.click(yesButton);
    fireEvent.click(noButton);
    fireEvent.click(yesButton);

    expect(mockUpdateBoolean).toHaveBeenCalledTimes(3);
    expect(mockUpdateBoolean).toHaveBeenNthCalledWith(1, 'punk6529', true);
    expect(mockUpdateBoolean).toHaveBeenNthCalledWith(2, 'punk6529', false);
    expect(mockUpdateBoolean).toHaveBeenNthCalledWith(3, 'punk6529', true);
  });

  it('handles different boolean fields correctly', () => {
    const fields: Array<keyof TraitsData> = ['gradient', 'movement', 'dynamic'];
    
    fields.forEach((field) => {
      cleanup();
      jest.clearAllMocks();
      
      render(
        <BooleanTrait 
          {...defaultProps} 
          field={field}
        />
      );

      const yesButton = screen.getByRole('button', { name: 'Yes' });
      fireEvent.click(yesButton);

      expect(mockUpdateBoolean).toHaveBeenCalledWith(field, true);
    });
  });

  it('memoizes correctly and prevents unnecessary re-renders', () => {
    const { rerender } = render(<BooleanTrait {...defaultProps} />);

    // Re-render with same props
    rerender(<BooleanTrait {...defaultProps} />);

    // The component should not re-render buttons due to memoization
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('has correct display name', () => {
    expect(BooleanTrait.displayName).toBe('BooleanTrait');
  });

  it('handles missing traits field gracefully', () => {
    const traitsWithoutField = { ...mockTraits };
    delete (traitsWithoutField as any).punk6529;

    render(
      <BooleanTrait 
        {...defaultProps} 
        traits={traitsWithoutField as TraitsData}
      />
    );

    const yesButton = screen.getByRole('button', { name: 'Yes' });
    const noButton = screen.getByRole('button', { name: 'No' });

    // Should default to false/No state
    expect(yesButton).toHaveClass('tw-bg-iron-800/50');
    expect(noButton).toHaveClass('tw-bg-primary-400/30');
  });

  it('applies correct CSS classes for different states', () => {
    render(<BooleanTrait {...defaultProps} />);

    const buttonsContainer = screen.getByRole('button', { name: 'Yes' }).parentElement;
    expect(buttonsContainer).toHaveClass('tw-flex', 'tw-gap-3', 'tw-w-full');
    expect(buttonsContainer).toHaveAttribute('data-field', 'punk6529');
  });
});