import { render, screen } from '@testing-library/react';
import React from 'react';
import UserPageFollowers from '@/components/user/user-page-header/followers/UserPageFollowers';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

jest.mock('@/helpers/Helpers', () => ({
  formatNumberWithCommas: (n: number) => `fmt-${n}`,
}));

describe('UserPageFollowers header component', () => {
  it('renders follower count and link', () => {
    render(
      <UserPageFollowers handleOrWallet="alice" followersCount={1} />
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/alice/followers');
    expect(screen.getByText('fmt-1')).toBeInTheDocument();
    expect(screen.getByText('Follower')).toBeInTheDocument();
  });

  it('pluralizes followers correctly', () => {
    render(
      <UserPageFollowers handleOrWallet="alice" followersCount={5} />
    );
    expect(screen.getByText('Followers')).toBeInTheDocument();
  });

  it('defaults to zero when count missing', () => {
    render(
      <UserPageFollowers handleOrWallet="alice" followersCount={null} />
    );
    expect(screen.getByText('fmt-0')).toBeInTheDocument();
  });
});
