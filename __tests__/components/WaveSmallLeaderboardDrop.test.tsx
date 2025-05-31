import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('../../components/waves/small-leaderboard/MemesWaveSmallLeaderboardDrop', () => ({
  MemesWaveSmallLeaderboardDrop: () => <div>memes</div>,
}));
jest.mock('../../components/waves/small-leaderboard/DefaultWaveSmallLeaderboardDrop', () => ({
  DefaultWaveSmallLeaderboardDrop: () => <div>default</div>,
}));
jest.mock('../../hooks/useWave', () => ({ useWave: jest.fn() }));

const { useWave } = require('../../hooks/useWave');

const { WaveSmallLeaderboardDrop } = require('../../components/waves/small-leaderboard/WaveSmallLeaderboardDrop');

describe('WaveSmallLeaderboardDrop', () => {
  const drop = {} as any;
  const wave = {} as any;
  const onDropClick = jest.fn();

  it('renders Memes component when wave is memes', () => {
    useWave.mockReturnValue({ isMemesWave: true });
    render(<WaveSmallLeaderboardDrop drop={drop} wave={wave} onDropClick={onDropClick} />);
    expect(screen.getByText('memes')).toBeInTheDocument();
  });

  it('renders Default component when wave is not memes', () => {
    useWave.mockReturnValue({ isMemesWave: false });
    render(<WaveSmallLeaderboardDrop drop={drop} wave={wave} onDropClick={onDropClick} />);
    expect(screen.getByText('default')).toBeInTheDocument();
  });
});
