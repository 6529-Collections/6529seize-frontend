import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import WaveFollowersList from '../../../../components/waves/followers/WaveFollowersList';
import { useWaveFollowers } from '../../../../hooks/useWaveFollowers';

jest.mock('../../../../hooks/useWaveFollowers');
let mockProps: any;
jest.mock('../../../../components/utils/followers/FollowersListWrapper', () => (props: any) => {
  mockProps = props;
  return <div data-testid="wrapper" />;
});

const wave = { id: 'wave1' } as any;
(useWaveFollowers as jest.Mock).mockReturnValue({
  followers: ['a'],
  isFetching: false,
  onBottomIntersection: jest.fn(),
});

describe('WaveFollowersList', () => {
  it('renders wrapper and handles back', async () => {
    const onBackClick = jest.fn();
    const user = userEvent.setup();
    render(<WaveFollowersList wave={wave} onBackClick={onBackClick} />);
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(mockProps.followers).toEqual(['a']);
    await user.click(screen.getByRole('button'));
    expect(onBackClick).toHaveBeenCalled();
  });
});
