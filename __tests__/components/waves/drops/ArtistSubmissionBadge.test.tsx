import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ArtistSubmissionBadge } from '@/components/waves/drops/ArtistSubmissionBadge';

// Mock the mobile device hook
jest.mock('@/hooks/isMobileDevice', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

// Mock react-tooltip
jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, ...props }: any) => <div data-testid="tooltip" {...props}>{children}</div>,
}));

describe('ArtistSubmissionBadge', () => {
  const defaultProps = {
    submissionCount: 3,
    onBadgeClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders badge when submissionCount > 0', () => {
    render(<ArtistSubmissionBadge {...defaultProps} />);
    
    const badge = screen.getByRole('button');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', 'View 3 art submissions');
  });

  it('does not render when submissionCount is 0', () => {
    render(<ArtistSubmissionBadge {...defaultProps} submissionCount={0} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles singular vs plural submissions in aria-label', () => {
    const { rerender } = render(<ArtistSubmissionBadge {...defaultProps} submissionCount={1} />);
    
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'View 1 art submission');
    
    rerender(<ArtistSubmissionBadge {...defaultProps} submissionCount={5} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'View 5 art submissions');
  });

  it('calls onBadgeClick when clicked', () => {
    const mockOnClick = jest.fn();
    render(<ArtistSubmissionBadge {...defaultProps} onBadgeClick={mockOnClick} />);
    
    const badge = screen.getByRole('button');
    fireEvent.click(badge);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('prevents event propagation when clicked', () => {
    const mockOnClick = jest.fn();
    const mockParentClick = jest.fn();
    
    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={mockParentClick}>
        <ArtistSubmissionBadge {...defaultProps} onBadgeClick={mockOnClick} />
      </div>
    );
    
    const badge = screen.getByRole('button');
    fireEvent.click(badge);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockParentClick).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<ArtistSubmissionBadge {...defaultProps} />);
    
    const badge = screen.getByRole('button');
    expect(badge).toHaveAttribute('aria-expanded', 'false');
    expect(badge).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('renders tooltip for desktop users', () => {
    render(<ArtistSubmissionBadge {...defaultProps} />);
    
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('does not render tooltip for mobile users', () => {
    const useIsMobileDevice = require('@/hooks/isMobileDevice').default;
    useIsMobileDevice.mockReturnValue(true);
    
    render(<ArtistSubmissionBadge {...defaultProps} />);
    
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });

  it('uses custom tooltipId when provided', () => {
    const useIsMobileDevice = require('@/hooks/isMobileDevice').default;
    useIsMobileDevice.mockReturnValue(false); // Ensure desktop mode
    
    render(<ArtistSubmissionBadge {...defaultProps} tooltipId="custom-tooltip" />);
    
    const badge = screen.getByRole('button');
    const tooltipId = badge.getAttribute('data-tooltip-id');
    expect(tooltipId).toBeTruthy();
    expect(tooltipId).toContain('custom-tooltip');
  });

  it('has proper focus styles', () => {
    render(<ArtistSubmissionBadge {...defaultProps} />);
    
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('focus:tw-ring-1');
  });
});