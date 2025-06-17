import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Download from '../../components/download/Download';

const mockDownload = jest.fn();
const mockCancel = jest.fn();
const mockUseDownloader = jest.fn(() => ({
  size: 0,
  elapsed: 0,
  percentage: 42,
  download: mockDownload,
  cancel: mockCancel,
  error: null,
  isInProgress: false,
}));

jest.mock('react-use-downloader', () => ({
  __esModule: true,
  default: () => mockUseDownloader(),
}));

describe('Download', () => {
  beforeEach(() => {
    mockDownload.mockClear();
    mockCancel.mockClear();
    mockUseDownloader.mockClear();
    mockUseDownloader.mockReturnValue({
      size: 0,
      elapsed: 0,
      percentage: 42,
      download: mockDownload,
      cancel: mockCancel,
      error: null,
      isInProgress: false,
    });
  });

  it('starts download on icon click when not in progress', async () => {
    render(<Download href="/file" name="test" extension="txt" />);
    const icon = screen.getByRole('img', { hidden: true });
    await userEvent.click(icon);
    expect(mockDownload).toHaveBeenCalledWith('/file', 'test.txt');
  });

  it('shows progress and cancels when in progress', async () => {
    mockUseDownloader.mockReturnValueOnce({
      size: 0,
      elapsed: 0,
      percentage: 55,
      download: mockDownload,
      cancel: mockCancel,
      error: null,
      isInProgress: true,
    });
    render(<Download href="/file" name="test" extension="txt" />);
    expect(screen.getByText(/Downloading 55/)).toBeInTheDocument();
    // The cancel button is an X icon, not text
    const cancelButton = screen.getByRole('img', { hidden: true });
    await userEvent.click(cancelButton);
    expect(mockCancel).toHaveBeenCalled();
  });
});
