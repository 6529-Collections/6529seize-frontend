import React from 'react';
import { render, screen } from '@testing-library/react';
import { WaveLeaderboardDrop } from '../../../../../components/waves/leaderboard/drops/WaveLeaderboardDrop';

jest.mock('../../../../../components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop', () => ({ DefaultWaveLeaderboardDrop: (p:any) => <div data-testid="default">{p.drop.id}</div> }));
jest.mock('../../../../../components/memes/drops/MemesLeaderboardDrop', () => ({ MemesLeaderboardDrop: (p:any) => <div data-testid="memes">{p.drop.id}</div> }));
jest.mock('../../../../../hooks/useWave', () => ({ useWave: jest.fn() }));

const useWave = require('../../../../../hooks/useWave').useWave as jest.Mock;

describe('WaveLeaderboardDrop', () => {
  const wave = { id: 'w' } as any;
  const drop = { id: 'd' } as any;

  it('renders memes drop when wave is memes', () => {
    useWave.mockReturnValue({ isMemesWave: true });
    render(<WaveLeaderboardDrop drop={drop} wave={wave} onDropClick={jest.fn()} />);
    expect(screen.getByTestId('memes')).toHaveTextContent('d');
  });

  it('renders default drop otherwise', () => {
    useWave.mockReturnValue({ isMemesWave: false });
    render(<WaveLeaderboardDrop drop={drop} wave={wave} onDropClick={jest.fn()} />);
    expect(screen.getByTestId('default')).toHaveTextContent('d');
  });
});
