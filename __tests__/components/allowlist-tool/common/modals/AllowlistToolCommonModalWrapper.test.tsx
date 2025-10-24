import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AllowlistToolCommonModalWrapper, { AllowlistToolModalSize } from '@/components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper';

jest.mock('react-use', () => ({
  useClickAway: (ref: React.RefObject<HTMLElement>, handler: () => void) => {
    React.useEffect(() => {
      const listener = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          handler();
        }
      };
      document.addEventListener('mousedown', listener);
      return () => document.removeEventListener('mousedown', listener);
    }, [ref, handler]);
  },
  useKeyPressEvent: (key: string, handler: () => void) => {
    React.useEffect(() => {
      const listener = (e: KeyboardEvent) => {
        if (e.key === key) {
          handler();
        }
      };
      window.addEventListener('keydown', listener);
      return () => window.removeEventListener('keydown', listener);
    }, [key, handler]);
  },
}));

describe('AllowlistToolCommonModalWrapper', () => {
  it('does not render when showModal is false', () => {
    const handleClose = jest.fn();
    render(
      <AllowlistToolCommonModalWrapper showModal={false} onClose={handleClose} title="Hidden">
        <div>content</div>
      </AllowlistToolCommonModalWrapper>
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('renders with title and children when showModal is true', () => {
    const handleClose = jest.fn();
    render(
      <AllowlistToolCommonModalWrapper showModal={true} onClose={handleClose} title="My Modal">
        <div data-testid="child">content</div>
      </AllowlistToolCommonModalWrapper>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('My Modal')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('hides the title when showTitle is false', () => {
    const handleClose = jest.fn();
    render(
      <AllowlistToolCommonModalWrapper showModal={true} onClose={handleClose} title="Title" showTitle={false}>
        <div>content</div>
      </AllowlistToolCommonModalWrapper>
    );
    expect(screen.queryByText('Title')).toBeNull();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <AllowlistToolCommonModalWrapper showModal={true} onClose={handleClose} title="Close Test">
        <div>content</div>
      </AllowlistToolCommonModalWrapper>
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = jest.fn();
    render(
      <AllowlistToolCommonModalWrapper showModal={true} onClose={handleClose} title="Key Test">
        <div>content</div>
      </AllowlistToolCommonModalWrapper>
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking outside the modal', () => {
    const handleClose = jest.fn();
    render(
      <AllowlistToolCommonModalWrapper showModal={true} onClose={handleClose} title="Outside Test">
        <div>content</div>
      </AllowlistToolCommonModalWrapper>
    );
    const overlay = document.querySelector('.tw-bg-opacity-50');
    expect(overlay).not.toBeNull();
    fireEvent.mouseDown(overlay as Element);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('applies correct size class for X_LARGE', () => {
    const handleClose = jest.fn();
    render(
      <AllowlistToolCommonModalWrapper showModal={true} onClose={handleClose} title="Size Test" modalSize={AllowlistToolModalSize.X_LARGE}>
        <div>content</div>
      </AllowlistToolCommonModalWrapper>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('sm:tw-max-w-2xl');
  });
});
