import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefaultWaveWinnerDropSmall } from '@/components/waves/winners/DefaultWaveWinnerDropSmall';

jest.mock('@/components/waves/winners/drops/DropContentSmall', () => ({ DropContentSmall: () => <div data-testid="content" /> }));
jest.mock('@/components/waves/winners/WaveWinnersSmallOutcome', () => ({ WaveWinnersSmallOutcome: () => <div data-testid="outcome" /> }));
jest.mock('@/components/waves/drops/winner/WinnerDropBadge', () => ({ __esModule: true, default: (props: any) => <div data-testid="badge">{props.rank}</div> }));

const baseDrop = { rating: 5, raters_count: 1, author: { handle: 'alice', pfp: null }, wave: { voting_credit_type: 'REP' }, parts: [{}], context_profile_context: { rating: 2 }, metadata: [], mentioned_users: [], referenced_nfts: [], created_at: 0 } as any;
const wave = {} as any;

describe('DefaultWaveWinnerDropSmall', () => {
  it('handles click and shows user vote', async () => {
    const onDropClick = jest.fn();
    const user = userEvent.setup();
    const { container } = render(<DefaultWaveWinnerDropSmall drop={baseDrop} wave={wave} onDropClick={onDropClick} />);
    await user.click(container.firstElementChild as HTMLElement);
    expect(onDropClick).toHaveBeenCalled();
  });
});
