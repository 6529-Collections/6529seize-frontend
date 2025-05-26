import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AllowlistToolAnimationOpacity from '../../../../../components/allowlist-tool/common/animation/AllowlistToolAnimationOpacity';

const motionDivMock = jest.fn((props: any) => <div data-testid="motion" {...props}>{props.children}</div>);

jest.mock('framer-motion', () => ({
  motion: { div: (props: any) => motionDivMock(props) }
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AllowlistToolAnimationOpacity', () => {
  it('renders children and forwards props to motion.div', async () => {
    const handleClick = jest.fn();
    render(
      <AllowlistToolAnimationOpacity elementClasses="my-class" elementRole="button" onClicked={handleClick}>
        <span>content</span>
      </AllowlistToolAnimationOpacity>
    );

    const div = screen.getByRole('button');
    expect(div).toHaveClass('my-class');
    expect(div).toHaveTextContent('content');

    await userEvent.click(div);
    expect(handleClick).toHaveBeenCalled();

    expect(motionDivMock).toHaveBeenCalledWith(
      expect.objectContaining({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: 'my-class',
        role: 'button',
        onClick: expect.any(Function)
      })
    );
  });

  it('uses default props when none provided', () => {
    render(
      <AllowlistToolAnimationOpacity>
        <span>other</span>
      </AllowlistToolAnimationOpacity>
    );

    const div = screen.getByTestId('motion');
    expect(div).toHaveTextContent('other');
    // calling default onClick should not throw
    expect(() => {
      div.click();
    }).not.toThrow();
  });
});
