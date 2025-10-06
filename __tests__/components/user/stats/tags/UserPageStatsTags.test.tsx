import React from 'react';
import { render, screen } from '@testing-library/react';
import UserPageStatsTags from '@/components/user/stats/tags/UserPageStatsTags';

const balance = {
  nextgen_balance: 2,
  memes_cards_sets: 3,
  memes_balance: 4,
  unique_memes: 3,
  gradients_balance: 1,
  boost: 5
} as any;

const balanceMemes = [{ season: 1, sets: 2 }];

const seasons = [] as any;

describe('UserPageStatsTags', () => {
  it('renders tags based on balances', () => {
    render(
      <UserPageStatsTags ownerBalance={balance} balanceMemes={balanceMemes} seasons={seasons} />
    );
    expect(screen.getByText(/NextGen x2/)).toBeInTheDocument();
    expect(screen.getByText(/Meme Sets x3/)).toBeInTheDocument();
    expect(screen.getByText(/Memes x4 \(unique x3\)/)).toBeInTheDocument();
    expect(screen.getByText(/Gradients x1/)).toBeInTheDocument();
    expect(screen.getByText(/Boost x5/)).toBeInTheDocument();
    expect(screen.getByText(/SZN1 Sets x2/)).toBeInTheDocument();
  });

  it('renders empty div when no tags', () => {
    const { container } = render(
      <UserPageStatsTags ownerBalance={undefined} balanceMemes={[]} seasons={[]} />
    );
    expect(container.querySelector('div')?.textContent).toBe('');
  });
});
