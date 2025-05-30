import React from 'react';
import { render, screen } from '@testing-library/react';
import { ApiIdentityAndSubscriptionActions } from '../../../../generated/models/ApiIdentityAndSubscriptionActions';

// Mock the Follower component
const Follower = jest.fn(({ follower }: any) => <div data-testid="follower">{follower.identity.handle}</div>);
jest.mock('../../../../components/utils/followers/Follower', () => ({ __esModule: true, default: Follower }));

// Mock UserCICAndLevel and its dependencies that might be causing the issue
jest.mock('../../../../components/user/utils/UserCICAndLevel', () => ({
  __esModule: true,
  default: ({ level, cicType }: any) => <div data-testid="user-cic-level">{level}</div>,
  UserCICAndLevelSize: {
    SMALL: 'SMALL',
    MEDIUM: 'MEDIUM',
    LARGE: 'LARGE',
    XLARGE: 'XLARGE',
  },
}));

// Mock cicToType helper
jest.mock('../../../../helpers/Helpers', () => ({
  cicToType: jest.fn(() => 'UNKNOWN'),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

import FollowersList from '../../../../components/utils/followers/FollowersList';

describe('FollowersList', () => {
  it('renders follower items', () => {
    const followers: ApiIdentityAndSubscriptionActions[] = [
      { identity: { id: '1', handle: 'a' } } as any,
      { identity: { id: '2', handle: 'b' } } as any,
    ];
    render(<FollowersList followers={followers} />);
    expect(Follower).toHaveBeenCalledTimes(2);
    expect(screen.getAllByTestId('follower').length).toBe(2);
  });
});
