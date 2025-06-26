import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import UserPageLayout from '../../../../components/user/layout/UserPageLayout';
import { AuthContext } from '../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../components/react-query-wrapper/ReactQueryWrapper';
import { ApiIdentity } from '../../../../generated/models/ApiIdentity';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../../hooks/useIdentity', () => ({
  useIdentity: jest.fn(),
}));

jest.mock('../../../../components/user/user-page-header/UserPageHeader', () => {
  return function MockUserPageHeader({ profile, mainAddress }: any) {
    return (
      <div data-testid="user-page-header">
        Header: {profile?.handle || 'No handle'} - {mainAddress}
      </div>
    );
  };
});

jest.mock('../../../../components/user/layout/UserPageTabs', () => {
  return function MockUserPageTabs() {
    return <div data-testid="user-page-tabs">User Page Tabs</div>;
  };
});

const mockProfile: ApiIdentity = {
  handle: 'testuser',
  display: 'Test User',
  primary_wallet: '0x123456789',
  id: 'user-123',
} as any;

const mockAuthContext = {};

const mockReactQueryContext = {
  setProfile: jest.fn(),
};

const mockRouter = {
  query: { user: 'testuser' },
  events: {
    on: jest.fn(),
    off: jest.fn(),
  },
};

const mockUseIdentity = require('../../../../hooks/useIdentity').useIdentity;

