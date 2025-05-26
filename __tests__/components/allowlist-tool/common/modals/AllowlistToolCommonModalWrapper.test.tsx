import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock hooks from react-use before importing component
const mockUseClickAway = jest.fn();
const mockUseKeyPressEvent = jest.fn();
jest.mock('react-use', () => ({
  useClickAway: (...args: any[]) => mockUseClickAway(...args),
  useKeyPressEvent: (...args: any[]) => mockUseKeyPressEvent(...args),
}));

import AllowlistToolCommonModalWrapper, { AllowlistToolModalSize } from '../../../../../components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper';

// Simplify animation wrappers
jest.mock(
  '../../../../../components/allowlist-tool/common/animation/AllowlistToolAnimationWrapper',
  () => ({
    __esModule: true,
    default: (props: any) => <div>{props.children}</div>,
  })
);
jest.mock(
  '../../../../../components/allowlist-tool/common/animation/AllowlistToolAnimationOpacity',
  () => ({
    __esModule: true,
    default: (props: any) => (
      <div role={props.elementRole} onClick={props.onClicked} className={props.elementClasses}>
        {props.children}
      </div>
    ),
  })
);

function setup(props: Partial<React.ComponentProps<typeof AllowlistToolCommonModalWrapper>> = {}) {
  const onClose = jest.fn();
  render(
    <AllowlistToolCommonModalWrapper title="Modal title" showModal={true} onClose={onClose} {...props}>
      <div>content</div>
    </AllowlistToolCommonModalWrapper>
  );
  return { onClose };
}

describe('AllowlistToolCommonModalWrapper', () => {
  it('does not render when showModal is false', () => {
    render(
      <AllowlistToolCommonModalWrapper title="title" showModal={false} onClose={() => {}}>
        <div>child</div>
      </AllowlistToolCommonModalWrapper>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders small modal and closes via button', async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(dialog.firstChild).toHaveClass('tw-relative');
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('applies custom size and hides title', () => {
    setup({ modalSize: AllowlistToolModalSize.LARGE, showTitle: false });
    const container = screen.getByRole('dialog').querySelector(
      'div.tw-relative.tw-w-full.tw-transform.tw-rounded-lg.tw-bg-neutral-900.tw-text-left.tw-shadow-xl.tw-transition-all'
    );
    expect(container).toBeTruthy();
    expect(screen.queryByText('Modal title')).not.toBeInTheDocument();
  });
});
