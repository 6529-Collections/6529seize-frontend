import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemeLabLeaderboard from '@/components/leaderboard/MemeLabLeaderboard';
import { SortDirection } from '@/entities/ISort';

jest.mock('@/components/leaderboard/NFTLeaderboard', () => ({
  fetchNftTdhResults: jest.fn(),
  PAGE_SIZE: 25,
  setScrollPosition: jest.fn(),
}));

jest.mock('@/components/leaderboard/LeaderboardCollector', () => ({
  LeaderboardCollector: (p: any) => <div data-testid="collector">{p.handle}</div>,
}));

jest.mock('@/components/pagination/Pagination', () => (props: any) => (
  <div data-testid="pagination" onClick={() => props.setPage(props.page + 1)}>next</div>
));

jest.mock('react-bootstrap', () => {
  const React = require('react');
  return {
    Container: (p: any) => <div data-testid="container">{p.children}</div>,
    Row: (p: any) => <div data-testid="row">{p.children}</div>,
    Col: (p: any) => <div data-testid="col">{p.children}</div>,
    Table: (p: any) => <table>{p.children}</table>,
  };
});

const { fetchNftTdhResults, setScrollPosition } = require('@/components/leaderboard/NFTLeaderboard');

const baseData = [
  {
    consolidation_key: '0x1',
    handle: 'alice',
    consolidation_display: 'Alice',
    pfp_url: '',
    cic_type: undefined,
    level: 1,
    balance: 5,
  },
  {
    consolidation_key: '0x2',
    handle: 'bob',
    consolidation_display: 'Bob',
    pfp_url: '',
    cic_type: undefined,
    level: 1,
    balance: 2,
  },
];

function setup() {
  (fetchNftTdhResults as jest.Mock)
    .mockResolvedValueOnce({ count: baseData.length, data: baseData })
    .mockResolvedValueOnce({ count: baseData.length, data: baseData })
    .mockResolvedValueOnce({ count: baseData.length, data: baseData });

  return render(<MemeLabLeaderboard contract="0x1" nftId={1} />);
}

beforeEach(() => jest.clearAllMocks());

test('renders leaderboard and sorts when caret clicked', async () => {
  const { container } = setup();

  await waitFor(() => expect(fetchNftTdhResults).toHaveBeenCalled());
  expect(setScrollPosition).toHaveBeenCalledTimes(2);
  await screen.findByText('alice');
  await screen.findByText('bob');

  const icons = container.querySelectorAll('svg');
  await userEvent.click(icons[0]);

  await waitFor(() => expect(fetchNftTdhResults).toHaveBeenCalledTimes(3));
  expect(fetchNftTdhResults.mock.calls[2][5]).toBe(SortDirection.ASC);
  expect(setScrollPosition).toHaveBeenCalledTimes(3);
});


test('shows message when no results', async () => {
  (fetchNftTdhResults as jest.Mock)
    .mockResolvedValueOnce({ count: 0, data: [] })
    .mockResolvedValueOnce({ count: 0, data: [] });
  render(<MemeLabLeaderboard contract="0x1" nftId={1} />);
  await screen.findByText('No Results found');
});
