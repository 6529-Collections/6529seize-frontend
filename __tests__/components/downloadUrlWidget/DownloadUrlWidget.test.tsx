import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DownloadUrlWidget from '../../../components/downloadUrlWidget/DownloadUrlWidget';
import useDownloader from 'react-use-downloader';

jest.mock('react-use-downloader');
jest.mock('../../../components/dotLoader/DotLoader', () => ({ Spinner: () => <span data-testid="spinner" /> }));
jest.mock('../../../services/auth/auth.utils', () => ({ getAuthJwt: () => 'jwt', getStagingAuth: () => 'api' }));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (p:any) => <svg data-testid="icon" onClick={p.onClick} /> }));

const mockedUseDownloader = useDownloader as jest.MockedFunction<typeof useDownloader>;

describe('DownloadUrlWidget', () => {
  it('starts download when button clicked', async () => {
    const downloadMock = jest.fn();
    mockedUseDownloader.mockReturnValue({
      size: 0,
      elapsed: 0,
      percentage: 0,
      download: downloadMock,
      cancel: jest.fn(),
      error: null,
      isInProgress: false,
    } as any);
    render(<DownloadUrlWidget preview="Preview" url="/file" name="file.txt" />);
    await userEvent.click(screen.getByRole('button'));
    expect(downloadMock).toHaveBeenCalledWith('/file', 'file.txt');
    expect(screen.queryByTestId('spinner')).toBeNull();
  });

  it('shows spinner when in progress and disables button', () => {
    const cancel = jest.fn();
    mockedUseDownloader.mockReturnValue({
      size: 0,
      elapsed: 0,
      percentage: 0,
      download: jest.fn(),
      cancel,
      error: null,
      isInProgress: true,
    } as any);
    render(<DownloadUrlWidget preview="Preview" url="/file" name="file.txt" />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
});
