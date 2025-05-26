import { render, screen } from '@testing-library/react';
import AllowlistToolCommonModalWrapper, { AllowlistToolModalSize } from '../../../../../components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper';

jest.mock('../../../../../components/allowlist-tool/common/animation/AllowlistToolAnimationWrapper', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="animation-wrapper">{props.children}</div>,
}));

jest.mock('../../../../../components/allowlist-tool/common/animation/AllowlistToolAnimationOpacity', () => ({
  __esModule: true,
  default: (props: any) => <div role={props.elementRole} className={props.elementClasses} onClick={props.onClicked}>{props.children}</div>,
}));

jest.mock('react-use', () => ({
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn(),
}));

const { useClickAway, useKeyPressEvent } = jest.requireMock('react-use');

describe('AllowlistToolCommonModalWrapper', () => {
  const onClose = jest.fn();
  let clickAwayHandler: () => void;
  let keyPressHandler: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    (useClickAway as jest.Mock).mockImplementation((_ref, handler) => {
      clickAwayHandler = handler;
    });
    (useKeyPressEvent as jest.Mock).mockImplementation((_key, handler) => {
      keyPressHandler = handler;
    });
  });

  it('renders title and calls onClose via handlers', async () => {
    render(
      <AllowlistToolCommonModalWrapper showModal onClose={onClose} title="My Modal">
        <div>content</div>
      </AllowlistToolCommonModalWrapper>
    );

    expect(screen.getByTestId('animation-wrapper')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('My Modal')).toBeInTheDocument();

    // simulate click away and escape key
    clickAwayHandler();
    keyPressHandler();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('hides title when showTitle is false', () => {
    render(
      <AllowlistToolCommonModalWrapper showModal onClose={onClose} title="My Modal" showTitle={false}>
        <div>content</div>
      </AllowlistToolCommonModalWrapper>
    );
    expect(screen.queryByText('My Modal')).toBeNull();
  });

  it('applies modal size class', () => {
    render(
      <AllowlistToolCommonModalWrapper showModal onClose={onClose} title="size" modalSize={AllowlistToolModalSize.LARGE}>
        <div>content</div>
      </AllowlistToolCommonModalWrapper>
    );
    const dialog = screen.getByRole('dialog');
    const sizeDiv = dialog.querySelector('.sm\\:tw-max-w-xl');
    expect(sizeDiv).not.toBeNull();
  });

  it('does not render dialog when showModal is false', () => {
    render(
      <AllowlistToolCommonModalWrapper showModal={false} onClose={onClose} title="none">
        <div>content</div>
      </AllowlistToolCommonModalWrapper>
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
