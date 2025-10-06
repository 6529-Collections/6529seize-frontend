import { render, screen } from '@testing-library/react';
import { WaveWinnerItemSmall } from '@/components/waves/winners/WaveWinnerItemSmall';

jest.mock('@/hooks/useWave', () => ({ useWave: jest.fn(() => ({ isMemesWave: true })) }));
jest.mock('@/components/waves/winners/MemesWaveWinnerDropSmall', () => ({
  MemesWaveWinnerDropSmall: () => <div data-testid="memes" />,
}));
jest.mock('@/components/waves/winners/DefaultWaveWinnerDropSmall', () => ({
  DefaultWaveWinnerDropSmall: () => <div data-testid="default" />,
}));

const drop = { id: 'd', rank: 1, wave: { id: 'w' } } as any;
const wave = { id: 'w' } as any;

describe('WaveWinnerItemSmall', () => {
  it('renders memes component when memes wave', () => {
    render(<WaveWinnerItemSmall drop={drop} wave={wave} onDropClick={jest.fn()} />);
    expect(screen.getByTestId('memes')).toBeInTheDocument();
  });

  it('renders default component otherwise', () => {
    const { useWave } = require('@/hooks/useWave');
    (useWave as jest.Mock).mockReturnValue({ isMemesWave: false });
    render(<WaveWinnerItemSmall drop={drop} wave={wave} onDropClick={jest.fn()} />);
    expect(screen.getByTestId('default')).toBeInTheDocument();
  });
});
