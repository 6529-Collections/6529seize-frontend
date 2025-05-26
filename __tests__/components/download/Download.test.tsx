import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Download from '../../../components/download/Download';
import useDownloader from 'react-use-downloader';

jest.mock('react-use-downloader');

const mockedUseDownloader = useDownloader as jest.MockedFunction<typeof useDownloader>;

describe('Download', () => {
  it('triggers download when not in progress', async () => {
    const downloadMock = jest.fn();
    mockedUseDownloader.mockReturnValue({
      size: 0,
      elapsed: 0,
      percentage: 0,
      download: downloadMock,
      cancel: jest.fn(),
      error: null,
      isInProgress: false,
    });

    render(<Download href="/f" name="myfile" extension="txt" />);
    await userEvent.click(screen.getByRole('img', { hidden: true }));
    expect(downloadMock).toHaveBeenCalledWith('/f', 'myfile.txt');
  });

  it('shows progress and allows cancel', async () => {
    const cancelMock = jest.fn();
    mockedUseDownloader.mockReturnValue({
      size: 0,
      elapsed: 0,
      percentage: 42,
      download: jest.fn(),
      cancel: cancelMock,
      error: null,
      isInProgress: true,
    });

    render(<Download href="/f" name="myfile" extension="txt" />);
    expect(screen.getByText('Downloading 42 %')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Cancel'));
    expect(cancelMock).toHaveBeenCalled();
  });
});
