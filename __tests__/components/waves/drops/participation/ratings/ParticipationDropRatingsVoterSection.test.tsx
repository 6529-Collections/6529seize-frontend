import { render, screen } from '@testing-library/react';
import React from 'react';
import ParticipationDropRatingsVoterSection from '../../../../../../components/waves/drops/participation/ratings/ParticipationDropRatingsVoterSection';

jest.mock('@tippyjs/react', () => ({ children, content }: any) => <div data-testid="tippy">{children}</div>);

const drop = {
  top_raters: Array.from({ length: 6 }).map((_, i) => ({
    rating: i + 1,
    profile: { id: `p${i}`, handle: `user${i}`, pfp: `pfp${i}.jpg` },
  })),
  raters_count: 6,
  wave: { voting_credit_type: 'CRED' },
} as any;

const theme = { ring: 'ring', text: 'text' };

const ratingsData = { hasRaters: true } as any;

describe('ParticipationDropRatingsVoterSection', () => {
  it('renders raters and extra count', () => {
    render(
      <ParticipationDropRatingsVoterSection drop={drop} theme={theme} ratingsData={ratingsData} rank={1} />
    );
    expect(screen.getAllByAltText(/avatar/)).toHaveLength(5);
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Voters')).toBeInTheDocument();
  });
});
