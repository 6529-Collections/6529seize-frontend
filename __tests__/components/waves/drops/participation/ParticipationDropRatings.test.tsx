import { render, screen } from '@testing-library/react';
import React from 'react';
import { ParticipationDropRatings } from '../../../../../components/waves/drops/participation/ParticipationDropRatings';

const mockContainer = jest.fn(() => <div data-testid="container" />);

jest.mock('../../../../../components/waves/drops/participation/ratings/ParticipationDropRatingsContainer', () => (props: any) => {
  mockContainer(props);
  return <div data-testid="container" />;
});

describe('ParticipationDropRatings', () => {
  it('forwards props to container', () => {
    const drop = { id: 'd1' } as any;
    render(<ParticipationDropRatings drop={drop} rank={5} />);
    expect(screen.getByTestId('container')).toBeInTheDocument();
    expect(mockContainer).toHaveBeenCalledWith({ drop, rank: 5 });
  });
});
