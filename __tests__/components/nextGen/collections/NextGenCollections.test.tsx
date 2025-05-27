import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NextGenCollections from '../../../../components/nextGen/collections/NextGenCollections';

const fetchUrl = jest.fn();

jest.mock('../../../../services/6529api', () => ({
  fetchUrl: (...args: any[]) => fetchUrl(...args),
}));

jest.mock('../../../../components/nextGen/collections/NextGenCollectionPreview', () =>
  ({ collection }: any) => <div data-testid="preview">{collection.name}</div>
);

jest.mock('../../../../components/pagination/Pagination', () => (props: any) => (
  <div data-testid="pagination">
    <button onClick={() => props.setPage(props.page + 1)}>next</button>
  </div>
));

jest.mock('react-bootstrap', () => {
  const React = require('react');
  const RB: any = {
    Container: (p: any) => <div data-testid="container" {...p} />,
    Row: (p: any) => <div data-testid="row" {...p} />,
    Col: (p: any) => <div data-testid="col" {...p} />,
  };
  const Dropdown: any = (p: any) => <div data-testid="dropdown" {...p} />;
  Dropdown.Toggle = (p: any) => <button {...p}>{p.children}</button>;
  Dropdown.Menu = (p: any) => <div data-testid="menu" {...p} />;
  Dropdown.Item = (p: any) => <button {...p} />;
  RB.Dropdown = Dropdown;
  return RB;
});

beforeEach(() => {
  fetchUrl.mockReset();
  process.env.API_ENDPOINT = 'https://api.test';
  window.scrollTo = jest.fn();
});

it('fetches collections on mount and displays them', async () => {
  fetchUrl.mockResolvedValue({ count: 1, data: [{ id: 1, name: 'A' }] });
  render(<NextGenCollections />);

  await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));
  expect(fetchUrl).toHaveBeenCalledWith(
    'https://api.test/api/nextgen/collections?page_size=25&page=1'
  );
  expect(await screen.findByText('A')).toBeInTheDocument();
});

it('shows message when no collections found', async () => {
  fetchUrl.mockResolvedValue({ count: 0, data: [] });
  render(<NextGenCollections />);
  await screen.findByText('No collections found');
});

it('filters by status and resets page', async () => {
  fetchUrl.mockResolvedValue({ count: 1, data: [{ id: 1, name: 'A' }] });
  fetchUrl
    .mockResolvedValueOnce({ count: 1, data: [{ id: 1, name: 'A' }] })
    .mockResolvedValueOnce({ count: 1, data: [{ id: 1, name: 'A' }] })
    .mockResolvedValueOnce({ count: 1, data: [{ id: 2, name: 'B' }] });

  render(<NextGenCollections />);
  await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));

  await userEvent.click(screen.getByRole('button', { name: 'LIVE' }));

  await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(3));
  expect(fetchUrl).toHaveBeenLastCalledWith(
    'https://api.test/api/nextgen/collections?page_size=25&page=1&status=LIVE'
  );
});

it('requests next page with pagination', async () => {
  fetchUrl.mockResolvedValue({ count: 26, data: [{ id: 1, name: 'A' }] });
  fetchUrl
    .mockResolvedValueOnce({ count: 26, data: [{ id: 1, name: 'A' }] })
    .mockResolvedValueOnce({ count: 26, data: [{ id: 1, name: 'A' }] })
    .mockResolvedValueOnce({ count: 26, data: [{ id: 2, name: 'B' }] });

  render(<NextGenCollections />);
  await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(2));

  await userEvent.click(await screen.findByText('next'));

  await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(3));
  expect(fetchUrl).toHaveBeenLastCalledWith(
    'https://api.test/api/nextgen/collections?page_size=25&page=2'
  );
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
});
