import React from 'react';
import { render, screen } from '@testing-library/react';
import { WaveWinnersDrops } from '../../../../../components/waves/winners/drops/WaveWinnersDrops';

jest.mock('../../../../../components/waves/winners/drops/WaveWinnersDrop', () => ({
  WaveWinnersDrop: (props: any) => <div data-testid={`drop-${props.winner.drop.id}`} />,
}));

describe('WaveWinnersDrops', () => {
  const wave = { id: 'w1' } as any;
  const winners = [{ drop: { id: 'd1' } }, { drop: { id: 'd2' } }] as any;

  it('shows loading bar when loading', () => {
    render(<WaveWinnersDrops wave={wave} winners={[]} onDropClick={jest.fn()} isLoading />);
    expect(document.querySelector(".tw-animate-loading-bar")).toBeInTheDocument();
  });

  it('returns empty fragment when no winners', () => {
    const { container } = render(<WaveWinnersDrops wave={wave} winners={[]} onDropClick={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a drop component for each winner', () => {
    render(<WaveWinnersDrops wave={wave} winners={winners} onDropClick={jest.fn()} />);
    expect(screen.getByTestId('drop-d1')).toBeInTheDocument();
    expect(screen.getByTestId('drop-d2')).toBeInTheDocument();
  });
});
