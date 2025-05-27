import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenTokenDownload, { NextGenTokenDownloadDropdownItem, Resolution } from '../../../../../components/nextGen/collections/nextgenToken/NextGenTokenDownload';

// Mock react-bootstrap components
jest.mock('react-bootstrap', () => {
  const React = require('react');
  const Dropdown: any = (p: any) => <div {...p} />;
  Dropdown.Item = (p: any) => <button {...p} />;
  const RB: any = {
    Container: (p: any) => <div data-testid="container" {...p} />,
    Row: (p: any) => <div data-testid="row" {...p} />,
    Col: (p: any) => <div data-testid="col" {...p} />,
    Dropdown,
  };
  return RB;
});

// Mock external components
jest.mock('../../../../../components/dotLoader/DotLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  Spinner: () => <div data-testid="spinner" />,
}));

const mockDownload = jest.fn();
const mockUseDownloader = jest.fn(() => ({ download: mockDownload, isInProgress: false }));

jest.mock('react-use-downloader', () => ({
  __esModule: true,
  default: () => mockUseDownloader(),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props: any) => <svg data-testid={props.icon.iconName} onClick={props.onClick} className={props.class} />,
}));

jest.mock('@tippyjs/react', () => {
  const React = require('react');
  return { __esModule: true, default: ({ children }: any) => <span>{children}</span> };
});

const token = { id: 7, image_url: 'https://img.com/png/file.png', collection_id: 1 } as any;

beforeEach(() => {
  jest.clearAllMocks();
});

it('downloads image when dropdown item clicked and image exists', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, headers: { get: () => '1500000' } });
  render(<NextGenTokenDownloadDropdownItem token={token} resolution={Resolution['1K']} />);

  const button = await screen.findByRole('button');
  await waitFor(() => expect(button).not.toBeDisabled());
  expect(button).toHaveTextContent('1K (1.5 MB)');

  await userEvent.click(button);
  expect(mockDownload).toHaveBeenCalledWith('https://img.com/png1k/file.png', '7_1K.png');
});

it('shows coming soon and disables when image missing', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false });
  render(<NextGenTokenDownloadDropdownItem token={token} resolution={Resolution['1K']} />);

  const button = await screen.findByRole('button');
  expect(button).toBeDisabled();
  expect(button).toHaveTextContent('1K Coming Soon');
  await userEvent.click(button);
  expect(mockDownload).not.toHaveBeenCalled();
});

it('opens link and downloads via button in main component', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, headers: { get: () => '2000000' } });
  const open = jest.fn();
  const origOpen = window.open;
  // @ts-ignore
  window.open = open;

  render(<NextGenTokenDownload token={token} resolution={Resolution['4K']} />);

  await waitFor(() => expect(screen.queryByTestId('loader')).not.toBeInTheDocument());

  await userEvent.click(screen.getByTestId('arrow-up-right-from-square'));
  expect(open).toHaveBeenCalledWith('https://img.com/png4k/file.png', '_blank');

  await userEvent.click(screen.getByTestId('download'));
  expect(mockDownload).toHaveBeenCalledWith('https://img.com/png4k/file.png', '7_4K.png');

  window.open = origOpen;
});
