import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const mutateAsyncMock = jest.fn();
const requestAuthMock = jest.fn().mockResolvedValue({ success: true });
const setActiveProfileProxyMock = jest.fn().mockResolvedValue(undefined);
const setToastMock = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutateAsync: mutateAsyncMock }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/notifications',
}));

const setTitleMock = jest.fn();

jest.mock('@/components/auth/Auth', () => {
  const React = require('react');
  return {
    AuthContext: React.createContext({
      connectedProfile: { handle: 'bob', id: '1' },
      activeProfileProxy: null,
      fetchingProfile: false,
      requestAuth: requestAuthMock,
      setToast: setToastMock,
      setActiveProfileProxy: setActiveProfileProxyMock,
    }),
    useAuth: () => ({
      setTitle: setTitleMock,
      requestAuth: requestAuthMock,
      setToast: setToastMock,
      setActiveProfileProxy: setActiveProfileProxyMock,
    }),
  };
});

const invalidateNotifications = jest.fn();
jest.mock('@/components/react-query-wrapper/ReactQueryWrapper', () => {
  const React = require('react');
  return { ReactQueryWrapperContext: React.createContext({ invalidateNotifications }) };
});

jest.mock('@/components/brain/notifications/NotificationsWrapper', () => ({
  __esModule: true,
  default: () => <div data-testid="wrapper" />,
}));

jest.mock('@/components/brain/notifications/NotificationsCauseFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="filter" />,
}));

jest.mock('@/components/brain/content/input/BrainContentInput', () => ({
  __esModule: true,
  default: () => <div data-testid="input" />,
}));

jest.mock('@/components/brain/my-stream/layout/MyStreamNoItems', () => ({
  __esModule: true,
  default: () => <div data-testid="no-items" />,
}));

const useNotificationsQueryMock = jest.fn();
jest.mock('@/hooks/useNotificationsQuery', () => ({
  useNotificationsQuery: () => useNotificationsQueryMock(),
}));

jest.mock('@/components/notifications/NotificationsContext', () => ({
  useNotificationsContext: () => ({ removeAllDeliveredNotifications: jest.fn() }),
}));

jest.mock('@/components/brain/my-stream/layout/LayoutContext', () => ({
  useLayout: () => ({ notificationsViewStyle: { height: '10px' } }),
}));

// Mock TitleContext
jest.mock('@/contexts/TitleContext', () => ({
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
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import Notifications from '@/components/brain/notifications';

describe('Notifications component', () => {
  beforeEach(() => {
    mutateAsyncMock.mockClear();
    mutateAsyncMock.mockResolvedValue(undefined);
    useNotificationsQueryMock.mockReset();
    setTitleMock.mockClear();
    requestAuthMock.mockClear();
    requestAuthMock.mockResolvedValue({ success: true });
    setActiveProfileProxyMock.mockClear();
    setActiveProfileProxyMock.mockResolvedValue(undefined);
    setToastMock.mockClear();
  });

  it('shows loader when fetching and no items', async () => {
    useNotificationsQueryMock.mockReturnValue({
      items: [],
      isFetching: true,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn().mockResolvedValue(undefined),
      refetch: jest.fn().mockResolvedValue(undefined),
      isInitialQueryDone: false,
      isSuccess: false,
      error: null,
    });

    render(<Notifications activeDrop={null} setActiveDrop={jest.fn()} />);

    expect(screen.getByText('Loading notifications...', { selector: 'div' })).toBeInTheDocument();
    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled();
    });
    // Title is set via TitleContext hooks
  });

  it('renders wrapper with items', async () => {
    useNotificationsQueryMock.mockReturnValue({
      items: ['a'],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn().mockResolvedValue(undefined),
      refetch: jest.fn().mockResolvedValue(undefined),
      isInitialQueryDone: true,
      isSuccess: true,
      error: null,
    });

    render(<Notifications activeDrop={null} setActiveDrop={jest.fn()} />);

    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled();
    });
  });

  it('shows no items component when query done but empty', async () => {
    useNotificationsQueryMock.mockReturnValue({
      items: [],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn().mockResolvedValue(undefined),
      refetch: jest.fn().mockResolvedValue(undefined),
      isInitialQueryDone: true,
      isSuccess: true,
      error: null,
    });

    render(<Notifications activeDrop={null} setActiveDrop={jest.fn()} />);

    expect(screen.getByTestId('no-items')).toBeInTheDocument();
    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled();
    });
  });
});
