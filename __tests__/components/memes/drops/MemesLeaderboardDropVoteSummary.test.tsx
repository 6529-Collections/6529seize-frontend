import { render, screen } from '@testing-library/react';
import React from 'react';
import MemesLeaderboardDropVoteSummary from '@/components/memes/drops/MemesLeaderboardDropVoteSummary';

jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: any) => <a href={href}>{children}</a> }));
jest.mock('@/components/drops/view/utils/DropVoteProgressing', () => ({ __esModule: true, default: () => <div data-testid="progress" /> }));
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => false,
}));

describe('MemesLeaderboardDropVoteSummary', () => {
  const voter = { profile: { handle: 'bob', pfp: '' }, rating: 2 } as any;
  it('shows positive current value and voter count text', () => {
    const drop = {
      id: "drop-1",
      rating: 5,
      rating_prediction: 6,
      raters_count: 1,
      top_raters: [voter],
      wave: { voting_credit_type: "pts" },
      context_profile_context: null,
    } as any;

    render(<MemesLeaderboardDropVoteSummary drop={drop} />);
    expect(screen.getByText('5')).toHaveClass('tw-text-emerald-500');
    expect(
      screen.getByRole("button", {
        name: "View voters and vote log for 1 voter",
      })
    ).toBeInTheDocument();
  });

  it('shows user vote', () => {
    const drop = {
      id: "drop-1",
      rating: -1,
      rating_prediction: 0,
      raters_count: 2,
      top_raters: [],
      wave: { voting_credit_type: "pts" },
      context_profile_context: { rating: -3 },
    } as any;

    render(<MemesLeaderboardDropVoteSummary drop={drop} />);
    expect(screen.getByText('Your vote:')).toBeInTheDocument();
    expect(screen.getByText('-3')).toBeInTheDocument();
  });
});
