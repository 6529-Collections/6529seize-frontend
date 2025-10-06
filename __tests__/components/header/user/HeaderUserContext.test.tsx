import React from 'react';
import { render, screen } from '@testing-library/react';
import HeaderUserContext from '@/components/header/user/HeaderUserContext';

const profileMock = jest.fn();
const proxyMock = jest.fn();

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

jest.mock('@/components/header/user/HeaderUserProfile', () => ({
  __esModule: true,
  default: (props: any) => { profileMock(props); return <div data-testid="profile" />; }
}));

jest.mock('@/components/header/user/proxy/HeaderUserProxy', () => ({
  __esModule: true,
  default: (props: any) => { proxyMock(props); return <div data-testid="proxy" />; }
}));

jest.mock('@/components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(),
}));

const { useSeizeConnectContext } = require('@/components/auth/SeizeConnectContext');

describe('HeaderUserContext', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows create profile link when user has no handle', () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: '0xabc' });
    const profile: any = { handle: null };
    render(<HeaderUserContext profile={profile} />);
    expect(screen.getByRole('link', { name: /create profile/i })).toHaveAttribute('href', '/0xabc/identity');
    expect(profileMock).toHaveBeenCalledWith({ profile });
    expect(proxyMock).toHaveBeenCalledWith({ profile });
  });

  it('does not show create profile link when handle exists', () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: '0xabc' });
    const profile: any = { handle: 'alice' };
    render(<HeaderUserContext profile={profile} />);
    expect(screen.queryByRole('link', { name: /create profile/i })).toBeNull();
  });
});
