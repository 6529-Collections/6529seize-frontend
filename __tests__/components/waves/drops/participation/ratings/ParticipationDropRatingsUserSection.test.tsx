import { render, screen } from '@testing-library/react';
import React from 'react';
import ParticipationDropRatingsUserSection from '../../../../../../components/waves/drops/participation/ratings/ParticipationDropRatingsUserSection';

describe('ParticipationDropRatingsUserSection', () => {
  const drop: any = { wave: { voting_credit_type: 'TDH' } };

  it('returns null when no user rating', () => {
    const { container } = render(
      <ParticipationDropRatingsUserSection drop={drop} userTheme={{ indicator: 'i', text: 't' }} ratingsData={{ userRating: 0 }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows rating when user has voted', () => {
    render(
      <ParticipationDropRatingsUserSection drop={drop} userTheme={{ indicator: 'i', text: 't' }} ratingsData={{ userRating: 5 }} />
    );
    expect(screen.getByText('Your votes')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('TDH')).toBeInTheDocument();
  });
});
