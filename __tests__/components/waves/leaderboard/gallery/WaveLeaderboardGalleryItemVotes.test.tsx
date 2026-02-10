import React from 'react';
import { render, screen } from '@testing-library/react';
import WaveLeaderboardGalleryItemVotes from '@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItemVotes';

jest.mock('@/components/drops/view/utils/DropVoteProgressing', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="progress" data-current={props.current} data-projected={props.projected} data-subtle={props.subtle} />,
}));

describe('WaveLeaderboardGalleryItemVotes', () => {
  it('uses bright colors for default variant', () => {
    const drop: any = { rating: 5, rating_prediction: 6 };
    render(<WaveLeaderboardGalleryItemVotes drop={drop} />);
    expect(screen.getByText('5')).toHaveClass('tw-text-emerald-500');
    const progress = screen.getByTestId('progress');
    expect(progress.getAttribute('data-current')).toBe('5');
    expect(progress.getAttribute('data-projected')).toBe('6');
    expect(progress.getAttribute('data-subtle')).toBe('false');
  });

  it('uses subtle coloring when variant is subtle and rating negative', () => {
    const drop: any = { rating: -2, rating_prediction: -1 };
    render(<WaveLeaderboardGalleryItemVotes drop={drop} variant="subtle" />);
    expect(screen.getByText('-2')).toHaveClass('tw-text-iron-400');
    expect(screen.getByTestId('progress').getAttribute('data-subtle')).toBe('true');
  });
});
