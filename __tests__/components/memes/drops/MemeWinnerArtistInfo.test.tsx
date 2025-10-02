import { render, screen } from '@testing-library/react';
import React from 'react';
import MemeWinnerArtistInfo from '@/components/memes/drops/MemeWinnerArtistInfo';

jest.mock('@/components/waves/drops/winner/WinnerDropBadge', () => () => <div data-testid="badge" />);
jest.mock('@/components/waves/drops/WaveDropAuthorPfp', () => () => <div data-testid="pfp" />);
jest.mock('@/components/user/utils/UserCICAndLevel', () => ({ __esModule: true, default: () => <div data-testid="cic" />, UserCICAndLevelSize:{ SMALL:'SMALL'} }));
jest.mock('@/helpers/Helpers', () => ({ cicToType: () => 'type', getTimeAgoShort: () => '1h' }));

const drop = {
  author: { handle:'artist', level:1, cic:1 },
  wave: { id:'w1', name:'Wave' },
  created_at: '2023',
  winning_context: { decision_time: 't' }
} as any;

describe('MemeWinnerArtistInfo', () => {
  it('shows author and wave info', () => {
    render(<MemeWinnerArtistInfo drop={drop} />);
    expect(screen.getByTestId('pfp')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /artist/i })).toHaveAttribute('href', '/artist');
    expect(screen.getByRole('link', { name: /Wave/i })).toHaveAttribute('href', '/my-stream?wave=w1');
  });

  it('hides wave info when disabled', () => {
    render(<MemeWinnerArtistInfo drop={drop} showWaveInfo={false} />);
    expect(screen.queryByText('Wave')).toBeNull();
  });
});
