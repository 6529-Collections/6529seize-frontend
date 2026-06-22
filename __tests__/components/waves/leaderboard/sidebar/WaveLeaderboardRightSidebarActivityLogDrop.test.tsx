import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WaveLeaderboardRightSidebarActivityLogDrop } from '@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLogDrop';

function setup() {
  const onDropClick = jest.fn();
  render(
    <WaveLeaderboardRightSidebarActivityLogDrop onDropClick={onDropClick} />
  );
  return onDropClick;
}

describe('WaveLeaderboardRightSidebarActivityLogDrop', () => {
  it('calls the provided drop click handler', () => {
    const onClick = setup();
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('labels the action for the drop in chat', () => {
    setup();
    expect(screen.getByRole('button')).toHaveAttribute(
      'title',
      'View drop in chat'
    );
  });
});
