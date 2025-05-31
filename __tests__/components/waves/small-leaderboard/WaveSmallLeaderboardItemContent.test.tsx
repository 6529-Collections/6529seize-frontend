import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaveSmallLeaderboardItemContent } from '../../../../components/waves/small-leaderboard/WaveSmallLeaderboardItemContent';

jest.mock('../../../../components/waves/drops/WaveDropPartContentMedias', () => () => <div data-testid="medias" />);
jest.mock('../../../../components/waves/drops/WaveDropPartContentMarkdown', () => () => <div data-testid="markdown" />);

describe('WaveSmallLeaderboardItemContent', () => {
  const baseDrop = { parts: [{ media: [], id: 1 }], metadata: [], mentioned_users: [], referenced_nfts: [], wave: {}, rank: 1 } as any;

  it('calls onDropClick when content clicked', async () => {
    const onDropClick = jest.fn();
    const user = userEvent.setup();
    render(<WaveSmallLeaderboardItemContent drop={baseDrop} onDropClick={onDropClick} />);
    await user.click(screen.getByTestId('markdown').parentElement as HTMLElement);
    expect(onDropClick).toHaveBeenCalled();
  });
});
