import React from 'react';
import { render, screen } from '@testing-library/react';
import UserPageStatsActivityDistributionsTableWrapper from '@/components/user/stats/activity/distributions/UserPageStatsActivityDistributionsTableWrapper';

jest.mock('@/components/utils/animation/CommonCardSkeleton', () => () => <div data-testid="skeleton" />);
jest.mock('@/components/utils/table/paginator/CommonTablePagination', () => (props: any) => <div data-testid="pagination" data-page={props.currentPage} />);
jest.mock('@/components/user/stats/activity/distributions/UserPageStatsActivityDistributionsTable', () => (props: any) => <div data-testid="table" data-count={props.items.length} />);

describe('UserPageStatsActivityDistributionsTableWrapper', () => {
  const profile = { id: 'p' } as any;
  const item = { amount: 1 } as any;

  it('shows skeleton during initial loading', () => {
    render(
      <UserPageStatsActivityDistributionsTableWrapper
        data={[]}
        profile={profile}
        isFirstLoading={true}
        loading={false}
        page={1}
        totalPages={1}
        setPage={jest.fn()}
      />
    );
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders table and pagination when data exists', () => {
    render(
      <UserPageStatsActivityDistributionsTableWrapper
        data={[item]}
        profile={profile}
        isFirstLoading={false}
        loading={true}
        page={1}
        totalPages={2}
        setPage={jest.fn()}
      />
    );
    expect(screen.getByTestId('table')).toHaveAttribute('data-count', '1');
    expect(screen.getByTestId('pagination')).toHaveAttribute('data-page', '1');
  });

  it('shows empty message when list empty', () => {
    render(
      <UserPageStatsActivityDistributionsTableWrapper
        data={[]}
        profile={profile}
        isFirstLoading={false}
        loading={false}
        page={1}
        totalPages={1}
        setPage={jest.fn()}
      />
    );
    expect(screen.getByText('No distributions found')).toBeInTheDocument();
  });
});
