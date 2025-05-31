import React from 'react';
import { render, act } from '@testing-library/react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../../../components/auth/Auth';

enum LeaderboardFocus {
  TDH = 'Cards Collected',
  INTERACTIONS = 'Interactions',
}

// Mock next/router first, before importing anything
jest.mock('next/router', () => ({ useRouter: jest.fn() }));

const routerMock = { asPath: '/network/nerd', replace: jest.fn() };
(useRouter as jest.Mock).mockReturnValue(routerMock);

let capturedProps: any;
jest.mock('next/dynamic', () => () => (props: any) => { capturedProps = props; return <div data-testid="leaderboard" />; });

// Import after mocks are set up
const { default: CommunityNerdPage, getServerSideProps } = require('../../../../pages/network/nerd/[[...focus]]');

describe('CommunityNerdPage', () => {
  beforeEach(() => {
    capturedProps = undefined;
  });

  const renderPage = (focus: LeaderboardFocus) => {
    const setTitle = jest.fn();
    routerMock.replace.mockClear();
    render(
      <AuthContext.Provider value={{ setTitle, title: '' } as any}>
        <CommunityNerdPage pageProps={{ focus }} />
      </AuthContext.Provider>
    );
    return { setTitle, router: routerMock };
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