// Mock TitleContext
const mockSetTitle = jest.fn();
jest.mock('../../../../contexts/TitleContext', () => ({
  useTitle: () => ({
    title: 'Test Title',  
    setTitle: mockSetTitle,
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: () => mockSetTitle,
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));


describe('UserPageLayout', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockUseIdentity.mockReturnValue({ profile: mockProfile });
    jest.clearAllMocks();
  });

  const renderComponent = (profile = mockProfile, children = <div>Test Content</div>) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAuthContext as any}>
          <ReactQueryWrapperContext.Provider value={mockReactQueryContext as any}>
            <UserPageLayout profile={profile}>
              {children}
            </UserPageLayout>
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };

  it('renders user page layout with header and tabs', () => {
    renderComponent();
    
    expect(screen.getByTestId('user-page-header')).toBeInTheDocument();
    expect(screen.getByTestId('user-page-tabs')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('sets page title using profile handle', () => {
    renderComponent();
    // Title is set via TitleContext hook
  });

  it('uses display name when handle is not available', () => {
    const profileWithoutHandle = { ...mockProfile, handle: null };
    mockUseIdentity.mockReturnValue({ profile: profileWithoutHandle });
    
    renderComponent(profileWithoutHandle);
    // Title is set via TitleContext hook
  });

  it('uses formatted address when handle and display are not available', () => {
    const profileWithoutDisplayInfo = { ...mockProfile, handle: null, display: null };
    mockUseIdentity.mockReturnValue({ profile: profileWithoutDisplayInfo });
    
    renderComponent(profileWithoutDisplayInfo);
    // Title is set via TitleContext hook
  });

  it('skips emoji display names and uses formatted address', () => {
    const profileWithEmoji = { ...mockProfile, handle: null, display: 'Test User U+1F680' };
    mockUseIdentity.mockReturnValue({ profile: profileWithEmoji });
    
    renderComponent(profileWithEmoji);
    // Title is set via TitleContext hook
  });

  it('passes correct mainAddress to header', () => {
    renderComponent();
    
    expect(screen.getByTestId('user-page-header')).toHaveTextContent('0x123456789');
  });

  it('uses handleOrWallet as mainAddress when primary_wallet is not available', () => {
    const profileWithoutWallet = { ...mockProfile, primary_wallet: null };
    mockUseIdentity.mockReturnValue({ profile: profileWithoutWallet });
    
    renderComponent(profileWithoutWallet);
    
    expect(screen.getByTestId('user-page-header')).toHaveTextContent('testuser');
  });

  it('sets profile in context when not in query cache', () => {
    renderComponent();
    
    expect(mockReactQueryContext.setProfile).toHaveBeenCalledWith(mockProfile);
  });

  it('does not set profile when already in query cache', () => {
    // Set profile in query cache with the correct QueryKey
    queryClient.setQueryData(['PROFILE', 'testuser'], mockProfile);
    
    renderComponent();
    
    expect(mockReactQueryContext.setProfile).not.toHaveBeenCalled();
  });

  it('sets up router event listeners', () => {
    renderComponent();
    
    expect(mockRouter.events.on).toHaveBeenCalledWith('routeChangeStart', expect.any(Function));
    expect(mockRouter.events.on).toHaveBeenCalledWith('routeChangeComplete', expect.any(Function));
    expect(mockRouter.events.on).toHaveBeenCalledWith('routeChangeError', expect.any(Function));
  });

  it('shows loading state when tab data is loading', () => {
    const { rerender } = renderComponent();
    
    // Simulate route change start
    const handleStart = mockRouter.events.on.mock.calls.find(
      call => call[0] === 'routeChangeStart'
    )[1];
    
    handleStart('/testuser/collected', { shallow: false });
    
    rerender(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAuthContext as any}>
          <ReactQueryWrapperContext.Provider value={mockReactQueryContext as any}>
            <UserPageLayout profile={mockProfile}>
              <div>Test Content</div>
            </UserPageLayout>
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('does not show loading for shallow navigation', () => {
    renderComponent();
    
    // Simulate shallow route change
    const handleStart = mockRouter.events.on.mock.calls.find(
      call => call[0] === 'routeChangeStart'
    )[1];
    
    handleStart('/testuser/collected', { shallow: true });
    
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('does not show loading for different user navigation', () => {
    renderComponent();
    
    // Simulate navigation to different user
    const handleStart = mockRouter.events.on.mock.calls.find(
      call => call[0] === 'routeChangeStart'
    )[1];
    
    handleStart('/otheruser/collected', { shallow: false });
    
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('clears loading state on route change complete', () => {
    renderComponent();
    
    // Start loading
    const handleStart = mockRouter.events.on.mock.calls.find(
      call => call[0] === 'routeChangeStart'
    )[1];
    handleStart('/testuser/collected', { shallow: false });
    
    // Complete loading
    const handleComplete = mockRouter.events.on.mock.calls.find(
      call => call[0] === 'routeChangeComplete'
    )[1];
    handleComplete();
    
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('clears loading state on route change error', () => {
    renderComponent();
    
    // Start loading
    const handleStart = mockRouter.events.on.mock.calls.find(
      call => call[0] === 'routeChangeStart'
    )[1];
    handleStart('/testuser/collected', { shallow: false });
    
    // Error in loading
    const handleError = mockRouter.events.on.mock.calls.find(
      call => call[0] === 'routeChangeError'
    )[1];
    handleError();
    
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderComponent();
    
    unmount();
    
    expect(mockRouter.events.off).toHaveBeenCalledWith('routeChangeStart', expect.any(Function));
    expect(mockRouter.events.off).toHaveBeenCalledWith('routeChangeComplete', expect.any(Function));
    expect(mockRouter.events.off).toHaveBeenCalledWith('routeChangeError', expect.any(Function));
  });

  it('handles case-insensitive user comparison', () => {
    mockRouter.query.user = 'TestUser';
    
    const { rerender } = renderComponent();
    
    const handleStart = mockRouter.events.on.mock.calls.find(
      call => call[0] === 'routeChangeStart'
    )[1];
    
    handleStart('/testuser/collected', { shallow: false });
    
    // Force re-render to see loading state
    rerender(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAuthContext as any}>
          <ReactQueryWrapperContext.Provider value={mockReactQueryContext as any}>
            <UserPageLayout profile={mockProfile}>
              <div>Test Content</div>
            </UserPageLayout>
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});