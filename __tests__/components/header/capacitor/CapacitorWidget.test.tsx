import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CapacitorWidget from '@/components/header/capacitor/CapacitorWidget';

jest.mock('@/hooks/useNavigationHistory', () => ({
  useNavigationHistory: () => ({
    canGoBack: true,
    canGoForward: true,
    isLoading: false,
    goBack: jest.fn(),
    goForward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockUseCapacitor = jest.fn();
jest.mock('@/hooks/useCapacitor', () => ({
  __esModule: true,
  default: () => mockUseCapacitor(),
}));

jest.mock('@/hooks/useDeepLinkNavigation', () => ({
  useDeepLinkNavigation: jest.fn(),
}));

const shareMock = jest.fn();
jest.mock('@capacitor/share', () => ({
  Share: { share: (...args: any[]) => shareMock(...args) },
}));

jest.mock('hammerjs', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    off: jest.fn(),
  }));
});

describe('CapacitorWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when keyboard is visible', () => {
    mockUseCapacitor.mockReturnValue({ keyboardVisible: true });
    const { container } = render(<CapacitorWidget />);
    expect(container.innerHTML).toBe('');
  });

  it('opens share popup when Share API not implemented', async () => {
    mockUseCapacitor.mockReturnValue({ keyboardVisible: false });
    shareMock.mockRejectedValueOnce(new Error('not implemented'));

    render(<CapacitorWidget />);
    const buttons = screen.getAllByRole('button');
    const shareButton = buttons[2];
    await userEvent.click(shareButton);

    const overlay = await screen.findByLabelText('Close overlay');
    await waitFor(() => expect(overlay).toBeVisible());
    expect(shareMock).toHaveBeenCalled();
  });

  it('copies link in share popup', async () => {
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
    mockUseCapacitor.mockReturnValue({ keyboardVisible: false });
    shareMock.mockRejectedValueOnce(new Error('not implemented'));

    render(<CapacitorWidget />);
    const shareButton = screen.getAllByRole('button')[2];
    await userEvent.click(shareButton);
    const copyButton = await screen.findByText('Copy link');
    await userEvent.click(copyButton);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
    expect(copyButton.textContent).toBe('Copied!');
  });
});
