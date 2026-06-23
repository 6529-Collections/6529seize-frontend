import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WaveLeaderboardRightSidebarActivityLogDrop } from '@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLogDrop';

const log = { drop_id: '1' } as any;

function setup() {
  const onDropClick = jest.fn();
  render(<WaveLeaderboardRightSidebarActivityLogDrop log={log} onDropClick={onDropClick} />);
  return onDropClick;
}

describe('WaveLeaderboardRightSidebarActivityLogDrop', () => {
  it('calls the activity log drop handler', () => {
    const onClick = setup();
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
