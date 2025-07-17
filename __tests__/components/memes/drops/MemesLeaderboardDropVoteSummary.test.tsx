import { render, screen } from '@testing-library/react';
import React from 'react';
import MemesLeaderboardDropVoteSummary from '../../../../components/memes/drops/MemesLeaderboardDropVoteSummary';

jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: any) => <a href={href}>{children}</a> }));
jest.mock('../../../../components/drops/view/utils/DropVoteProgressing', () => ({ __esModule: true, default: () => <div data-testid="progress" /> }));

describe('MemesLeaderboardDropVoteSummary', () => {
  const voter = { profile: { handle: 'bob', pfp: '' }, rating: 2 } as any;
  it('shows positive current value and voter count text', () => {
    render(
      <MemesLeaderboardDropVoteSummary current={5} projected={6} creditType="pts" ratersCount={1} topVoters={[voter]} userContext={null} />
    );
    expect(screen.getByText('5')).toHaveClass('tw-text-emerald-500');
    expect(screen.getByText('voter')).toBeInTheDocument();
  });

  it('shows user vote', () => {
    render(
      <MemesLeaderboardDropVoteSummary current={-1} projected={0} creditType="pts" ratersCount={2} topVoters={[]} userContext={{ rating: -3 } as any} />
    );
    expect(screen.getByText('Your vote:')).toBeInTheDocument();
    expect(screen.getByText('-3')).toBeInTheDocument();
  });
});
