import { render, screen } from '@testing-library/react';
import AllowlistToolAnimationWrapper from '../../../../../components/allowlist-tool/common/animation/AllowlistToolAnimationWrapper';

const animatePresenceMock = jest.fn(({ children, ...props }: any) => (
  <div data-testid="presence">{children}</div>
));

jest.mock('framer-motion', () => ({
  AnimatePresence: (props: any) => animatePresenceMock(props)
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AllowlistToolAnimationWrapper', () => {
  it('passes props to AnimatePresence and renders children', () => {
    render(
      <AllowlistToolAnimationWrapper mode="sync" initial={true}>
        <span>child</span>
      </AllowlistToolAnimationWrapper>
    );

    const wrapper = screen.getByTestId('presence');
    expect(wrapper).toHaveTextContent('child');
    expect(animatePresenceMock).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'sync', initial: true, children: expect.anything() })
    );
  });

  it('uses default props when none specified', () => {
    render(
      <AllowlistToolAnimationWrapper>
        <div>default</div>
      </AllowlistToolAnimationWrapper>
    );

    const wrapper = screen.getByTestId('presence');
    expect(wrapper).toHaveTextContent('default');
    const call = animatePresenceMock.mock.calls[0][0];
    expect(call.mode).toBe('wait');
    expect(call.initial).toBe(false);
  });
});
