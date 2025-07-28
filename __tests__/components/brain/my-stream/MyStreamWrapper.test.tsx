import { render, screen } from '@testing-library/react';
import React from 'react';
import MyStreamWrapper from '../../../../components/brain/my-stream/MyStreamWrapper';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));

let query: any = {};
const push = jest.fn();

const useMyStreamQueryMock = jest.fn();
const usePollingQueryMock = jest.fn();

jest.mock('../../../../hooks/useMyStreamQuery', () => ({
  useMyStreamQuery: (...args: any[]) => useMyStreamQueryMock(...args),
  usePollingQuery: (...args: any[]) => usePollingQueryMock(...args),
}));

let streamProps: any;
jest.mock('../../../../components/brain/my-stream/MyStream', () => ({
  __esModule: true,
  default: (props: any) => { streamProps = props; return <div data-testid="stream"/>; }
}));

jest.mock('../../../../components/brain/my-stream/MyStreamWave', () => ({
  __esModule: true,
  default: ({ waveId }: any) => <div data-testid="wave">{waveId}</div>
}));

jest.mock('../../../../components/brain/content/BrainContent', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="content">{children}</div>
}));

jest.mock('../../../../components/auth/Auth', () => ({
  AuthContext: React.createContext({ setTitle: jest.fn() }),
  TitleType: { MY_STREAM: 'MY_STREAM' }
}));

const { useRouter } = require('next/router');

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


beforeEach(() => {
  query = {};
  push.mockReset();
  (useRouter as jest.Mock).mockReturnValue({ query, push });
  useMyStreamQueryMock.mockReturnValue({
    items: [], fetchNextPage: fetchNextPageMock, hasNextPage: true,
    isFetching: false, isFetchingNextPage: false, status: 'success',
    refetch: refetchMock, isInitialQueryDone: true
  });
  usePollingQueryMock.mockReturnValue({ haveNewItems: false });
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
});

const fetchNextPageMock = jest.fn();
const refetchMock = jest.fn();

describe('MyStreamWrapper', () => {
  it('renders MyStreamWave when wave query present', () => {
    query.wave = '123';
    render(<MyStreamWrapper />);
    expect(screen.getByTestId('wave')).toHaveTextContent('123');
    expect(screen.queryByTestId('stream')).toBeNull();
  });

  it('renders MyStream and triggers fetch on bottom intersection', () => {
    render(<MyStreamWrapper />);
    expect(screen.getByTestId('stream')).toBeInTheDocument();
    streamProps.onBottomIntersection(true);
    expect(fetchNextPageMock).toHaveBeenCalled();
  });

  it('passes haveNewItems to MyStream component when new items available', () => {
    usePollingQueryMock.mockReturnValue({ haveNewItems: true });
    render(<MyStreamWrapper />);
    expect(streamProps.haveNewItems).toBe(true);
  });
});
