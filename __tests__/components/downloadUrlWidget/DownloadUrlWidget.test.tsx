import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DownloadUrlWidget from '@/components/downloadUrlWidget/DownloadUrlWidget';

const mockDownload = jest.fn();
const mockUseDownloader = jest.fn();

jest.mock('react-use-downloader', () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseDownloader(...args)
}));

jest.mock('@/services/auth/auth.utils', () => ({
  getStagingAuth: () => 'stag',
  getAuthJwt: () => 'jwtToken'
}));

describe('DownloadUrlWidget', () => {
  beforeEach(() => {
    mockDownload.mockClear();
    mockUseDownloader.mockClear();
  });

  it('passes headers and triggers download on click', async () => {
    mockUseDownloader.mockReturnValue({ download: mockDownload, isInProgress: false });
    render(<DownloadUrlWidget preview="Download" url="/file" name="file.pdf" />);
    expect(mockUseDownloader).toHaveBeenCalledWith({ headers: { 'x-6529-auth': 'stag', Authorization: 'Bearer jwtToken' } });
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(mockDownload).toHaveBeenCalledWith('/file', 'file.pdf');
  });

  it('shows spinner and disables button when in progress', async () => {
    mockUseDownloader.mockReturnValue({ download: mockDownload, isInProgress: true });
    render(<DownloadUrlWidget preview="Download" url="/file" name="file.pdf" />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Downloading')).toBeInTheDocument();
    await userEvent.click(button);
    expect(mockDownload).not.toHaveBeenCalled();
  });
});
