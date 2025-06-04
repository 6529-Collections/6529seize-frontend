import { render } from '@testing-library/react';
import React from 'react';
import ParticipationDropRatingsContainer from '../../../../../../components/waves/drops/participation/ratings/ParticipationDropRatingsContainer';
import { getThemeColors } from '../../../../../../components/waves/drops/participation/ratings/ParticipationDropRatingsTheme';

let totalProps: any;
let voterProps: any;
let userProps: any;

jest.mock('../../../../../../components/waves/drops/participation/ratings/ParticipationDropRatingsTotalSection', () => (props: any) => {
  totalProps = props;
  return <div data-testid="total" />;
});

jest.mock('../../../../../../components/waves/drops/participation/ratings/ParticipationDropRatingsVoterSection', () => (props: any) => {
  voterProps = props;
  return <div data-testid="voter" />;
});

jest.mock('../../../../../../components/waves/drops/participation/ratings/ParticipationDropRatingsUserSection', () => (props: any) => {
  userProps = props;
  return <div data-testid="user" />;
});

jest.mock('../../../../../../components/waves/drops/participation/ratings/ParticipationDropRatingsTheme', () => ({
  getThemeColors: jest.fn(() => ({ ring: 'r', text: 't' })),
}));

describe('ParticipationDropRatingsContainer', () => {
  it('passes computed props to sections', () => {
    const drop = { top_raters: [], context_profile_context: null, rating: 5, wave: {} } as any;
    render(<ParticipationDropRatingsContainer drop={drop} rank={2} />);
    expect(getThemeColors).toHaveBeenCalled();
    expect(totalProps.drop).toBe(drop);
    expect(voterProps.drop).toBe(drop);
    expect(userProps.drop).toBe(drop);
    expect(totalProps.ratingsData.currentRating).toBe(5);
  });
});
