import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TermsOfServiceModal from '@/components/terms/TermsOfServiceModal';

jest.mock('@/components/waves/memes/submission/layout/ModalLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('focus-trap-react', () => ({ FocusTrap: ({ children }: any) => <div>{children}</div> }));

jest.mock('@/components/utils/button/PrimaryButton', () => ({
  __esModule: true,
  default: ({ children, onClicked, ...props }: any) => (
    <button data-testid="primary" onClick={onClicked} {...props}>{children}</button>
  ),
}));

describe('TermsOfServiceModal', () => {
  it('returns null when closed', () => {
    const { container } = render(
      <TermsOfServiceModal isOpen={false} onClose={jest.fn()} onAccept={jest.fn()} termsContent={''} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays content and allows acceptance', async () => {
    const onAccept = jest.fn();
    render(
      <TermsOfServiceModal isOpen onClose={jest.fn()} onAccept={onAccept} termsContent="terms" />
    );
    const checkbox = screen.getByRole('checkbox');
    const button = screen.getByTestId('primary');
    expect(button).toBeDisabled();
    await userEvent.click(checkbox);
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onAccept).toHaveBeenCalled();
  });

  it('shows placeholder when no terms', () => {
    render(
      <TermsOfServiceModal isOpen onClose={jest.fn()} onAccept={jest.fn()} termsContent={null} />
    );
    expect(screen.getByText('No terms of service found.')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const onClose = jest.fn();
    render(
      <TermsOfServiceModal isOpen onClose={onClose} onAccept={jest.fn()} termsContent="t" />
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('toggles via Enter key', async () => {
    render(
      <TermsOfServiceModal isOpen onClose={jest.fn()} onAccept={jest.fn()} termsContent="t" />
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    checkbox.focus();
    await userEvent.keyboard('{Enter}');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });
});
