import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaveSmallLeaderboardItemContent } from '@/components/waves/small-leaderboard/WaveSmallLeaderboardItemContent';
import { MemesSubmissionAdditionalInfoKey } from '@/components/waves/memes/submission/types/OperationalData';

jest.mock('@/components/waves/drops/WaveDropPartContentMedias', () => () => <div data-testid="medias" />);
jest.mock('@/components/waves/drops/WaveDropPartContentMarkdown', () => () => <div data-testid="markdown" />);

describe('WaveSmallLeaderboardItemContent', () => {
  const baseDrop = { parts: [{ media: [], id: 1 }], metadata: [], mentioned_users: [], referenced_nfts: [], wave: {}, rank: 1 } as any;

  it('calls onDropClick when content clicked', async () => {
    const onDropClick = jest.fn();
    const user = userEvent.setup();
    render(<WaveSmallLeaderboardItemContent drop={baseDrop} onDropClick={onDropClick} />);
    await user.click(screen.getByTestId('markdown').parentElement as HTMLElement);
    expect(onDropClick).toHaveBeenCalled();
  });

  it('shows preview image when available instead of media', () => {
    const dropWithPreview = {
      ...baseDrop,
      parts: [{ media: [{ url: 'original.jpg' }], id: 1 }],
      metadata: [{
        data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
        data_value: JSON.stringify({ preview_image: 'https://example.com/preview.jpg' })
      }]
    };
    render(<WaveSmallLeaderboardItemContent drop={dropWithPreview} onDropClick={jest.fn()} />);
    expect(screen.getByRole('img', { name: 'Preview' })).toBeInTheDocument();
    expect(screen.queryByTestId('medias')).not.toBeInTheDocument();
  });

  it('shows original media when no preview image', () => {
    const dropWithMedia = {
      ...baseDrop,
      parts: [{ media: [{ url: 'original.jpg' }], id: 1 }],
    };
    render(<WaveSmallLeaderboardItemContent drop={dropWithMedia} onDropClick={jest.fn()} />);
    expect(screen.getByTestId('medias')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Preview' })).not.toBeInTheDocument();
  });
});
