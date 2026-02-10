import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemesWaveWinnerDropSmall } from '@/components/waves/winners/MemesWaveWinnerDropSmall';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, onClick, className }: any) => <a href={href} onClick={onClick} className={className}>{children}</a> }));
jest.mock('@/helpers/Helpers', () => ({ formatNumberWithCommas: (n: number) => String(n) }));
jest.mock('@/helpers/image.helpers', () => ({ getScaledImageUri: (u: string) => 'scaled-' + u, ImageScale: { W_AUTO_H_50: '50' } }));
jest.mock('@/components/waves/winners/drops/DropContentSmall', () => ({ DropContentSmall: () => <div data-testid='content' /> }));
jest.mock('@/components/waves/winners/WaveWinnersSmallOutcome', () => ({ WaveWinnersSmallOutcome: () => <div data-testid='outcome' /> }));
jest.mock('@/components/waves/drops/winner/WinnerDropBadge', () => ({ __esModule: true, default: ({ rank }: any) => <div data-testid='badge'>{rank}</div> }));
jest.mock('@/components/waves/drops/time/WaveDropTime', () => ({ __esModule: true, default: () => <span data-testid='time' /> }));

describe('MemesWaveWinnerDropSmall', () => {
  const wave = { voting_credit_type: 'REP' } as any;
  const baseDrop = {
    rank: 1,
    rating: -5,
    raters_count: 2,
    author: { handle: 'alice', pfp: null },
    wave,
    context_profile_context: { rating: -1 },
    created_at: 0,
  } as any;

  it('handles click and displays rank override', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    const { container } = render(<MemesWaveWinnerDropSmall drop={baseDrop} wave={wave} rank={2} onDropClick={onClick} />);

    expect(screen.getByTestId('badge').textContent).toBe('2');
    await user.click(container.firstElementChild as HTMLElement);
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByText('-5').className).toContain('rose');
    expect(screen.getByText('-1 REP').className).toContain('rose');
  });
});
