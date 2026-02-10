import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveDropActionsDownload from '@/components/waves/drops/WaveDropActionsDownload';

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

describe('WaveDropActionsDownload', () => {
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

  it('starts download on button click when not in progress', async () => {
    const user = userEvent.setup();
    render(
      <WaveDropActionsDownload
        href="/file"
        name="test"
        extension="txt"
        tooltipId="download-media-1"
      />
    );
    const button = screen.getByRole('button', { name: /download file/i });
    await user.click(button);
    expect(mockDownload).toHaveBeenCalledWith('/file', 'test.txt');
  });

  it('cancels download when in progress on button click', async () => {
    const user = userEvent.setup();
    mockUseDownloader.mockReturnValueOnce({
      size: 0,
      elapsed: 0,
      percentage: 55,
      download: mockDownload,
      cancel: mockCancel,
      error: null,
      isInProgress: true,
    });
    render(
      <WaveDropActionsDownload
        href="/file"
        name="test"
        extension="txt"
        tooltipId="download-media-1"
      />
    );
    const button = screen.getByRole('button', { name: /download file/i });
    await user.click(button);
    expect(mockCancel).toHaveBeenCalled();
  });
});

