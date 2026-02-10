import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveApprovalThreshold from '@/components/waves/create-wave/approval/CreateWaveApprovalThreshold';

describe('CreateWaveApprovalThreshold', () => {
  const defaultProps = {
    threshold: null,
    error: false,
    setThreshold: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders threshold input with correct label', () => {
    render(<CreateWaveApprovalThreshold {...defaultProps} />);
    
    expect(screen.getByLabelText('Threshold')).toBeInTheDocument();
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });

  it('displays current threshold value', () => {
    render(<CreateWaveApprovalThreshold {...defaultProps} threshold={50} />);
    
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
  });

  it('calls setThreshold with valid number on input change', async () => {
    const mockSetThreshold = jest.fn();
    render(<CreateWaveApprovalThreshold {...defaultProps} setThreshold={mockSetThreshold} />);
    
    const input = screen.getByLabelText('Threshold');
    
    // Use fireEvent to avoid controlled input issues with userEvent
    fireEvent.change(input, { target: { value: '75' } });
    
    expect(mockSetThreshold).toHaveBeenCalledWith(75);
  });

  it('calls setThreshold with null for invalid input', async () => {
    const mockSetThreshold = jest.fn();
    render(<CreateWaveApprovalThreshold {...defaultProps} setThreshold={mockSetThreshold} />);
    
    const input = screen.getByLabelText('Threshold');
    await userEvent.type(input, 'abc');
    
    expect(mockSetThreshold).toHaveBeenCalledWith(null);
  });

  it('applies error styling when error prop is true', () => {
    render(<CreateWaveApprovalThreshold {...defaultProps} error={true} />);
    
    const input = screen.getByLabelText('Threshold');
    expect(input).toHaveClass('tw-ring-error');
    expect(input).toHaveClass('focus:tw-border-error');
    expect(input).toHaveClass('focus:tw-ring-error');
    expect(input).toHaveClass('tw-caret-error');
  });

  it('applies normal styling when error prop is false', () => {
    render(<CreateWaveApprovalThreshold {...defaultProps} error={false} />);
    
    const input = screen.getByLabelText('Threshold');
    expect(input).toHaveClass('tw-ring-iron-650');
    expect(input).toHaveClass('focus:tw-border-primary-400');
    expect(input).toHaveClass('focus:tw-ring-primary-400');
    expect(input).toHaveClass('tw-caret-primary-400');
  });

  it('shows error message when error prop is true', () => {
    render(<CreateWaveApprovalThreshold {...defaultProps} error={true} />);
    
    expect(screen.getByText('Please set threshold')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument(); // SVG icon
  });

  it('does not show error message when error prop is false', () => {
    render(<CreateWaveApprovalThreshold {...defaultProps} error={false} />);
    
    expect(screen.queryByText('Please set threshold')).not.toBeInTheDocument();
  });

  it('applies primary text color when threshold has value', () => {
    render(<CreateWaveApprovalThreshold {...defaultProps} threshold={25} />);
    
    const input = screen.getByLabelText('Threshold');
    expect(input).toHaveClass('tw-text-primary-400');
  });

  it('handles empty input by setting threshold to null', async () => {
    const mockSetThreshold = jest.fn();
    render(<CreateWaveApprovalThreshold {...defaultProps} threshold={50} setThreshold={mockSetThreshold} />);
    
    const input = screen.getByLabelText('Threshold');
    await userEvent.clear(input);
    
    expect(mockSetThreshold).toHaveBeenCalledWith(null);
  });

  it('handles decimal input correctly', async () => {
    const mockSetThreshold = jest.fn();
    render(<CreateWaveApprovalThreshold {...defaultProps} setThreshold={mockSetThreshold} />);
    
    const input = screen.getByLabelText('Threshold');
    
    // Use fireEvent to set the value all at once instead of typing character by character
    fireEvent.change(input, { target: { value: '12.5' } });
    
    // parseInt converts '12.5' to 12
    expect(mockSetThreshold).toHaveBeenCalledWith(12);
  });

  it('handles negative input correctly', async () => {
    const mockSetThreshold = jest.fn();
    render(<CreateWaveApprovalThreshold {...defaultProps} setThreshold={mockSetThreshold} />);
    
    const input = screen.getByLabelText('Threshold');
    
    // Use fireEvent to set the value all at once
    fireEvent.change(input, { target: { value: '-5' } });
    
    // parseInt converts '-5' to -5
    expect(mockSetThreshold).toHaveBeenCalledWith(-5);
  });
});
