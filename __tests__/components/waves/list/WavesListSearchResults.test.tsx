import { render, screen } from '@testing-library/react';
import React from "react";
import WavesListSearchResults from '@/components/waves/list/WavesListSearchResults';
import { useWaves } from '@/hooks/useWaves';
import { ApiWave } from '@/generated/models/ApiWave';
import { ApiWaveType } from '@/generated/models/ApiWaveType';

// Mock dependencies
jest.mock('@/hooks/useWaves');
jest.mock('@/components/waves/list/WaveItem', () => {
  return function MockWaveItem({ wave }: any) {
    return <div data-testid={`wave-item-${wave.id}`}>{wave.name}</div>;
  };
});

jest.mock('@/components/distribution-plan-tool/common/CircleLoader', () => {
  const MockCircleLoader = function MockCircleLoader() {
    return <div data-testid="circle-loader">Loading...</div>;
  };
  
  MockCircleLoader.CircleLoaderSize = {
    SMALL: "SMALL",
    MEDIUM: "MEDIUM", 
    LARGE: "LARGE",
    XLARGE: "XLARGE",
    XXLARGE: "XXLARGE",
  };
  
  return {
    __esModule: true,
    default: MockCircleLoader,
    CircleLoaderSize: MockCircleLoader.CircleLoaderSize,
  };
});

jest.mock('@/components/utils/CommonIntersectionElement', () => {
  return function MockCommonIntersectionElement({ onIntersection }: any) {
    // Simulate intersection for testing
    React.useEffect(() => {
      const timer = setTimeout(() => onIntersection(true), 100);
      return () => clearTimeout(timer);
    }, [onIntersection]);
    return <div data-testid="intersection-element" />;
  };
});

const mockWaves: ApiWave[] = [
  {
    id: 'wave-1',
    name: 'Test Wave 1',
    description: 'Description 1',
    type: ApiWaveType.Chat,
    created_at: new Date().toISOString(),
    author: {
      id: 'author-1',
      handle: 'testauthor',
      pfp: null,
    },
    metrics: {
      drops_count: 10,
      subscribers_count: 5,
    },
    picture: null,
    authenticated_user_eligible: true,
    visibility_group_id: null,
    participation_group_id: null,
    chat_enabled: true,
    voting_group_id: null,
  },
  {
    id: 'wave-2',
    name: 'Test Wave 2',
    description: 'Description 2',
    type: ApiWaveType.Approve,
    created_at: new Date().toISOString(),
    author: {
      id: 'author-2',
      handle: 'testauthor2',
      pfp: null,
    },
    metrics: {
      drops_count: 20,
      subscribers_count: 15,
    },
    picture: null,
    authenticated_user_eligible: true,
    visibility_group_id: null,
    participation_group_id: null,
    chat_enabled: false,
    voting_group_id: null,
  },
];

const mockUseWaves = useWaves as jest.MockedFunction<typeof useWaves>;

describe('WavesListSearchResults', () => {
  const defaultProps = {
    identity: null,
    waveName: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search title', () => {
    mockUseWaves.mockReturnValue({
      waves: [],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: 'success',
    });

    render(<WavesListSearchResults {...defaultProps} />);
    
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('renders wave items when waves are available', () => {
    mockUseWaves.mockReturnValue({
      waves: mockWaves,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: 'success',
    });

    render(<WavesListSearchResults {...defaultProps} />);
    
    expect(screen.getByTestId('wave-item-wave-1')).toBeInTheDocument();
    expect(screen.getByTestId('wave-item-wave-2')).toBeInTheDocument();
    expect(screen.getByText('Test Wave 1')).toBeInTheDocument();
    expect(screen.getByText('Test Wave 2')).toBeInTheDocument();
  });

  it('shows no results message when no waves found and not fetching', () => {
    mockUseWaves.mockReturnValue({
      waves: [],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: 'success',
    });

    render(<WavesListSearchResults {...defaultProps} />);
    
    expect(screen.getByText(
      'No results found. Please try a different keyword or create a new wave.'
    )).toBeInTheDocument();
  });

  it('does not show no results message when fetching', () => {
    mockUseWaves.mockReturnValue({
      waves: [],
      isFetching: true,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: 'pending',
    });

    render(<WavesListSearchResults {...defaultProps} />);
    
    expect(screen.queryByText(
      'No results found. Please try a different keyword or create a new wave.'
    )).not.toBeInTheDocument();
  });

  it('shows loading indicator when fetching', () => {
    mockUseWaves.mockReturnValue({
      waves: [],
      isFetching: true,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: 'pending',
    });

    render(<WavesListSearchResults {...defaultProps} />);
    
    expect(screen.getByTestId('circle-loader')).toBeInTheDocument();
  });

  it('calls fetchNextPage on intersection when conditions are met', async () => {
    const mockFetchNextPage = jest.fn();
    mockUseWaves.mockReturnValue({
      waves: mockWaves,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: mockFetchNextPage,
      status: 'success',
    });

    render(<WavesListSearchResults {...defaultProps} />);
    
    // Wait for intersection to trigger
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it('does not call fetchNextPage when already fetching', async () => {
    const mockFetchNextPage = jest.fn();
    mockUseWaves.mockReturnValue({
      waves: mockWaves,
      isFetching: true,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: mockFetchNextPage,
      status: 'pending',
    });

    render(<WavesListSearchResults {...defaultProps} />);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });

  it('does not call fetchNextPage when no more pages', async () => {
    const mockFetchNextPage = jest.fn();
    mockUseWaves.mockReturnValue({
      waves: mockWaves,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: mockFetchNextPage,
      status: 'success',
    });

    render(<WavesListSearchResults {...defaultProps} />);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });

  it('does not call fetchNextPage when fetching next page', async () => {
    const mockFetchNextPage = jest.fn();
    mockUseWaves.mockReturnValue({
      waves: mockWaves,
      isFetching: false,
      isFetchingNextPage: true,
      hasNextPage: true,
      fetchNextPage: mockFetchNextPage,
      status: 'success',
    });

    render(<WavesListSearchResults {...defaultProps} />);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });

  it('passes correct parameters to useWaves hook', () => {
    mockUseWaves.mockReturnValue({
      waves: [],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: 'success',
    });

    render(<WavesListSearchResults identity="test-identity" waveName="test-wave" />);
    
    expect(mockUseWaves).toHaveBeenCalledWith({
      identity: 'test-identity',
      waveName: 'test-wave',
    });
  });

  it('handles null identity and wave name', () => {
    mockUseWaves.mockReturnValue({
      waves: [],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: 'success',
    });

    render(<WavesListSearchResults identity={null} waveName={null} />);
    
    expect(mockUseWaves).toHaveBeenCalledWith({
      identity: null,
      waveName: null,
    });
  });

  it('renders intersection element for infinite scroll', () => {
    mockUseWaves.mockReturnValue({
      waves: mockWaves,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: jest.fn(),
      status: 'success',
    });

    render(<WavesListSearchResults {...defaultProps} />);
    
    expect(screen.getByTestId('intersection-element')).toBeInTheDocument();
  });
});
