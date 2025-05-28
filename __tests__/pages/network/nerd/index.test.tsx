import React from 'react';
import { render, act } from '@testing-library/react';
import { AuthContext } from '../../../../components/auth/Auth';
import { useRouter } from 'next/router';
// Provide our own enum to avoid loading the real component
enum LeaderboardFocus {
  TDH = 'Cards Collected',
  INTERACTIONS = 'Interactions',
}

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

let capturedProps: any;
jest.mock('../../../../components/leaderboard/Leaderboard', () => {
  return {
    __esModule: true,
    LeaderboardFocus,
    default: (props: any) => {
      capturedProps = props;
      return <div data-testid="leaderboard" />;
    },
  };
});

jest.mock('next/router');
const useRouterMock = useRouter as jest.Mock;
const { default: CommunityNerdPage, getServerSideProps } = require('../../../../pages/network/nerd/[[...focus]]');

describe('CommunityNerdPage', () => {
  beforeEach(() => {
    capturedProps = undefined;
    jest.clearAllMocks();
  });

  const renderPage = (focus: LeaderboardFocus) => {
    const setTitle = jest.fn();
    useRouterMock.mockReturnValue({ asPath: '/network/nerd', replace: jest.fn() });
    render(
      <AuthContext.Provider value={{ setTitle, title: '' } as any}>
        <CommunityNerdPage pageProps={{ focus }} />
      </AuthContext.Provider>
    );
    return { setTitle, router: useRouterMock.mock.results[0].value };
  };

  it('passes focus to leaderboard and sets title', () => {
    const { setTitle } = renderPage(LeaderboardFocus.TDH);
    expect(capturedProps.focus).toBe(LeaderboardFocus.TDH);
    expect(setTitle).toHaveBeenCalledWith({ title: 'Network Nerd - Cards Collected' });
  });

  it('updates path when focus changes', () => {
    const { router } = renderPage(LeaderboardFocus.TDH);
    act(() => capturedProps.setFocus(LeaderboardFocus.INTERACTIONS));
    expect(router.replace).toHaveBeenCalledWith('/network/nerd/interactions', undefined, { shallow: true });
  });
});

describe('getServerSideProps', () => {
  it('returns focus based on query', async () => {
    const result = await getServerSideProps({ query: { focus: ['interactions'] } } as any);
    expect(result).toEqual({
      props: {
        focus: LeaderboardFocus.INTERACTIONS,
        metadata: { title: 'Network Nerd - Interactions', description: 'Network' },
      },
    });
  });

  it('defaults to TDH', async () => {
    const result = await getServerSideProps({ query: {} } as any);
    expect(result.props.focus).toBe(LeaderboardFocus.TDH);
  });
});
