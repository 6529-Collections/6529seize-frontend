import { render, screen, fireEvent } from '@testing-library/react';
import AllowlistToolAnimationHeightOpacity from '@/components/allowlist-tool/common/animation/AllowlistToolAnimationHeightOpacity';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: jest.fn(({ children, className, role, onClick, ...props }) => (
      <div
        className={className}
        role={role}
        onClick={onClick}
        data-testid="motion-div"
        data-initial={JSON.stringify(props.initial)}
        data-animate={JSON.stringify(props.animate)}
        data-exit={JSON.stringify(props.exit)}
        data-layout={props.layout}
      >
        {children}
      </div>
    )),
  },
}));

describe('AllowlistToolAnimationHeightOpacity', () => {
  const mockOnClicked = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children content', () => {
    render(
      <AllowlistToolAnimationHeightOpacity>
        <div>Test Content</div>
      </AllowlistToolAnimationHeightOpacity>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default motion div properties', () => {
    render(
      <AllowlistToolAnimationHeightOpacity>
        <div>Content</div>
      </AllowlistToolAnimationHeightOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveAttribute('data-layout', 'true');
    expect(motionDiv).toHaveAttribute('data-initial', '{"height":"0","opacity":0}');
    
    const animateData = JSON.parse(motionDiv.getAttribute('data-animate') || '{}');
    expect(animateData.height).toBe('auto');
    expect(animateData.opacity).toBe(1);
    expect(animateData.transition.height.duration).toBe(0.3);
    expect(animateData.transition.opacity.duration).toBe(0.3);
    expect(animateData.transition.opacity.delay).toBe(0.3);
  });

  it('applies exit animation properties', () => {
    render(
      <AllowlistToolAnimationHeightOpacity>
        <div>Content</div>
      </AllowlistToolAnimationHeightOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    const exitData = JSON.parse(motionDiv.getAttribute('data-exit') || '{}');
    
    expect(exitData.height).toBe('0');
    expect(exitData.opacity).toBe(0);
    expect(exitData.transition.opacity.duration).toBe(0);
    expect(exitData.transition.height.duration).toBe(0.3);
  });

  it('applies custom element classes when provided', () => {
    const customClasses = 'custom-class another-class';
    render(
      <AllowlistToolAnimationHeightOpacity elementClasses={customClasses}>
        <div>Content</div>
      </AllowlistToolAnimationHeightOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveAttribute('class', customClasses);
  });

  it('applies custom element role when provided', () => {
    const customRole = 'banner';
    render(
      <AllowlistToolAnimationHeightOpacity elementRole={customRole}>
        <div>Content</div>
      </AllowlistToolAnimationHeightOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveAttribute('role', customRole);
  });

  it('handles click events when onClicked is provided', () => {
    render(
      <AllowlistToolAnimationHeightOpacity onClicked={mockOnClicked}>
        <div>Clickable Content</div>
      </AllowlistToolAnimationHeightOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    fireEvent.click(motionDiv);

    expect(mockOnClicked).toHaveBeenCalledTimes(1);
    expect(mockOnClicked).toHaveBeenCalledWith(expect.any(Object));
  });

  it('does not break when onClicked is not provided', () => {
    render(
      <AllowlistToolAnimationHeightOpacity>
        <div>Content</div>
      </AllowlistToolAnimationHeightOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(() => fireEvent.click(motionDiv)).not.toThrow();
  });

  it('handles undefined elementClasses gracefully', () => {
    render(
      <AllowlistToolAnimationHeightOpacity elementClasses={undefined}>
        <div>Content</div>
      </AllowlistToolAnimationHeightOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveAttribute('class', '');
  });

  it('handles undefined elementRole gracefully', () => {
    render(
      <AllowlistToolAnimationHeightOpacity elementRole={undefined}>
        <div>Content</div>
      </AllowlistToolAnimationHeightOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).not.toHaveAttribute('role');
  });

  it('renders complex nested content correctly', () => {
    render(
      <AllowlistToolAnimationHeightOpacity>
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button>Action</button>
        </div>
      </AllowlistToolAnimationHeightOpacity>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('passes mouse event object to onClicked handler', () => {
    render(
      <AllowlistToolAnimationHeightOpacity onClicked={mockOnClicked}>
        <div>Content</div>
      </AllowlistToolAnimationHeightOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    fireEvent.click(motionDiv, { detail: 1 });

    expect(mockOnClicked).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'click',
      })
    );
  });

  it('works with all props combined', () => {
    render(
      <AllowlistToolAnimationHeightOpacity
        elementClasses="test-class"
        elementRole="region"
        onClicked={mockOnClicked}
      >
        <div>Full Featured Content</div>
      </AllowlistToolAnimationHeightOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveAttribute('class', 'test-class');
    expect(motionDiv).toHaveAttribute('role', 'region');
    expect(screen.getByText('Full Featured Content')).toBeInTheDocument();

    fireEvent.click(motionDiv);
    expect(mockOnClicked).toHaveBeenCalledTimes(1);
  });
});