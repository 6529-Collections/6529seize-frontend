import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { WaveLeaderboardRightSidebarActivityLogDrop } from '@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLogDrop';
import { useDrop } from '@/hooks/useDrop';

jest.mock('@/hooks/useDrop');

const useDropMock = useDrop as jest.MockedFunction<typeof useDrop>;

const log = { drop_id: '1' } as any;

function setup(returned: any) {
  useDropMock.mockReturnValue(returned);
  const onDropClick = jest.fn();
  render(<WaveLeaderboardRightSidebarActivityLogDrop log={log} onDropClick={onDropClick} />);
  return onDropClick;
}

describe('WaveLeaderboardRightSidebarActivityLogDrop', () => {
  it('uses already available drop', async () => {
    const onClick = setup({ drop: { id: '1' }, prefetchDrop: jest.fn(), refetch: jest.fn() });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onClick).toHaveBeenCalledWith({ id: '1' } as any));
  });

  it('fetches drop when not loaded', async () => {
    const refetch = jest.fn().mockResolvedValue({ data: { id: '2' } });
    const prefetchDrop = jest.fn();
    const onClick = setup({ drop: null, prefetchDrop, refetch });
    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(prefetchDrop).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onClick).toHaveBeenCalledWith({ id: '2' } as any));
    expect(refetch).toHaveBeenCalled();
  });
});
