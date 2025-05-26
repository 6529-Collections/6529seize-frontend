import { render, screen } from '@testing-library/react';
import AllowlistToolAnimationHeightOpacity from '../../../../../components/allowlist-tool/common/animation/AllowlistToolAnimationHeightOpacity';

jest.mock('framer-motion', () => ({ motion: { div: (props: any) => <div {...props}>{props.children}</div> } }));

describe('AllowlistToolAnimationHeightOpacity', () => {
  it('renders children with provided class and role', () => {
    render(
      <AllowlistToolAnimationHeightOpacity elementClasses="cls" elementRole="status">
        <span>child</span>
      </AllowlistToolAnimationHeightOpacity>
    );
    const div = screen.getByRole('status');
    expect(div).toHaveClass('cls');
    expect(div).toHaveTextContent('child');
  });
});
