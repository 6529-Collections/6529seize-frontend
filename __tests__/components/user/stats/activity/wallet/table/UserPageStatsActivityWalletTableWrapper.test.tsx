import React from 'react';
import { render, screen } from '@testing-library/react';
import UserPageStatsActivityWalletTableWrapper from '@/components/user/stats/activity/wallet/table/UserPageStatsActivityWalletTableWrapper';
import { UserPageStatsActivityWalletFilterType } from '@/components/user/stats/activity/wallet/UserPageStatsActivityWallet';

jest.mock('@/components/user/stats/activity/wallet/filter/UserPageStatsActivityWalletFilter', () => (props: any) => (
  <div data-testid="filter" data-active={props.activeFilter} />
));

jest.mock('@/components/user/stats/activity/wallet/table/UserPageStatsActivityWalletTable', () => () => <div data-testid="table" />);

jest.mock('@/components/utils/table/paginator/CommonTablePagination', () => (props: any) => (
  <div data-testid="pagination" data-page={props.currentPage} data-total={props.totalPages} />
));

jest.mock('@/components/utils/animation/CommonCardSkeleton', () => () => <div data-testid="skeleton" />);

jest.mock('@/components/distribution-plan-tool/common/CircleLoader', () => () => <div data-testid="loader" />);

describe('UserPageStatsActivityWalletTableWrapper', () => {
  const profile = { id: 'p' } as any;
  const meme = { id: 1 } as any;
  const collection = { id: 1 } as any;
  const tx = { id: 1 } as any;

  it('shows skeleton during initial load', () => {
    render(
      <UserPageStatsActivityWalletTableWrapper
        filter={UserPageStatsActivityWalletFilterType.ALL}
        profile={profile}
        transactions={[]}
        memes={[]}
        nextgenCollections={[]}
        totalPages={1}
        page={1}
        isFirstLoading={true}
        loading={false}
        setPage={jest.fn()}
        onActiveFilter={jest.fn()}
      />
    );
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders table and pagination when data available', () => {
    render(
      <UserPageStatsActivityWalletTableWrapper
        filter={UserPageStatsActivityWalletFilterType.ALL}
        profile={profile}
        transactions={[tx]}
        memes={[meme]}
        nextgenCollections={[collection]}
        totalPages={2}
        page={1}
        isFirstLoading={false}
        loading={true}
        setPage={jest.fn()}
        onActiveFilter={jest.fn()}
      />
    );
    expect(screen.getByTestId('filter')).toHaveAttribute('data-active', UserPageStatsActivityWalletFilterType.ALL);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toBeInTheDocument();
    expect(screen.getByTestId('pagination')).toHaveAttribute('data-total', '2');
  });

  it('shows no data message when list empty', () => {
    render(
      <UserPageStatsActivityWalletTableWrapper
        filter={UserPageStatsActivityWalletFilterType.MINTS}
        profile={profile}
        transactions={[]}
        memes={[]}
        nextgenCollections={[]}
        totalPages={1}
        page={1}
        isFirstLoading={false}
        loading={false}
        setPage={jest.fn()}
        onActiveFilter={jest.fn()}
      />
    );
    expect(screen.getByText('No mints')).toBeInTheDocument();
  });
});
