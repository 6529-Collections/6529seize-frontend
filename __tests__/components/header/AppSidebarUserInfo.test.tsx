import { render, screen } from '@testing-library/react';
import AppSidebarUserInfo from '@/components/header/AppSidebarUserInfo';
import React from 'react';

jest.mock('@/components/header/AppSidebarUserStats', () => (props: any) => {
  return <div data-testid="stats">{JSON.stringify(props)}</div>;
});

jest.mock('@/components/user/utils/level/UserLevel', () => (props: any) => {
  return <div data-testid="level">{JSON.stringify(props)}</div>;
});

jest.mock('@/components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock('@/components/auth/Auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useIdentity', () => ({
  useIdentity: jest.fn(),
}));

const { useSeizeConnectContext } = require('@/components/auth/SeizeConnectContext');
const { useAuth } = require('@/components/auth/Auth');
const { useIdentity } = require('@/hooks/useIdentity');

function setup(options: any) {
  (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: options.address });
  (useAuth as jest.Mock).mockReturnValue({ activeProfileProxy: options.activeProfileProxy });
  (useIdentity as jest.Mock).mockReturnValue({ profile: options.profile });
  return render(<AppSidebarUserInfo />);
}

describe('AppSidebarUserInfo', () => {
  afterEach(() => jest.clearAllMocks());

  it('uses active profile proxy data when available', () => {
    const proxy = {
      created_by: { handle: 'alice', pfp: 'alice.png', level: 5, tdh: 10, rep: 20 },
    };
    setup({ address: '0x123', activeProfileProxy: proxy, profile: null });

    expect(screen.getByAltText('pfp')).toHaveAttribute('src', 'alice.png');
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByTestId('level')).toHaveTextContent('"level":5');
    const stats = JSON.parse(screen.getByTestId('stats').textContent as string);
    expect(stats.handle).toBe('alice');
    expect(stats.tdh).toBe(10);
    expect(stats.rep).toBe(20);
    expect(stats.profileId).toBeNull();
  });

  it('falls back to profile when no active proxy', () => {
    const profile = { id: 'p1', handle: 'bob', pfp: 'bob.png', level: 3, tdh: 4, rep: 5 };
    setup({ address: '0xabc', activeProfileProxy: null, profile });

    expect(screen.getByAltText('pfp')).toHaveAttribute('src', 'bob.png');
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByTestId('level')).toHaveTextContent('"level":3');
    const stats = JSON.parse(screen.getByTestId('stats').textContent as string);
    expect(stats.handle).toBe('bob');
    expect(stats.tdh).toBe(4);
    expect(stats.rep).toBe(5);
    expect(stats.profileId).toBe('p1');
  });

  it('uses address when no profile data', () => {
    setup({ address: '0xabcdef1234', activeProfileProxy: null, profile: null });

    expect(screen.queryByAltText('pfp')).not.toBeInTheDocument();
    expect(screen.getByText('0xabcd')).toBeInTheDocument();
    const stats = JSON.parse(screen.getByTestId('stats').textContent as string);
    expect(stats.handle).toBe('0xabcdef1234');
    expect(stats.tdh).toBe(0);
    expect(stats.rep).toBe(0);
    expect(stats.profileId).toBeNull();
  });
});
