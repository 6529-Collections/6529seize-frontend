import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaveLeaderboardGalleryItem } from '@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItem';

jest.mock('@/components/drops/view/item/content/media/MediaDisplay', () => (props: any) => <div data-testid="media" data-url={props.media_url} />);
jest.mock('@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItemVotes', () => (props: any) => <div data-testid="votes" data-variant={props.variant} />);
jest.mock('@/components/waves/drops/winner/WinnerDropBadge', () => () => <div data-testid="badge" />);
jest.mock('@/components/voting', () => ({
  VotingModal: (props: any) => <div data-testid="modal" data-open={props.isOpen} />,
  MobileVotingModal: (props: any) => <div data-testid="mobile-modal" data-open={props.isOpen} />
}));
jest.mock('@/components/voting/VotingModalButton', () => (props: any) => <button data-testid="vote-btn" onClick={props.onClick} />);
jest.mock('@/hooks/isMobileScreen', () => () => false);
jest.mock('@/hooks/drops/useDropInteractionRules', () => ({
  useDropInteractionRules: () => ({ canShowVote: true })
}));
jest.mock('@/helpers/image.helpers', () => ({ getScaledImageUri: (u: string) => `scaled:${u}`, ImageScale: { AUTOx450: 'x' } }));

describe('WaveLeaderboardGalleryItem', () => {
  const drop: any = {
    parts: [{ media: [{ url: 'img', mime_type: 'image/png' }] }],
    raters_count: 3,
    rank: 1,
    wave: { voting_credit_type: 'NIC' },
    context_profile_context: { rating: 1 },
    author: { handle: 'alice' }
  };

  it('handles click and keyboard events', async () => {
    const onDropClick = jest.fn();
    const { container } = render(<WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />);
    const mainButton = container.querySelector('button:first-of-type')!;
    await userEvent.click(mainButton);
    expect(onDropClick).toHaveBeenCalledWith(drop);
    fireEvent.keyDown(mainButton, { key: 'Enter' });
    expect(onDropClick).toHaveBeenCalledTimes(2);
  });

  it('opens voting modal when vote button clicked', async () => {
    render(<WaveLeaderboardGalleryItem drop={drop} onDropClick={jest.fn()} />);
    expect(screen.getByTestId('modal')).toHaveAttribute('data-open', 'false');
    await userEvent.click(screen.getByTestId('vote-btn'));
    expect(screen.getByTestId('modal')).toHaveAttribute('data-open', 'true');
  });

  it('applies artFocused styles', () => {
    const { container } = render(<WaveLeaderboardGalleryItem drop={drop} onDropClick={jest.fn()} artFocused={false} />);
    expect(container.firstChild).not.toHaveClass('active:tw-bg-iron-900');
  });
});
