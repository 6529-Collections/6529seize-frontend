import { render, screen } from '@testing-library/react';
import React from 'react';
import { WaveWinnersPodium } from '../../../../../components/waves/winners/podium/WaveWinnersPodium';
import { ExtendedDrop } from '../../../../../helpers/waves/drop.helpers';
import { ApiWaveDecisionWinner } from '../../../../../generated/models/ApiWaveDecisionWinner';

jest.mock('../../../../../components/waves/winners/podium/WaveWinnersLoading', () => ({ WaveWinnersLoading: () => <div data-testid="loading" /> }));
jest.mock('../../../../../components/waves/winners/podium/WaveWinnersEmpty', () => ({ WaveWinnersEmpty: () => <div data-testid="empty" /> }));
let contentProps: any;
jest.mock('../../../../../components/waves/winners/podium/WaveWinnersPodiumContent', () => ({ WaveWinnersPodiumContent: (props: any) => { contentProps = props; return <div data-testid="content" />; } }));

describe('WaveWinnersPodium', () => {
  const drop = { id: 'd' } as ExtendedDrop;
  const winners: ApiWaveDecisionWinner[] = [
    { drop } as any,
    { drop } as any,
    { drop } as any,
  ];

  it('shows loading', () => {
    render(<WaveWinnersPodium onDropClick={jest.fn()} winners={[]} isLoading={true} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(<WaveWinnersPodium onDropClick={jest.fn()} winners={[]} isLoading={false} />);
    expect(screen.getByTestId('empty')).toBeInTheDocument();
  });

  it('passes winners to content', () => {
    const onClick = jest.fn();
    render(<WaveWinnersPodium onDropClick={onClick} winners={winners} isLoading={false} />);
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(contentProps.firstPlaceWinner).toBe(winners[0]);
    expect(contentProps.secondPlaceWinner).toBe(winners[1]);
    expect(contentProps.thirdPlaceWinner).toBe(winners[2]);
    expect(contentProps.onDropClick).toBe(onClick);
  });
});

