import React from 'react';
import { render, screen } from '@testing-library/react';
import FollowersListWrapper from '../../../../components/utils/followers/FollowersListWrapper';

jest.mock('../../../../components/utils/followers/FollowersList', () => (props: any) => <div data-testid="list">{props.followers.length}</div>);
jest.mock('../../../../components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  CircleLoaderSize: { XXLARGE: 'XXLARGE' }
}));
jest.mock('../../../../components/utils/CommonIntersectionElement', () => (props: any) => <div data-testid="intersect" onClick={() => props.onIntersection(true)} />);

test('renders list and loader and intersection element', () => {
  const followers = [{ id: '1' }] as any;
  const handleIntersection = jest.fn();
  render(<FollowersListWrapper followers={followers} loading={true} onBottomIntersection={handleIntersection} />);
  expect(screen.getByTestId('list')).toHaveTextContent('1');
  expect(screen.getByTestId('loader')).toBeInTheDocument();
  expect(screen.getByTestId('intersect')).toBeInTheDocument();
});
