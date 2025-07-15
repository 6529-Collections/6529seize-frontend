import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WaveleaderboardSort } from '../../../../../components/waves/leaderboard/header/WaveleaderboardSort';
import { WaveDropsLeaderboardSort } from '../../../../../hooks/useWaveDropsLeaderboard';

describe('WaveleaderboardSort', () => {
  it('highlights active sort and triggers changes', async () => {
    const onSortChange = jest.fn();
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <WaveleaderboardSort
          sort={WaveDropsLeaderboardSort.RANK}
          onSortChange={onSortChange}
        />
      </QueryClientProvider>
    );

    const current = screen.getByText('Current Vote');
    expect(current.className).toContain('tw-bg-iron-800');

    await user.click(screen.getByText('Projected Vote'));
    expect(onSortChange).toHaveBeenCalledWith(
      WaveDropsLeaderboardSort.RATING_PREDICTION
    );

    await user.click(screen.getByText('Newest'));
    expect(onSortChange).toHaveBeenCalledWith(
      WaveDropsLeaderboardSort.CREATED_AT
    );
  });
});
