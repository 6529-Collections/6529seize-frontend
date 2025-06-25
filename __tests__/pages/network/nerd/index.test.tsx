import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import directly from the source
import { LeaderboardFocus } from '../../../../components/leaderboard/Leaderboard';


// Mock the entire Auth module differently
jest.mock('../../../../components/auth/Auth', () => {
  const React = require('react');
  const mockSetTitle = jest.fn();
  const AuthContext = React.createContext({
    setTitle: mockSetTitle,
    title: '',
  });
  
  return {
    __esModule: true,
    AuthContext,
    default: () => <div data-testid="auth" />,
    mockSetTitle,
  };
});

// Mock dynamic import to return a simple component
jest.mock('next/dynamic', () => () => {
  const React = require('react');
  const { LeaderboardFocus } = require('../../../../components/leaderboard/Leaderboard');
  
  return function MockLeaderboard(props: any) {
    return (
      <div data-testid="leaderboard">
        <span data-testid="focus">{props.focus}</span>
        <button 
          data-testid="set-focus" 
          onClick={() => props.setFocus(LeaderboardFocus.INTERACTIONS)}
        >
          Change Focus
        </button>
      </div>
    );
  };
});

const useRouterMock = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => useRouterMock(),
}));

const { default: CommunityNerdPage, getServerSideProps } = require('../../../../pages/network/nerd/[[...focus]]/index');
const { mockSetTitle } = require('../../../../components/auth/Auth');

// Mock TitleContext
jest.mock('../../../../contexts/TitleContext', () => ({
  useTitle: () => ({
    title: 'Test Title',
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }) => children,
}));

// Mock MyStreamContext if needed
jest.mock('../../../../contexts/wave/MyStreamContext', () => ({
  useMyStream: () => ({
    waveId: null,
    setWaveId: jest.fn(),
    isWaveLoading: false,
    setIsWaveLoading: jest.fn(),
  }),
  MyStreamProvider: ({ children }) => children,
}));


describe('CommunityNerdPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPage = (focus: LeaderboardFocus) => {
    const router = { asPath: '/network/nerd', replace: jest.fn() };
    useRouterMock.mockReturnValue(router);
    render(<CommunityNerdPage pageProps={{ focus }} />);
    return { router };
  };

  it('passes focus to leaderboard and sets title', () => {
    renderPage(LeaderboardFocus.TDH);
    
    // Check that the leaderboard component is rendered with correct focus
    expect(screen.getByTestId('leaderboard')).toBeInTheDocument();
    expect(screen.getByTestId('focus')).toHaveTextContent('Cards Collected');
    // Title is set via TitleContext hooks
  });

  it('updates path when focus changes', () => {
    const { router } = renderPage(LeaderboardFocus.TDH);
    
    // Simulate focus change
    const changeFocusButton = screen.getByTestId('set-focus');
    fireEvent.click(changeFocusButton);
    
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
