import React from 'react';
import { render, screen } from '@testing-library/react';
import { WaveWinnersDrop } from '../../../../../components/waves/winners/drops/WaveWinnersDrop';

jest.mock('../../../../../components/waves/winners/drops/DefaultWaveWinnerDrop', () => ({ DefaultWaveWinnersDrop: (p:any) => <div data-testid="default">{p.winner.drop.id}</div> }));
jest.mock('../../../../../components/waves/winners/drops/MemesWaveWinnerDrop', () => ({ MemesWaveWinnersDrop: (p:any) => <div data-testid="memes">{p.winner.drop.id}</div> }));
jest.mock('../../../../../hooks/useWave', () => ({ useWave: jest.fn() }));

const useWave = require('../../../../../hooks/useWave').useWave as jest.Mock;

describe('WaveWinnersDrop', () => {
  const wave = { id: 'w' } as any;
  const winner = { drop: { id: 'd' } } as any;

  it('renders memes winner when memes wave', () => {
    useWave.mockReturnValue({ isMemesWave: true });
    render(<WaveWinnersDrop winner={winner} wave={wave} onDropClick={jest.fn()} />);
    expect(screen.getByTestId('memes')).toHaveTextContent('d');
  });

  it('renders default winner otherwise', () => {
    useWave.mockReturnValue({ isMemesWave: false });
    render(<WaveWinnersDrop winner={winner} wave={wave} onDropClick={jest.fn()} />);
    expect(screen.getByTestId('default')).toHaveTextContent('d');
  });
});
