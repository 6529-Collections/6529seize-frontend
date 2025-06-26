import { render, screen } from '@testing-library/react';
import React from 'react';

const mutateAsyncMock = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutateAsync: mutateAsyncMock }),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ query: {}, replace: jest.fn() }),
}));

const setTitleMock = jest.fn();

jest.mock('../../../../components/auth/Auth', () => {
  const React = require('react');
  return {
    AuthContext: React.createContext({
      connectedProfile: { handle: 'bob' },
      activeProfileProxy: false,
      setToast: jest.fn(),
    }),
    useAuth: () => ({ setTitle: setTitleMock }),
  };
});

const invalidateNotifications = jest.fn();
jest.mock('../../../../components/react-query-wrapper/ReactQueryWrapper', () => {
  const React = require('react');
  return { ReactQueryWrapperContext: React.createContext({ invalidateNotifications }) };
});

jest.mock('../../../../components/brain/notifications/NotificationsWrapper', () => ({
  __esModule: true,
  default: () => <div data-testid="wrapper" />,
}));

jest.mock('../../../../components/brain/notifications/NotificationsCauseFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="filter" />,
}));

jest.mock('../../../../components/brain/feed/FeedScrollContainer', () => ({
  FeedScrollContainer: React.forwardRef((props: any, ref) => (
    <div data-testid="scroll" ref={ref} {...props} />
  )),
}));

jest.mock('../../../../components/brain/content/input/BrainContentInput', () => ({
  __esModule: true,
  default: () => <div data-testid="input" />,
}));

jest.mock('../../../../components/brain/my-stream/layout/MyStreamNoItems', () => ({
  __esModule: true,
  default: () => <div data-testid="no-items" />,
}));

const useNotificationsQueryMock = jest.fn();
jest.mock('../../../../hooks/useNotificationsQuery', () => ({
  useNotificationsQuery: () => useNotificationsQueryMock(),
}));

jest.mock('../../../../components/notifications/NotificationsContext', () => ({
  useNotificationsContext: () => ({ removeAllDeliveredNotifications: jest.fn() }),
}));

jest.mock('../../../../components/brain/my-stream/layout/LayoutContext', () => ({
  useLayout: () => ({ notificationsViewStyle: { height: '10px' } }),
}));

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
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import Notifications from '../../../../components/brain/notifications/Notifications';

describe('Notifications component', () => {
  beforeEach(() => {
    mutateAsyncMock.mockClear();
    useNotificationsQueryMock.mockReset();
    setTitleMock.mockClear();
  });

  it('shows loader when fetching and no items', () => {
    useNotificationsQueryMock.mockReturnValue({
      items: [],
      isFetching: true,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
      isInitialQueryDone: false,
    });

    render(<Notifications />);

    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
    expect(mutateAsyncMock).toHaveBeenCalled();
    // Title is set via TitleContext hooks
  });

  it('renders wrapper with items', () => {
    useNotificationsQueryMock.mockReturnValue({
      items: ['a'],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
      isInitialQueryDone: true,
    });

    render(<Notifications />);

    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
  });

  it('shows no items component when query done but empty', () => {
    useNotificationsQueryMock.mockReturnValue({
      items: [],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
      isInitialQueryDone: true,
    });

    render(<Notifications />);

    expect(screen.getByTestId('no-items')).toBeInTheDocument();
  });
});
