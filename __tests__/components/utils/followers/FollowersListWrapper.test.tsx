import { render, screen } from '@testing-library/react';
import React from 'react';
import FollowersListWrapper from '../../../../components/utils/followers/FollowersListWrapper';

jest.mock('../../../../components/utils/followers/FollowersList', () => (props: any) => <div data-testid="list">{props.followers.length}</div>);
jest.mock('../../../../components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  CircleLoaderSize: { XXLARGE: 'xxl' }
}));
jest.mock('../../../../components/utils/CommonIntersectionElement', () => ({
  __esModule: true,
  default: (props: any) => {
    React.useEffect(() => props.onIntersection(true), [props.onIntersection]);
    return <div data-testid="intersector" />;
  }
}));

describe('FollowersListWrapper', () => {
  it('renders followers and loader', () => {
    const cb = jest.fn();
    render(<FollowersListWrapper followers={[{ id: '1' } as any]} loading={true} onBottomIntersection={cb} />);
    expect(screen.getByTestId('list').textContent).toBe('1');
    expect(screen.getByTestId('loader')).toBeInTheDocument();
    expect(cb).toHaveBeenCalledWith(true);
  });

  it('hides loader when not loading', () => {
    render(<FollowersListWrapper followers={[]} loading={false} onBottomIntersection={() => {}} />);
    expect(screen.queryByTestId('loader')).toBeNull();
  });
});
