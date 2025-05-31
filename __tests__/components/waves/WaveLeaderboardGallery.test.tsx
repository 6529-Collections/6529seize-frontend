import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WaveLeaderboardGallery } from '../../../components/waves/leaderboard/gallery/WaveLeaderboardGallery';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('../../../hooks/useWaveDropsLeaderboard', () => ({
  useWaveDropsLeaderboard: jest.fn(),
  WaveDropsLeaderboardSort: { RANK: 'RANK' },
}));
jest.mock('../../../components/waves/leaderboard/gallery/WaveLeaderboardGalleryItem', () => ({
  WaveLeaderboardGalleryItem: ({ drop, onDropClick }: any) => (
    <div data-testid="item" onClick={() => onDropClick(drop)}>{drop.id}</div>
  ),
}));

const { useWaveDropsLeaderboard } = require('../../../hooks/useWaveDropsLeaderboard');

const wave = { id: '1' } as any;
const authValue = { connectedProfile: { handle: 'user' } } as any;

function renderGallery(overrides: any) {
  (useWaveDropsLeaderboard as jest.Mock).mockReturnValue({
    drops: overrides.drops || [],
    fetchNextPage: overrides.fetchNextPage || jest.fn(),
    hasNextPage: overrides.hasNextPage || false,
    isFetching: overrides.isFetching || false,
    isFetchingNextPage: overrides.isFetchingNextPage || false,
  });
  return render(
    <AuthContext.Provider value={authValue}>
      <WaveLeaderboardGallery wave={wave} sort="RANK" onDropClick={overrides.onDropClick || jest.fn()} />
    </AuthContext.Provider>
  );
}

it('shows loading when fetching and no drops', () => {
  renderGallery({ isFetching: true });
  expect(screen.getByText('Loading drops...')).toBeInTheDocument();
});

it('shows empty message when no drops', () => {
  renderGallery({});
  expect(screen.getByText('No drops to show')).toBeInTheDocument();
});

it('renders drops with load more button', () => {
  const fetchNextPage = jest.fn();
  const onDropClick = jest.fn();
  const drops = [
    { id: 'd1', parts: [{ media: [{ url: 'a', mime_type: 'image/jpeg' }] }] },
  ];
  renderGallery({ drops, hasNextPage: true, fetchNextPage, onDropClick });
  expect(screen.getByTestId('item')).toHaveTextContent('d1');
  const button = screen.getByRole('button', { name: 'Load more drops' });
  fireEvent.click(button);
  expect(fetchNextPage).toHaveBeenCalled();
  fireEvent.click(screen.getByTestId('item'));
  expect(onDropClick).toHaveBeenCalledWith(drops[0]);
});
