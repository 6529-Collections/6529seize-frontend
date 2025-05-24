import { render, screen, fireEvent } from '@testing-library/react';
import AllowlistToolAnimationOpacity from '../../../../../components/allowlist-tool/common/animation/AllowlistToolAnimationOpacity';

// Mock framer-motion to capture props passed to motion.div
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
      >
        {children}
      </div>
    )),
  },
}));

describe('AllowlistToolAnimationOpacity', () => {
  const mockOnClicked = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children content', () => {
    render(
      <AllowlistToolAnimationOpacity>
        <div>Test Content</div>
      </AllowlistToolAnimationOpacity>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default motion div properties', () => {
    render(
      <AllowlistToolAnimationOpacity>
        <div>Content</div>
      </AllowlistToolAnimationOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveAttribute('data-initial', '{"opacity":0}');
    expect(motionDiv).toHaveAttribute('data-animate', '{"opacity":1}');
    expect(motionDiv).toHaveAttribute('data-exit', '{"opacity":0}');
  });

  it('applies custom element classes when provided', () => {
    const customClasses = 'custom-class another-class';
    render(
      <AllowlistToolAnimationOpacity elementClasses={customClasses}>
        <div>Content</div>
      </AllowlistToolAnimationOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveAttribute('class', customClasses);
  });

  it('applies custom element role when provided', () => {
    const customRole = 'banner';
    render(
      <AllowlistToolAnimationOpacity elementRole={customRole}>
        <div>Content</div>
      </AllowlistToolAnimationOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveAttribute('role', customRole);
  });

  it('handles click events when onClicked is provided', () => {
    render(
      <AllowlistToolAnimationOpacity onClicked={mockOnClicked}>
        <div>Clickable Content</div>
      </AllowlistToolAnimationOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    fireEvent.click(motionDiv);

    expect(mockOnClicked).toHaveBeenCalledTimes(1);
    expect(mockOnClicked).toHaveBeenCalledWith(expect.any(Object));
  });

  it('does not break when onClicked is not provided', () => {
    render(
      <AllowlistToolAnimationOpacity>
        <div>Content</div>
      </AllowlistToolAnimationOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(() => fireEvent.click(motionDiv)).not.toThrow();
  });

  it('handles undefined elementClasses gracefully', () => {
    render(
      <AllowlistToolAnimationOpacity elementClasses={undefined}>
        <div>Content</div>
      </AllowlistToolAnimationOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveAttribute('class', '');
  });

  it('handles undefined elementRole gracefully', () => {
    render(
      <AllowlistToolAnimationOpacity elementRole={undefined}>
        <div>Content</div>
      </AllowlistToolAnimationOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).not.toHaveAttribute('role');
  });

  it('renders complex nested content correctly', () => {
    render(
      <AllowlistToolAnimationOpacity>
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button>Action</button>
        </div>
      </AllowlistToolAnimationOpacity>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('passes mouse event object to onClicked handler', () => {
    render(
      <AllowlistToolAnimationOpacity onClicked={mockOnClicked}>
        <div>Content</div>
      </AllowlistToolAnimationOpacity>
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
      <AllowlistToolAnimationOpacity
        elementClasses="test-class"
        elementRole="region"
        onClicked={mockOnClicked}
      >
        <div>Full Featured Content</div>
      </AllowlistToolAnimationOpacity>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveAttribute('class', 'test-class');
    expect(motionDiv).toHaveAttribute('role', 'region');
    expect(screen.getByText('Full Featured Content')).toBeInTheDocument();

    fireEvent.click(motionDiv);
    expect(mockOnClicked).toHaveBeenCalledTimes(1);
  });
});
