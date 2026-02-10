import React from 'react';
import { render, screen } from '@testing-library/react';
import VoteBreakdownTooltip from '@/components/waves/drops/participation/ratings/tooltips/VoteBreakdownTooltip';
import { getScaledImageUri } from '@/helpers/image.helpers';

jest.mock('@/helpers/image.helpers', () => ({
  getScaledImageUri: jest.fn(() => 'scaled'),
  ImageScale: { W_AUTO_H_50: 'W_AUTO_H_50' },
}));

describe('VoteBreakdownTooltip', () => {
  const drop = {
    top_raters: [
      { profile: { id: '1', handle: 'alice', pfp: 'a.png' }, rating: 5 },
      { profile: { id: '2', handle: 'bob', pfp: null }, rating: -3 },
    ],
    context_profile_context: { max_rating: 10 },
    wave: { voting_credit_type: 'REP' },
  } as any;

  it('renders voter info and voting power', () => {
    render(
      <VoteBreakdownTooltip drop={drop} ratingsData={{ hasRaters: true, userRating: 2 }} />
    );
    expect(getScaledImageUri).toHaveBeenCalledWith('a.png', 'W_AUTO_H_50');
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('+5')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('-3')).toBeInTheDocument();
    expect(screen.getByText('Voting Range')).toBeInTheDocument();
    expect(screen.getByText('10 REP')).toBeInTheDocument();
    expect(screen.getByText('2 REP')).toBeInTheDocument();
  });

  it('hides sections when data absent', () => {
    const { queryByText } = render(
      <VoteBreakdownTooltip drop={{ ...drop, context_profile_context: null } as any} ratingsData={{ hasRaters: false, userRating: 0 }} />
    );
    expect(queryByText('Top Voters')).toBeNull();
    expect(queryByText('Your Voting Power')).toBeNull();
  });
});
