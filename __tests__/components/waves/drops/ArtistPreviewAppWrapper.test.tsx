import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArtistPreviewAppWrapper from '../../../../components/waves/drops/ArtistPreviewAppWrapper';

// Mock Headless UI components
jest.mock('@headlessui/react', () => ({
  Dialog: ({ children, onClose, ...props }: any) => (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div data-testid="dialog" onClick={onClose} {...props}>
      {children}
    </div>
  ),
  DialogPanel: ({ children, ...props }: any) => (
    <div data-testid="dialog-panel" {...props}>
      {children}
    </div>
  ),
  Transition: ({ children, show }: any) => show ? <>{children}</> : null,
  TransitionChild: ({ children }: any) => <>{children}</>,
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(function MockMotionDiv({ children, onDragEnd, drag, ...props }: any, ref) {
      return (
        <button
          ref={ref}
          data-testid="motion-div"
          data-drag={drag}
          onMouseUp={(e) => {
            // Simulate drag end with different velocities/offsets for testing
            if (onDragEnd) {
              onDragEnd(e, { offset: { y: 0 }, velocity: { y: 0 } });
            }
          }}
          {...props}
        >
          {children}
        </button>
      );
    }),
  },
  useDragControls: () => ({
    start: jest.fn(),
  }),
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: (props: any) => <svg data-testid="x-mark-icon" {...props} />,
}));

describe('ArtistPreviewAppWrapper', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div data-testid="test-content">Test Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);
    
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close panel');
    expect(closeButton).toBeInTheDocument();
    expect(screen.getByTestId('x-mark-icon')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(<ArtistPreviewAppWrapper {...defaultProps} onClose={mockOnClose} />);
    
    const closeButton = screen.getByLabelText('Close panel');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when dialog backdrop is clicked', () => {
    const mockOnClose = jest.fn();
    render(<ArtistPreviewAppWrapper {...defaultProps} onClose={mockOnClose} />);
    
    const dialog = screen.getByTestId('dialog');
    fireEvent.click(dialog);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });


  it('has draggable motion div', () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);
    
    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveAttribute('data-drag', 'y');
  });

  it('handles drag end with small offset (no close)', () => {
    const mockOnClose = jest.fn();
    render(<ArtistPreviewAppWrapper {...defaultProps} onClose={mockOnClose} />);
    
    const motionDiv = screen.getByTestId('motion-div');
    
    // Simulate small drag that shouldn't close
    fireEvent.mouseUp(motionDiv);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('prevents event propagation on container click/touch', () => {
    const mockParentClick = jest.fn();
    
    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={mockParentClick}>
        <ArtistPreviewAppWrapper {...defaultProps} />
      </div>
    );
    
    // Find the container that prevents propagation
    const container = screen.getByTestId('dialog-panel').parentElement;
    if (container) {
      fireEvent.click(container);
      fireEvent.touchStart(container);
    }
    
    expect(mockParentClick).not.toHaveBeenCalled();
  });

  it('renders children content', () => {
    const customChildren = (
      <div>
        <h1>Custom Header</h1>
        <p>Custom Content</p>
      </div>
    );
    
    render(
      <ArtistPreviewAppWrapper {...defaultProps}>
        {customChildren}
      </ArtistPreviewAppWrapper>
    );
    
    expect(screen.getByText('Custom Header')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close panel');
    expect(closeButton).toHaveAttribute('aria-label', 'Close panel');
    expect(closeButton).toHaveAttribute('type', 'button');
  });

  it('has safe area padding', () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);
    
    const dialogPanel = screen.getByTestId('dialog-panel');
    expect(dialogPanel).toHaveClass('tw-pb-[env(safe-area-inset-bottom,0px)]');
  });

  it('has proper styling classes', () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);
    
    const dialogPanel = screen.getByTestId('dialog-panel');
    expect(dialogPanel).toHaveClass(
      'tw-w-full',
      'tw-bg-iron-950',
      'tw-shadow-xl',
      'tw-rounded-t-2xl',
      'tw-max-h-[85vh]'
    );
  });


  it('handles focus styles on close button', () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close panel');
    expect(closeButton).toHaveClass('focus:tw-ring-2', 'focus:tw-ring-white');
  });

  it('has proper z-index for overlay', () => {
    render(<ArtistPreviewAppWrapper {...defaultProps} />);
    
    const dialog = screen.getByTestId('dialog');
    expect(dialog).toHaveClass('tw-z-[1010]');
  });
});