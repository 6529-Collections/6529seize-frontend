import React from 'react';
import { render, screen } from '@testing-library/react';
import UserPageHeader from '../../../../components/user/user-page-header/UserPageHeader';
import { AuthContext } from '../../../../components/auth/Auth';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSeizeConnectContext } from '../../../../components/auth/SeizeConnectContext';

jest.mock('next/dynamic', () => () => () => <div />);
jest.mock('../../../../components/user/user-page-header/banner/UserPageHeaderBanner', () => () => <div data-testid="banner" />);
jest.mock('../../../../components/user/user-page-header/pfp/UserPageHeaderPfp', () => () => <div data-testid="pfp" />);
jest.mock('../../../../components/user/user-page-header/pfp/UserPageHeaderPfpWrapper', () => ({ children }: any) => <div data-testid="wrapper">{children}</div>);
jest.mock('../../../../components/user/user-page-header/about/UserPageHeaderAbout', () => () => <div data-testid="about" />);
jest.mock('../../../../components/user/user-page-header/name/UserPageHeaderName', () => () => <div data-testid="name" />);
jest.mock('../../../../components/user/user-page-header/stats/UserPageHeaderStats', () => () => <div data-testid="stats" />);
jest.mock('../../../../components/user/user-page-header/UserPageHeaderProfileEnabledAt', () => () => <div data-testid="enabled" />);
jest.mock('../../../../components/user/utils/UserFollowBtn', () => ({ __esModule: true, default: () => <div data-testid="follow" /> }));
jest.mock('../../../../components/user/utils/level/UserLevel', () => () => <div data-testid="level" />);
jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

const profile: any = { handle: 'bob', level: 1 };
const useParamsMock = useParams as jest.Mock;
const useRouterMock = useRouter as jest.Mock;
(useSeizeConnectContext as jest.Mock).mockReturnValue({ address: '0x1' });
useParamsMock.mockReturnValue({ user: 'bob' });
useRouterMock.mockReturnValue({ push: jest.fn() });

const auth = { connectedProfile: { handle: 'alice' }, activeProfileProxy: null, setToast: jest.fn() } as any;

describe('UserPageHeader', () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReturnValue({
      isFetched: true,
      data: [{ statement_type: 'BIO', statement_group: 'GENERAL' }],
    });
  });

  it('renders follow button and about section', () => {
    render(
      <AuthContext.Provider value={auth}>
        <UserPageHeader profile={profile} mainAddress="0x1" />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('follow')).toBeInTheDocument();
    expect(screen.getByTestId('about')).toBeInTheDocument();
  });
});
