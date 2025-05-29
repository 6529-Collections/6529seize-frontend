import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDebounce } from 'react-use';
import { AuthContext } from '../../../../components/auth/Auth';
import UserPageWaves from '../../../../components/user/waves/UserPageWaves';
import { ApiIdentity } from '../../../../generated/models/ApiIdentity';
import { ApiWave } from '../../../../generated/models/ApiWave';
import { createMockAuthContext } from '../../../utils/testContexts';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn(),
}));
jest.mock('react-use', () => ({
  useDebounce: jest.fn((fn, delay) => fn()),
}));

jest.mock('../../../../components/user/waves/UserPageWavesSearch', () => 
  function MockSearch(props: any) {
    return (
      <div data-testid="waves-search">
        {props.showCreateNewWaveButton && (
          <button onClick={props.onCreateNewWave} data-testid="create-wave-btn">
            Create Wave
          </button>
        )}
        <input
          data-testid="wave-name-input"
          value={props.waveName || ''}
          onChange={(e) => props.setWaveName(e.target.value || null)}
        />
      </div>
    );
  }
);

jest.mock('../../../../components/waves/list/WaveItem', () => 
  function MockWaveItem({ wave }: { wave: ApiWave }) {
    return <div data-testid={`wave-${wave.id}`}>{wave.name}</div>;
  }
);

jest.mock('../../../../components/distribution-plan-tool/common/CircleLoader', () => 
  function MockLoader() {
    return <div data-testid="loader" />;
  }
);

jest.mock('../../../../components/utils/CommonIntersectionElement', () => 
  function MockIntersection({ onIntersection }: any) {
    return (
      <div 
        data-testid="intersection" 
        onClick={() => onIntersection(true)}
      />
    );
  }
);

const mockWaves: ApiWave[] = [
  { id: '1', name: 'Wave 1', serial_no: 100 } as ApiWave,
  { id: '2', name: 'Wave 2', serial_no: 99 } as ApiWave,
  { id: '3', name: 'Wave 3', serial_no: 98 } as ApiWave,
];

describe('UserPageWaves', () => {
  const useRouterMock = useRouter as jest.Mock;
  const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;
  const mockPush = jest.fn();
  const mockRequestAuth = jest.fn();

  const mockProfile: ApiIdentity = {
    handle: 'testuser',
  } as ApiIdentity;

  beforeEach(() => {
    useRouterMock.mockReturnValue({
      push: mockPush,
    });

    useInfiniteQueryMock.mockImplementation(({ enabled }) => ({
      data: enabled ? { pages: [mockWaves] } : undefined,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      status: enabled ? 'success' : 'idle',
    }));

    mockRequestAuth.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (authOverrides = {}, profileOverrides = {}) => {
    const authContext = createMockAuthContext({
      requestAuth: mockRequestAuth,
      ...authOverrides,
    });

    const profile = { ...mockProfile, ...profileOverrides };

    return render(
      <AuthContext.Provider value={authContext}>
        <UserPageWaves profile={profile} />
      </AuthContext.Provider>
    );
  };

  it.skip('renders waves search component', () => {
    renderComponent();
    expect(screen.getByTestId('waves-search')).toBeTruthy();
  });

  it.skip('displays waves in grid layout', () => {
    renderComponent();
    expect(screen.getByTestId('wave-1')).toBeTruthy();
    expect(screen.getByTestId('wave-2')).toBeTruthy();
    expect(screen.getByTestId('wave-3')).toBeTruthy();
  });

  it.skip('shows create wave button for connected user viewing own profile', () => {
    renderComponent({
      connectedProfile: { ...createMockAuthContext().connectedProfile, handle: 'testuser' },
      activeProfileProxy: null,
    });

    expect(screen.getByTestId('create-wave-btn')).toBeInTheDocument();
  });

  it.skip('hides create wave button when viewing different user profile', () => {
    renderComponent({
      connectedProfile: { ...createMockAuthContext().connectedProfile, handle: 'otheruser' },
      activeProfileProxy: null,
    });

    expect(screen.queryByTestId('create-wave-btn')).not.toBeInTheDocument();
  });

  it.skip('hides create wave button when using proxy', () => {
    renderComponent({
      connectedProfile: { ...createMockAuthContext().connectedProfile, handle: 'testuser' },
      activeProfileProxy: { id: 'proxy1' },
    });

    expect(screen.queryByTestId('create-wave-btn')).not.toBeInTheDocument();
  });

  it.skip('hides create wave button when not connected', () => {
    renderComponent({
      connectedProfile: null,
      activeProfileProxy: null,
    });

    expect(screen.queryByTestId('create-wave-btn')).not.toBeInTheDocument();
  });

  it.skip('uses authenticated waves endpoint when connected and no proxy', () => {
    renderComponent({
      connectedProfile: { ...createMockAuthContext().connectedProfile, handle: 'testuser' },
      activeProfileProxy: null,
    });

    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['WAVES']),
        enabled: true,
      })
    );
  });

  it.skip('uses public waves endpoint when not connected', () => {
    renderComponent({
      connectedProfile: null,
      activeProfileProxy: null,
    });

    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['WAVES_PUBLIC']),
        enabled: true,
      })
    );
  });

  it.skip('uses public waves endpoint when using proxy', () => {
    renderComponent({
      connectedProfile: { ...createMockAuthContext().connectedProfile, handle: 'testuser' },
      activeProfileProxy: { id: 'proxy1' },
    });

    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['WAVES_PUBLIC']),
        enabled: true,
      })
    );
  });

  it.skip('handles wave name search', async () => {
    renderComponent();
    
    const input = screen.getByTestId('wave-name-input');
    fireEvent.change(input, { target: { value: 'test wave' } });

    expect(input).toHaveValue('test wave');
  });

  it.skip('navigates to create wave page when create button clicked', async () => {
    renderComponent({
      connectedProfile: { ...createMockAuthContext().connectedProfile, handle: 'testuser' },
      activeProfileProxy: null,
    });

    fireEvent.click(screen.getByTestId('create-wave-btn'));

    await waitFor(() => {
      expect(mockRequestAuth).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/waves?new=true');
    });
  });

  it.skip('does not navigate when auth fails', async () => {
    mockRequestAuth.mockResolvedValue({ success: false });
    
    renderComponent({
      connectedProfile: { ...createMockAuthContext().connectedProfile, handle: 'testuser' },
      activeProfileProxy: null,
    });

    fireEvent.click(screen.getByTestId('create-wave-btn'));

    await waitFor(() => {
      expect(mockRequestAuth).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it.skip('shows loading indicator when fetching', () => {
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: true,
      isFetchingNextPage: false,
      status: 'pending',
    });

    renderComponent();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it.skip('handles infinite scroll intersection', () => {
    const mockFetchNextPage = jest.fn();
    
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [mockWaves] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      status: 'success',
    });

    renderComponent();
    
    fireEvent.click(screen.getByTestId('intersection'));
    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it.skip('does not fetch next page when already fetching', () => {
    const mockFetchNextPage = jest.fn();
    
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [mockWaves] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: true,
      isFetching: true,
      isFetchingNextPage: false,
      status: 'success',
    });

    renderComponent();
    
    fireEvent.click(screen.getByTestId('intersection'));
    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });

  it.skip('does not fetch next page when no more pages available', () => {
    const mockFetchNextPage = jest.fn();
    
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [mockWaves] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      status: 'success',
    });

    renderComponent();
    
    fireEvent.click(screen.getByTestId('intersection'));
    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });

  it.skip('handles profile without handle', () => {
    renderComponent({ connectedProfile: null }, { handle: null });
    
    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });
});