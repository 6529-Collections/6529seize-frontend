import { render, screen } from '@testing-library/react';
import React from 'react';
import UserPageHeaderStats from '@/components/user/user-page-header/stats/UserPageHeaderStats';

jest.mock('@/components/user/user-page-header/followers/UserPageFollowers', () => (props: any) => {
  capturedProps = props;
  return <div data-testid="followers" />;
});

jest.mock('@/helpers/Helpers', () => ({
  formatNumberWithCommas: (n: number) => `fmt-${n}`
}));

let capturedProps: any = null;

describe('UserPageHeaderStats', () => {
  beforeEach(() => {
    capturedProps = null;
  });

  it('renders TDH and Rep links with numbers and passes follower props', () => {
    const profile: any = { tdh: 10, tdh_rate: 3, xtdh: 5, xtdh_rate: 7, rep: 20 };
    render(
      <UserPageHeaderStats
        profile={profile}
        handleOrWallet="bob"
        followersCount={4}
      />
    );
    expect(screen.getByRole('link', { name: 'fmt-10 TDH' })).toHaveAttribute('href', '/bob/collected');
    expect(screen.getByRole('link', { name: 'fmt-20 Rep' })).toHaveAttribute('href', '/bob/rep');
    expect(screen.getByRole('link', { name: 'fmt-3 TDH Rate' })).toHaveAttribute(
      'href',
      '/bob/stats?activity=tdh-history'
    );
    expect(screen.getByRole('link', { name: 'fmt-5 xTDH' })).toHaveAttribute('href', '/xtdh');
    expect(screen.getByRole('link', { name: 'fmt-7 xTDH Rate' })).toHaveAttribute('href', '/xtdh');
    expect(screen.getByTestId('followers')).toBeInTheDocument();
    expect(capturedProps).toEqual({ handleOrWallet: 'bob', followersCount: 4 });
  });
});
