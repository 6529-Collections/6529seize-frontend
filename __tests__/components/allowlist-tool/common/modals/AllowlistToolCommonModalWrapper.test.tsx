import React from "react";
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AllowlistToolCommonModalWrapper, { AllowlistToolModalSize } from '../../../../../components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper';
jest.mock("react-use", () => ({
  useClickAway: (ref: React.RefObject<HTMLElement>, onClick: (e: MouseEvent) => void) => {
    React.useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (!ref.current || !ref.current.contains(e.target as Node)) onClick(e);
      };
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }, [ref, onClick]);
  },
  useKeyPressEvent: (key: string, onKey: (e: KeyboardEvent) => void) => {
    React.useEffect(() => {
      const handler = (e: KeyboardEvent) => { if (e.key === key) onKey(e); };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [key, onKey]);
  },
}));


function renderModal(props: any) {
  return render(
    <AllowlistToolCommonModalWrapper {...props}>
      <div data-testid="content" />
    </AllowlistToolCommonModalWrapper>
  );
}

describe('AllowlistToolCommonModalWrapper', () => {
  it('does not render when showModal is false', () => {
    renderModal({ showModal: false, title: 'Title', onClose: jest.fn() });
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('renders title and calls onClose when close button clicked', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderModal({ showModal: true, title: 'My Modal', onClose });
    expect(screen.getByText('My Modal')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key and outside click', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderModal({ showModal: true, title: 'Esc', onClose });
    await user.keyboard('{Escape}');
    await user.click(document.body);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('applies modal size class', () => {
    renderModal({ showModal: true, title: 'size', onClose: jest.fn(), modalSize: AllowlistToolModalSize.LARGE });
    const dialog = screen.getByRole("dialog");
    const sized = Array.from(dialog.querySelectorAll("div")).find(el => el.classList.contains("sm:tw-max-w-xl"));
    expect(sized).toBeTruthy();
  });
});
