import { render, screen } from '@testing-library/react';
import React from 'react';
import { WaveWinnersPodiumContent } from '@/components/waves/winners/podium/WaveWinnersPodiumContent';

jest.mock('@/components/waves/winners/podium/WavePodiumItem', () => ({
  __esModule: true,
  WavePodiumItem: (props: any) => <div data-testid={`item-${props.position}`} />,
}));

describe('WaveWinnersPodiumContent', () => {
  it('renders three podium items', () => {
    render(
      <WaveWinnersPodiumContent onDropClick={jest.fn()} firstPlaceWinner={{} as any} secondPlaceWinner={{} as any} thirdPlaceWinner={{} as any} />
    );
    expect(screen.getByTestId('item-first')).toBeInTheDocument();
    expect(screen.getByTestId('item-second')).toBeInTheDocument();
    expect(screen.getByTestId('item-third')).toBeInTheDocument();
  });
});
