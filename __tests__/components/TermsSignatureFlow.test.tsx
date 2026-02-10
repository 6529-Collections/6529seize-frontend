import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TermsSignatureFlow from '@/components/terms/TermsSignatureFlow';

const mockSignDrop = jest.fn(async () => ({ success: true, signature: 'sig' }));

jest.mock('@/hooks/drops/useDropSignature', () => ({
  useDropSignature: () => ({ signDrop: mockSignDrop, isLoading: false })
}));

describe('TermsSignatureFlow', () => {
  beforeEach(() => {
    mockSignDrop.mockClear();
  });

  it('opens modal on event and resolves signature', async () => {
    const onComplete = jest.fn();
    render(<TermsSignatureFlow />);

    await waitFor(() => {}); // allow effect to attach listener

    const event = new CustomEvent('showTermsModal', {
      detail: { drop: { id: 1 }, termsOfService: 'My Terms', onComplete }
    });
    await act(async () => {
      document.dispatchEvent(event);
    });

    expect(await screen.findByText('Terms of Service')).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);
    const button = screen.getByRole('button', { name: /agree & continue/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({ success: true, signature: 'sig' });
    });
  });

  it('calls failure callback when rejected', async () => {
    const onComplete = jest.fn();
    render(<TermsSignatureFlow />);

    await waitFor(() => {});

    const event = new CustomEvent('showTermsModal', {
      detail: { drop: { id: 2 }, termsOfService: 'My Terms', onComplete }
    });
    await act(async () => {
      document.dispatchEvent(event);
    });

    expect(await screen.findByText('Terms of Service')).toBeInTheDocument();
    const close = screen.getByLabelText('Close modal');
    await userEvent.click(close);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({ success: false });
    });
  });
});
